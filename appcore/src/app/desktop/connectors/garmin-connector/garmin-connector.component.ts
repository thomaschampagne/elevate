import { ChangeDetectorRef, Component, inject, Inject, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Subscription } from "rxjs";
import { GarminConnectorService } from "./garmin-connector.service";
import { GarminConnectorInfo } from "@elevate/shared/sync/connectors/garmin-connector-info.model";
import { SyncService } from "../../../shared/services/sync/sync.service";
import { DesktopSyncService } from "../../../shared/services/sync/impl/desktop-sync.service";
import {
  OPEN_RESOURCE_RESOLVER,
  OpenResourceResolver
} from "../../../shared/services/links-opener/open-resource-resolver";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { ConnectorsComponent } from "../connectors.component";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { AppService } from "../../../shared/services/app-service/app.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { StatusCodes } from "http-status-codes";

/**
 * Mirrors strava-connector.component.ts, but instead of a "Connect with
 * Strava" OAuth redirect button, this shows a simple email/password form
 * (Garmin has no public OAuth consent screen we can redirect to) — plus an
 * MFA code step that appears mid-submit if Garmin challenges the login.
 *
 * IMPORTANT: this depends only on GarminConnectorService (Angular-side,
 * relays over IPC to the main process).
 **/
@Component({
  selector: "app-garmin-connector",
  templateUrl: "./garmin-connector.component.html",
  styleUrls: ["./garmin-connector.component.scss"]
})
export class GarminConnectorComponent extends ConnectorsComponent implements OnInit, OnDestroy {
  public garminConnectorInfo: GarminConnectorInfo;

  public showConfigure: boolean;
  public form: FormGroup;
  public mfaForm: FormGroup;
  public passwordInput: string = "";
  public mfaCode: string = "";
  public isAuthenticating = false;
  public awaitingMfaCode = false;
  public errorMessage: string | null = null;

  public historyChangesSub: Subscription;

  private mfaRequestedSub: Subscription;

  constructor(
    @Inject(AppService) public readonly appService: AppService,
    @Inject(GarminConnectorService) private readonly garminConnectorService: GarminConnectorService,
    @Inject(SyncService) protected readonly desktopSyncService: DesktopSyncService,
    @Inject(OPEN_RESOURCE_RESOLVER) protected readonly openResourceResolver: OpenResourceResolver,
    @Inject(Router) protected readonly router: Router,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar,
    @Inject(MatDialog) protected readonly dialog: MatDialog,
    private readonly cdr: ChangeDetectorRef
  ) {
    super(desktopSyncService, openResourceResolver, router, dialog);
    this.connectorType = ConnectorType.GARMIN;
    this.showConfigure = false;
  }

  public ngOnInit(): void {
    this.garminConnectorService.fetch().then((garminConnectorInfo: GarminConnectorInfo) => {
      this.updateSyncDateTimeText();
    });
    this.historyChangesSub = this.appService.historyChanges$.subscribe(() => {
      this.ngOnDestroy();
      this.ngOnInit();
    });

    this.garminConnectorService.fetch().then(info => {
      this.garminConnectorInfo = info;
    });

    // Fires mid-onSubmit() if garmin_sync.py challenges the login with MFA.
    // See garmin-connector.service.ts / ipc-garmin-link.listener.ts for the
    // full round trip this is the UI end of.
    this.mfaRequestedSub = this.garminConnectorService.mfaRequested$.subscribe(() => {
      console.log("[Garmin Component] MFA Requested via event@");
      this.awaitingMfaCode = true;
      this.cdr.detectChanges();
    });
  }

  public onConfigure(): void {
    this.showConfigure = true;
  }

  public onUsernameChange(): void {
    this.resetTokens();
  }

  public onPasswordChange(): void {
    this.resetTokens();
  }

  public resetTokens(): void {}

  public ngOnDestroy(): void {
    this.mfaRequestedSub?.unsubscribe();
    this.historyChangesSub.unsubscribe();
  }

  public async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.isAuthenticating = true;
    this.errorMessage = null;

    try {
      const { username, password } = this.form.value;
      this.garminConnectorInfo = await this.garminConnectorService.authenticate(username, password);
      this.form.get("password").reset();
    } catch (err) {
      this.errorMessage = err?.message || "Unable to connect to Garmin. Please check your credentials and retry.";
    } finally {
      this.isAuthenticating = false;
      this.awaitingMfaCode = false;
      this.mfaForm.reset();
    }
  }

  public garminAuthentication(): void {
    const password = this.passwordInput;
    const mfaCode = this.awaitingMfaCode ? this.mfaCode : null;

    this.isAuthenticating = true;
    this.errorMessage = null;
    this.garminConnectorService
      .authenticate(password, mfaCode)
      .then((garminConnectorInfo: GarminConnectorInfo) => {
        this.garminConnectorInfo = garminConnectorInfo;
        this.showConfigure = false;
        this.awaitingMfaCode = false;
        this.passwordInput = "";
        this.mfaCode = "";
        this.snackBar.open("Garmin successfully connected", "Ok", { duration: 3000 });
      })
      .catch(error => {
        let errorMessage = "Unable to connect to Garmin.";
        if (error?.message?.includes("MFA_REQUIRED")) {
          this.awaitingMfaCode = true;
          errorMessage = "Garmin requires an MFA code. Please check your email.";
        } else if (error?.statusCode === StatusCodes.UNAUTHORIZED) {
          errorMessage = "Invalid Garmin username or password.";
        } else if (error?.message) {
          errorMessage = error.message;
        }
        this.snackBar.open(errorMessage, "Ok");
      })
      .finally(() => {
        this.isAuthenticating = false;
        this.passwordInput = null;
      });
  }

  public onSubmitMfaCode(): void {
    // Unblocks the pending onMfaRequired() promise in the main process,
    // which unblocks garmin_sync.py's stdin read. onSubmit()'s await above
    // then resumes once login completes (or fails) past that point.
    this.garminConnectorService.submitMfaCode(this.mfaCode);
    this.awaitingMfaCode = false;
  }

  public sync(fastSync: boolean = null, forceSync: boolean = null): Promise<void> {
    return this.garminConnectorService.sync(fastSync, forceSync).catch(err => {
      if (err !== ConnectorsComponent.ATHLETE_CHECKING_FIRST_SYNC_MESSAGE) {
        return Promise.reject(err);
      }
      return Promise.resolve();
    });
  }

  public onDisconnect(): void {
    // NOTE: local-only — clears the connector card's connected state. It does
    // not currently delete the garth session cache on disk (tokenstoreDir in
    // garmin-authenticator.ts) or revoke anything on Garmin's side.
    this.garminConnectorInfo.username = null;
    this.garminConnectorInfo.garminAccount = null;
    this.garminConnectorService.garminConnectorInfoService.update(this.garminConnectorInfo);
  }
}
