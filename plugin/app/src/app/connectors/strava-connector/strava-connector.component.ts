import { Component, OnInit } from "@angular/core";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { StravaApiCredentials } from "@elevate/shared/sync";
import { ConnectorsComponent } from "../connectors.component";
import { StravaConnectorService } from "../services/strava-connector.service";
import * as moment from "moment";

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
		this.stravaApiCredentials = stravaApiCredentials;
		this.expiresAt = (this.stravaApiCredentials.expiresAt > 0) ? moment(this.stravaApiCredentials.expiresAt).format("LLLL") : null;
	}

	public onClientIdChange(): void {

		this.stravaConnectorService.fetchCredentials().then((stravaApiCredentials: StravaApiCredentials) => {
			stravaApiCredentials.clientId = this.stravaApiCredentials.clientId;
			this.stravaConnectorService.stravaApiCredentialsService.save(stravaApiCredentials);
		});
	}

	public onClientSecretChange(): void {
		this.stravaConnectorService.fetchCredentials().then((stravaApiCredentials: StravaApiCredentials) => {
			stravaApiCredentials.clientSecret = this.stravaApiCredentials.clientSecret;
			this.stravaConnectorService.stravaApiCredentialsService.save(stravaApiCredentials);
		});
	}

	public stravaAuthentication(): void {

		this.stravaConnectorService.authenticate().then((stravaApiCredentials: StravaApiCredentials) => {
			this.stravaApiCredentials = stravaApiCredentials;
		}).catch(error => {
			// TODO Better handling of this...
			if (error && error.code) {
				if (error.code === "ECONNREFUSED") {
					const message = `Unable to connect to ${error.address}:${error.port}. Please check your connection and proxy settings`;
					this.snackBar.open(message, "Close");
					this.logger.warn(message, JSON.stringify(error));
				}

			} else {
				throw error;
			}

		});

	}

	public sync(): void {
		this.stravaConnectorService.sync(false, false);
	}

	public stop(): void {
		// this.stravaConnectorService.stop();
		alert("to be bind");
	}

	tmpSetSyncDateTime() {
		this.stravaConnectorService.syncService.saveSyncDateTime(new Date().getTime());
	}
}
