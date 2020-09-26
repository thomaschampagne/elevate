import { Inject, Injectable } from "@angular/core";
import { OpenResourceResolver } from "../open-resource-resolver";
import { MatSnackBar } from "@angular/material/snack-bar";

@Injectable()
export class ExtensionOpenResourceResolver extends OpenResourceResolver {
  constructor(@Inject(MatSnackBar) protected readonly snackBar: MatSnackBar) {
    super(snackBar);
  }

  public openActivity(id: number): void {
    this.openStravaActivity(id);
  }

  public openLink(url: string): void {
    window.open(url, "_blank");
  }
}
