import { Component, OnInit } from "@angular/core";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { StravaApiCredentials } from "@elevate/shared/sync";
import { ConnectorsComponent } from "../connectors.component";
import { StravaConnectorService } from "../services/strava-connector.service";
import * as moment from "moment";
import * as HttpCodes from "http-status-codes";
import { DesktopSyncService } from "../../shared/services/sync/impl/desktop-sync.service";
import { SyncState } from "../../shared/services/sync/sync-state.enum";
import { ElectronService } from "../../shared/services/electron/electron.service";
import { adjectives, animals, colors, names, uniqueNamesGenerator } from "unique-names-generator";
import _ from "lodash";
import jdenticon from "jdenticon";
import { MatDialog } from "@angular/material";

class GeneratedStravaApiApplication {
	public appName: string;
	public webSite: string;
	public imageFileName: string;
}

@Component({
	selector: "app-strava-connector",
	templateUrl: "./strava-connector.component.html",
	styleUrls: ["./strava-connector.component.scss"]
})
export class StravaConnectorComponent extends ConnectorsComponent implements OnInit {

	public stravaApiCredentials: StravaApiCredentials;
	public expiresAt: string;
	public isSynced: boolean;
	public generatedStravaApiApplication: GeneratedStravaApiApplication;
	public showConfigure: boolean;
	public showHowTo: boolean;

	constructor(public stravaConnectorService: StravaConnectorService,
				public desktopSyncService: DesktopSyncService,
				public electronService: ElectronService,
				public snackBar: MatSnackBar,
				public logger: LoggerService,
				public dialog: MatDialog) {
		super(electronService, dialog);
		this.isSynced = false;
		this.generatedStravaApiApplication = null;
		this.showConfigure = false;
		this.showHowTo = false;
	}

	public ngOnInit(): void {

		this.desktopSyncService.getSyncState().then((syncState: SyncState) => {
			this.isSynced = syncState === SyncState.SYNCED;
			return this.stravaConnectorService.fetchCredentials();
		}).then((stravaApiCredentials: StravaApiCredentials) => {
			this.handleCredentialsChanges(stravaApiCredentials);
		});

		this.stravaConnectorService.stravaApiCredentials$.subscribe((stravaApiCredentials: StravaApiCredentials) => {
			this.handleCredentialsChanges(stravaApiCredentials);
		});
	}

	public refreshRandomStravaApiApplication(): void {
		this.randomStravaApiApplication().then((generatedStravaApiApplication: GeneratedStravaApiApplication) => {
			this.generatedStravaApiApplication = generatedStravaApiApplication;
			setTimeout(() => jdenticon.update("#appIcon", this.generatedStravaApiApplication.appName));
		}).catch(err => {
			throw err;
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
			stravaApiCredentials.clientSecret = (this.stravaApiCredentials.clientSecret) ? this.stravaApiCredentials.clientSecret.trim() : null;
			stravaApiCredentials.accessToken = null;
			stravaApiCredentials.refreshToken = null;
			stravaApiCredentials.expiresAt = null;
			return this.stravaConnectorService.stravaApiCredentialsService.save(stravaApiCredentials);
		}).then((stravaApiCredentials: StravaApiCredentials) => {
			this.stravaApiCredentials = stravaApiCredentials;
			// Force clear cookie to allow connection with another strava account
			this.electronService.electron.remote.getCurrentWindow().webContents.session.clearStorageData({storages: ["cookies"]});
		});
	}

	public stravaAuthentication(): void {
		this.stravaConnectorService.authenticate().then((stravaApiCredentials: StravaApiCredentials) => {
			this.stravaApiCredentials = stravaApiCredentials;
			this.showConfigure = false;
			this.showHowTo = false;
		}).catch(error => {

			let errorMessage = null;

			if (error.statusCode === HttpCodes.UNAUTHORIZED) {
				errorMessage = "Unauthorized access to strava. Check your client id and client secret.";
			} else if (error.statusCode === HttpCodes.FORBIDDEN) {
				errorMessage = "Forbidden access to strava. Please check your client id and client secret.";
			} else if (error.code === "EADDRINUSE") {
				errorMessage = "A Strava login window is already opened. Please use it.";
			} else {
				throw error;
			}

			this.snackBar.open(errorMessage, "Ok");
		});
	}

	public sync(fastSync: boolean = null): void {
		this.stravaConnectorService.sync(fastSync);
	}

	public disconnect(): void {
		this.resetTokens();
	}

	public randomStravaApiApplication(): Promise<GeneratedStravaApiApplication> {

		return new Promise(resolve => {

			this.logger.info("Generating a random strava api application");

			const appNameDictionaries = Math.floor(Math.random() * 10) % 2 === 0 ? [colors, adjectives, animals] : [adjectives, colors, names];

			const appName = uniqueNamesGenerator({
				dictionaries: appNameDictionaries,
				style: "lowerCase",
				separator: " "
			});

			const webSite = "https://" + uniqueNamesGenerator({
				dictionaries: [adjectives, names],
				style: "lowerCase",
				separator: ".",
				length: 2
			}) + "." + ["com", "org", "io"][Math.floor(Math.random() * 10) % 3];

			const imageFileName = Math.floor(Math.random() * 10000000).toString(16) + ".png";

			resolve({
				appName: _.upperFirst(appName),
				imageFileName: imageFileName,
				webSite: webSite
			});

		});
	}

	public onConfigure(): void {
		this.showConfigure = true;
	}

	public onHowToClicked(): void {
		this.showHowTo = true;
		this.refreshRandomStravaApiApplication();
	}
}
