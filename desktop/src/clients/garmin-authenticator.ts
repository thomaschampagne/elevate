import path from "path";
import { app } from "electron";
import { inject, singleton } from "tsyringe";
import { GarminCliRunner } from "./garmin-cli-runner";
import { GarminAccount } from "@elevate/shared/sync/garmin/garmin-account";

@singleton()
export class GarminAuthenticator {
  constructor(@inject(GarminCliRunner) private readonly cli: GarminCliRunner) {}

  private get tokenstoreDir(): string {
    return path.join(app.getPath("userData"), "garmin-session");
  }

  /**
   * Attempts to resume a previously-authenticated session with no password.
   * This runs during background sync with no user context to prompt.
   * If Garmin unexpectedly challenges MFA here (shouldn't normally happen for a cached session), the run
   * rejects with mfa_required_but_not_interactive and resume() below just
   * treats that the same as "no valid session" — surfacing as "please
   * reconnect your Garmin account" rather than popping a prompt out of
   * nowhere mid-sync.
   */
  public async resume(): Promise<GarminAccount | null> {
    try {
      const result = await this.cli.run(["--tokenstore", this.tokenstoreDir, "--auth-only", "--no-interactive"]);
      return new GarminAccount(result.profile.displayName, result.profile.displayName, null);
    } catch {
      return null;
    }
  }

  /**
   * Interactive first-time login. `onMfaRequired` is called (mid-process,
   * potentially) if Garmin challenges the login with an MFA code — it must
   * resolve with the code the user enters in the UI. See
   * GarminCliRunner.run()'s protocol docs and ipc-garmin-link.listener.ts
   * for how that round-trips through to the renderer.
   */
  public async login(username: string, password: string, onMfaRequired: () => Promise<string>): Promise<GarminAccount> {
    const result = await this.cli.run(
      ["--email", username, "--password", password, "--tokenstore", this.tokenstoreDir, "--auth-only"],
      { onMfaRequired }
    );
    return new GarminAccount(result.profile.displayName, result.profile.displayName, null);
  }
}
