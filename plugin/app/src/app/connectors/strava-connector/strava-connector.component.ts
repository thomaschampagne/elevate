import { Component, OnInit } from "@angular/core";
import { SyncMessage } from "@elevate/shared/sync";
import { IpcRendererMessagesService } from "../../shared/services/messages-listener/ipc-renderer-messages.service";
import { StravaApiCredentialsService } from "../../shared/services/strava-api-credentials/strava-api-credentials.service";
import { StravaApiCredentials } from "@elevate/shared/sync/connectors/strava/strava-api-credentials";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { MatSnackBar } from "@angular/material";

@Component({
	selector: "app-strava-connector",
	templateUrl: "./strava-connector.component.html",
	styleUrls: ["./strava-connector.component.scss"]
})
export class StravaConnectorComponent implements OnInit {

	public stravaApiCredentials: StravaApiCredentials;

	constructor(public stravaApiCredentialsService: StravaApiCredentialsService,
				public messagesListenerService: IpcRendererMessagesService,
				public snackBar: MatSnackBar,
				public logger: LoggerService) {
	}

	public ngOnInit(): void {
		this.stravaApiCredentialsService.fetch().then((stravaApiCredentials: StravaApiCredentials) => {
			this.stravaApiCredentials = stravaApiCredentials;
		});
	}

	public onChanges(): void {
		this.persistStravaApiCredentials();
	}

	public stravaAuthentication(): void {

		const linkStravaMessage = new SyncMessage(SyncMessage.FLAG_LINK_STRAVA_CONNECTOR, this.stravaApiCredentials.clientId, this.stravaApiCredentials.clientSecret);
		this.messagesListenerService.sendMessage<string>(linkStravaMessage).then((accessToken: string) => {

			this.stravaApiCredentials.accessToken = accessToken;
			this.persistStravaApiCredentials();

		}, error => {
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

	public persistStravaApiCredentials(): void {
		this.stravaApiCredentialsService.put(this.stravaApiCredentials).then(saveCredentials => {
			this.logger.debug("Strava api credentials saved to: ", saveCredentials);
		}, error => {
			throw error;
		});
	}

}
