import { InjectionToken } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";

export const OPEN_RESOURCE_RESOLVER = new InjectionToken<OpenResourceResolver>("OPEN_RESOURCE_RESOLVER");

export abstract class OpenResourceResolver {
    protected constructor(public snackBar: MatSnackBar) {}

    public abstract openLink(url: string): void;

    public abstract openActivity(id: number | string): void;

    public abstract openSourceActivity(id: number | string): void;

    public openActivities(ids: (number | string)[]): void {
        if (ids.length > 0) {
            ids.forEach(id => this.openActivity(id));
        } else {
            this.snackBar.open(`Activity with id ${JSON.stringify(ids)} not found`, "Close");
        }
    }
}
