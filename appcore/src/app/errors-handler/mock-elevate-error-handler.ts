import { ElevateErrorHandler } from "./elevate-error-handler";
import { Inject, Injectable } from "@angular/core";
import { VersionsProvider } from "../shared/services/versions/versions-provider";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { LoggerService } from "../shared/services/logging/logger.service";

@Injectable({
  providedIn: "root"
})
export class MockElevateErrorHandler extends ElevateErrorHandler {
  constructor(
    @Inject(VersionsProvider) public readonly versionsProvider: VersionsProvider,
    @Inject(MatDialog) public readonly dialog: MatDialog,
    @Inject(MatSnackBar) public readonly snackBar: MatSnackBar,
    @Inject(LoggerService) public readonly loggerService: LoggerService
  ) {
    super(versionsProvider, dialog, snackBar, loggerService);
  }

  public onErrorHandled(error: Error): void {}

  public displayViewErrorAction(errorMessage: string, error: Error): void {}
}
