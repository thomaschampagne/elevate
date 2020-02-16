import { Injectable } from "@angular/core";
import { OpenResourceResolver } from "../open-resource-resolver";
import { MatSnackBar } from "@angular/material/snack-bar";

@Injectable()
export class ExtensionOpenResourceResolver extends OpenResourceResolver {

	constructor(public snackBar: MatSnackBar) {
		super(snackBar);
	}

	public openActivity(id: number | string): void {
		this.openWebLink("https://www.strava.com/activities/" + id);
	}

	public openWebLink(url: string): void {
		window.open(url, "_blank");
	}
}

