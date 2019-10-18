import { Component, OnInit } from "@angular/core";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { StravaApiCredentials } from "@elevate/shared/sync";
import { ConnectorsComponent } from "../connectors.component";
import { StravaConnectorService } from "../services/strava-connector.service";
import * as moment from "moment";
import * as HttpCodes from "http-status-codes";

@Component({
	selector: "app-strava-connector",
	templateUrl: "./strava-connector.component.html",
	styleUrls: ["./strava-connector.component.scss"]
})
export class StravaConnectorComponent extends ConnectorsComponent implements OnInit {

	public stravaApiCredentials: StravaApiCredentials;
	public expiresAt: string;

	constructor(public stravaConnectorService: StravaConnectorService,
				public snackBar: MatSnackBar,
				public logger: LoggerService) {
		super();
	}

	public ngOnInit(): void {

		this.stravaConnectorService.fetchCredentials().then((stravaApiCredentials: StravaApiCredentials) => {
			this.handleCredentialsChanges(stravaApiCredentials);
		});

		this.stravaConnectorService.stravaApiCredentials$.subscribe((stravaApiCredentials: StravaApiCredentials) => {
			this.handleCredentialsChanges(stravaApiCredentials);
		});
	}

	public handleCredentialsChanges(stravaApiCredentials: StravaApiCredentials): void {
		setTimeout(() => {
			this.stravaApiCredentials = stravaApiCredentials;
			this.expiresAt = (this.stravaApiCredentials.expiresAt > 0) ? moment(this.stravaApiCredentials.expiresAt).format("LLLL") : null;
		});
	}

	public onClientIdChange(): void {
		this.resetTokens();
	}

	public onClientSecretChange(): void {
		this.resetTokens();
	}

	public resetTokens(): void {
		this.stravaConnectorService.fetchCredentials().then((stravaApiCredentials: StravaApiCredentials) => {
			stravaApiCredentials.clientId = this.stravaApiCredentials.clientId;
			stravaApiCredentials.clientSecret = this.stravaApiCredentials.clientSecret;
			stravaApiCredentials.accessToken = null;
			stravaApiCredentials.refreshToken = null;
			stravaApiCredentials.expiresAt = null;
			return this.stravaConnectorService.stravaApiCredentialsService.save(stravaApiCredentials);
		}).then((stravaApiCredentials: StravaApiCredentials) => {
			this.stravaApiCredentials = stravaApiCredentials;
		});
	}

	public stravaAuthentication(): void {
		this.stravaConnectorService.authenticate().then((stravaApiCredentials: StravaApiCredentials) => {
			this.stravaApiCredentials = stravaApiCredentials;
		}).catch(error => {

			let errorMessage = null;

			if (error.statusCode === HttpCodes.UNAUTHORIZED) {
				errorMessage = "Unauthorized access to strava. Check your client id and client secret.";
			} else if (error.statusCode === HttpCodes.FORBIDDEN) {
				errorMessage = "Forbidden access to strava. Please check your client id and client secret.";
			} else {
				throw error;
			}

			this.snackBar.open(errorMessage, "Ok");
		});
	}

	public sync(fastSync: boolean = null): void {
		this.stravaConnectorService.sync(fastSync);
	}

}
