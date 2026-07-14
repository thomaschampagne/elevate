#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "garminconnect>=0.3.6",
# ]
# ///
"""
garmin_sync.py — one-shot CLI invoked by Node (via `uv run`) to authenticate
with Garmin Connect and download activity files. Based on a verified-working
reference implementation using the `garminconnect` library directly, rather
than a hand-rolled stdio JSON-RPC protocol.

Design: one-shot, not a long-lived process. Node spawns this once per
operation (auth-check, or a full sync run), waits for it to exit, and parses
the single JSON object printed on stdout as the last line. All progress/log
lines go to stderr so they never corrupt that final JSON parse.

Modes:
  --auth-only            Log in (or resume a cached session) and exit,
                          printing profile info. Used for the initial
                          "Connect Garmin account" step and for a quick
                          session-validity check before a full sync.
  (default)               Log in / resume, list + download activities,
                          print a manifest of downloaded files.

Flags of note:
  --no-interactive        Never fall back to input()/getpass() prompts.
                          Required when spawned from Electron with no TTY —
                          without this, a bad/missing cached session would
                          hang forever waiting for stdin.
  --after ISO_DATETIME    Only return/download activities starting after
                          this timestamp (maps to Elevate's syncFromDateTime).
  --format ORIGINAL|GPX|TCX  ORIGINAL (native .fit) is the default and the
                          one Elevate's FileConnector-based parser expects —
                          it carries Garmin-specific fields (running
                          dynamics, training effect, etc.) that GPX/TCX lose.
"""

import argparse
import io
import json
import os
import sys
import traceback
import zipfile
from datetime import datetime
from pathlib import Path

from garminconnect import Garmin
from garminconnect.exceptions import (
    GarminConnectAuthenticationError,
    GarminConnectConnectionError,
    GarminConnectTooManyRequestsError,
)


def log(msg: str) -> None:
    """Progress/diagnostic output. Always stderr — stdout is reserved for
    the single final JSON result line."""
    print(msg, file=sys.stderr, flush=True)


def prompt_mfa_via_stdio() -> str:
    """
    MFA callback that never touches a TTY. Signals the caller (Node, via
    stdout) that a code is needed, then blocks reading exactly one line from
    stdin for it. Node's GarminCliRunner watches stdout for this signal,
    round-trips to the UI to collect the code, and writes it (plus a
    newline) to this process's stdin — see garmin-cli-runner.ts.

    This is deliberately NOT gated by --no-interactive: --no-interactive only
    controls whether missing email/password falls back to input()/getpass().
    MFA handling here never uses those — it's headless-safe by construction,
    as long as the caller is actually listening for the stdout signal.
    """
    log(
        "MFA Challenge received from Garmin - signaling caller and waiting for code on stdin..."
    )
    print(json.dumps({"status": "mfa_required"}), flush=True)
    code = sys.stdin.readline().strip()
    if not code:
        raise RuntimeError("mfa_code_not_provided")
    return code


def init_api(
    tokenstore: str, email: str | None, password: str | None, no_interactive: bool
) -> Garmin:
    tokenstore_path = str(Path(tokenstore).expanduser())

    try:
        log(f"Attempting to resume session from {tokenstore_path}")
        garmin = Garmin()
        garmin.login(tokenstore_path)
        log("Resumed cached session.")
        return garmin
    except GarminConnectTooManyRequestsError as err:
        raise RuntimeError(f"rate_limited: {err}") from err
    except (
        FileNotFoundError,
        GarminConnectAuthenticationError,
        GarminConnectConnectionError,
    ):
        log("No valid cached session found.")

    if not email or not password:
        if no_interactive:
            raise RuntimeError("no_valid_session")
        email = email or input("Email: ").strip()
        password = password or __import__("getpass").getpass("Password: ")

    try:
        garmin = Garmin(email=email, password=password, prompt_mfa=prompt_mfa_via_stdio)
        log("Calling garmin.login()...")
        garmin.login(tokenstore_path)
        log(f"Login successful. Session cached to: {tokenstore_path}")
        return garmin
    except GarminConnectTooManyRequestsError as err:
        log(f"garmin.login() raised GarminConnectTooManyRequestsEror: {err!r}")
        log(traceback.format_exc())
        raise RuntimeError(f"rate_limited: {err}") from err
    except GarminConnectAuthenticationError as err:
        log(f"garmin.login() raised GarminConnectAuthenticationError: {err!r}")
        log(traceback.format_exc())
        raise RuntimeError(f"invalid_credentials: {err}") from err
    except GarminConnectConnectionError as err:
        log(f"garmin.login() raised GarminConnectConnectionError: {err!r}")
        log(traceback.format_exc())
        raise RuntimeError(f"connection_error: {err}") from err
    except Exception as err:
        log(f"garmin_login() raised unexpected {type(err).__name__}: {err!r}")
        log(traceback.format_exc())
        raise RuntimeError(
            f"unexpected_login_error: {type(err).__name__}: {err}"
        ) from err


