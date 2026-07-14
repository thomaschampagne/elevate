import { spawn } from "child_process";
import readline from "readline";
import path from "path";
import { app } from "electron";
import { inject, singleton } from "tsyringe";
import { Logger } from "../logger";
import * as fs from "fs";

export interface RunOptions {
  /**
   * Called when garmin_sync.py signals it needs an MFA code mid-login.
   * Must resolve with the code the user entered. If omitted and the script
   * requests MFA anyway (e.g. during a background resume() with no user
   * context), the run is rejected with `mfa_required_but_not_interactive`
   * rather than hanging — callers doing non-interactive work should NOT
   * pass this.
   */
  onMfaRequired?: () => Promise<string>;
  /** How long to wait for onMfaRequired() to resolve before giving up and killing the process. Default 120s. */
  mfaTimeoutMs?: number;
}

/**
 * Spawns desktop/resources/garmin_sync/garmin_sync.py and talks
 * to it over stdio. Streams stdout line-by-line, because garmin_sync.py can
 * emit a mid-flight {"status":"mfa_required"} line and then block reading a
 * code from stdin — see prompt_mfa_via_stdio() in the script.
 *
 * Progress lines go to stderr and are just forwarded to the logger; only
 * stdout lines are treated as protocol (control/result) messages.
 */
@singleton()
export class GarminCliRunner {
  constructor(@inject(Logger) private readonly logger: Logger) {}

  private get scriptPath(): string {
    const isWindows = process.platform === "win32";
    const binaryName = isWindows ? "garmin_sync.exe" : "garmin_sync";

    if (app.isPackaged) {
      // Prod
      return path.join(process.resourcesPath, "bin", binaryName);
    }
    // Dev
    return path.join(__dirname, "../dist", binaryName);
  }

  public run(args: string[], options: RunOptions = {}): Promise<any> {
    const binaryPath = this.scriptPath;
    if (!fs.existsSync(binaryPath)) {
      throw new Error(`Garmin binary not found at '${binaryPath}'.`);
    }
    return new Promise((resolve, reject) => {
      const child = spawn(binaryPath, args);
      const rl = readline.createInterface({ input: child.stdout });

      let settled = false;
      let mfaTimeout: NodeJS.Timeout | null = null;

      const settle = (fn: () => void) => {
        if (settled) {
          return;
        }
        settled = true;
        if (mfaTimeout) {
          clearTimeout(mfaTimeout);
        }
        rl.close();
        fn();
      };

      rl.on("line", line => {
        line = line.trim();
        if (!line) {
          return;
        }

        let parsed: any;
        try {
          parsed = JSON.parse(line);
        } catch {
          this.logger.warn(`[garmin_sync] non-JSON stdout line ignored: ${line}`);
          return;
        }

        if (parsed.status === "mfa_required") {
          if (!options.onMfaRequired) {
            settle(() => reject(new Error("mfa_required_but_not_interactive")));
            child.kill();
            return;
          }

          mfaTimeout = setTimeout(() => {
            settle(() => reject(new Error("mfa_timeout")));
            child.kill();
          }, options.mfaTimeoutMs ?? 120_000);

          options
            .onMfaRequired()
            .then(code => {
              if (mfaTimeout) {
                clearTimeout(mfaTimeout);
                mfaTimeout = null;
              }
              child.stdin.write(`${code}\n`);
            })
            .catch(err => {
              settle(() => reject(err instanceof Error ? err : new Error(String(err))));
              child.kill();
            });
          return;
        }

        if (parsed.status === "success") {
          settle(() => resolve(parsed));
          return;
        }

        if (parsed.status === "error") {
          settle(() => reject(new Error(parsed.message || "garmin_sync.py reported an error")));
          return;
        }
      });

      child.stderr.on("data", chunk => {
        chunk
          .toString()
          .split("\n")
          .filter(Boolean)
          .forEach((l: string) => this.logger.info(`[garmin_sync] ${l}`));
      });

      child.on("error", err => {
        settle(() => reject(new Error(`Failed to spawn '${binaryPath}': ${err.message}`)));
      });

      child.on("close", () => {
        settle(() => reject(new Error("garmin_sync.py exited without a result")));
      });
    });
  }
}
