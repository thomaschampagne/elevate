import { Inject, Injectable } from "@angular/core";
import { OpenResourceResolver } from "../open-resource-resolver";
import { MatSnackBar } from "@angular/material/snack-bar";

@Injectable()
export class ExtensionOpenResourceResolver extends OpenResourceResolver {
  constructor(@Inject(MatSnackBar) protected readonly snackBar: MatSnackBar) {
    super(snackBar);
  }

  public openActivity(id: number): Promise<boolean> {
    return this.openStravaActivity(id).then(() => Promise.resolve(true));
  }

  public openLink(url: string): Promise<void> {
    window.open(url, "_blank");
    return Promise.resolve();
  }
}