def download_fit(api: Garmin, activity_id: int, dest_path: str) -> None:
    data = api.download_activity(
        activity_id, dl_fmt=Garmin.ActivityDownloadFormat.ORIGINAL
    )

    # Garmin sometimes wraps the "original" download in a zip (observed with
    # some device families / multi-sport activities) — unwrap so Node always
    # gets a bare .fit on disk.
    if data[:2] == b"PK":
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            fit_members = [n for n in zf.namelist() if n.lower().endswith(".fit")]
            if not fit_members:
                raise RuntimeError(f"zip_contained_no_fit_file: activity {activity_id}")
            data = zf.read(fit_members[0])

    with open(dest_path, "wb") as f:
        f.write(data)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", default=os.getenv("GARMIN_EMAIL"))
    parser.add_argument("--password", default=os.getenv("GARMIN_PASSWORD"))
    parser.add_argument(
        "--tokenstore", default=os.getenv("GARMINTOKENS", "~/.garminconnect")
    )
    parser.add_argument("--outdir", default=None, help="Required unless --auth-only")
    parser.add_argument(
        "--limit",
        type=int,
        default=20,
        help="Max activities to download in this invocation",
    )
    parser.add_argument(
        "--start",
        type=int,
        default=0,
        help="Pagination offset, for resuming across invocations",
    )
    parser.add_argument(
        "--after", default=None, help="ISO datetime; only activities after this"
    )
    parser.add_argument("--auth-only", action="store_true")
    parser.add_argument("--no-interactive", action="store_true")
    args = parser.parse_args()

    try:
        api = init_api(args.tokenstore, args.email, args.password, args.no_interactive)

        profile = {"displayName": api.get_full_name()}

        if args.auth_only:
            print(json.dumps({"status": "success", "profile": profile}))
            return

        if not args.outdir:
            raise RuntimeError("outdir_required")

        after_dt = datetime.fromisoformat(args.after) if args.after else None
        os.makedirs(args.outdir, exist_ok=True)

        start = args.start
        page_size = 20
        manifest = []
        exhausted = False

        while len(manifest) < args.limit:
            log(f"Listing activities (start={start})...")
            page = api.get_activities(start, page_size)
            if not page:
                exhausted = True
                break

            stop = False
            for activity in page:
                start_local = activity.get("startTimeLocal")
                if (
                    after_dt
                    and start_local
                    and datetime.fromisoformat(start_local) < after_dt
                ):
                    stop = True
                    break

                activity_id = activity["activityId"]
                file_path = os.path.join(args.outdir, f"{activity_id}.fit")

                log(
                    f"Downloading activity {activity_id} ({activity.get('activityName')})..."
                )
                download_fit(api, activity_id, file_path)

                manifest.append(
                    {
                        "activityId": activity_id,
                        "activityName": activity.get("activityName"),
                        "startTimeLocal": start_local,
                        "activityType": (activity.get("activityType") or {}).get(
                            "typeKey"
                        ),
                        "path": file_path,
                    }
                )
                start += 1

                if len(manifest) >= args.limit:
                    break

            if stop or len(page) < page_size:
                exhausted = True
                break

        print(
            json.dumps(
                {
                    "status": "success",
                    "profile": profile,
                    "files": manifest,
                    "nextStart": start,
                    "exhausted": exhausted,
                }
            )
        )

    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
