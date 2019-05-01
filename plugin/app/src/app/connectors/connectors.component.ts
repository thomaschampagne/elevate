import { Component, OnInit } from "@angular/core";
import { IpcRendererMessagesService } from "../shared/services/messages-listener/ipc-renderer-messages.service";
import { SyncMessage } from "@elevate/shared/sync";

@Component({
	selector: "app-connectors",
	templateUrl: "./connectors.component.html",
	styleUrls: ["./connectors.component.scss"]
})
export class ConnectorsComponent implements OnInit {

	public stravaAccessToken: string;

	constructor(public messagesListenerService: IpcRendererMessagesService) {
	}

	public ngOnInit(): void {

	}

	public linkStrava(): void {

		const clientId = 32792;
		const clientSecret = "9ffa2c96affc5996d657e727c6a7081c7c7babc4";
		// const clientSecret = "9ffa2c96affc5996d657e727c6a7081c7c7babc5";
		const scope = "write";

		this.messagesListenerService.sendMessage<string>(new SyncMessage(SyncMessage.FLAG_LINK_STRAVA_CONNECTOR, clientId, clientSecret, scope)).then((accessToken: string) => {
			this.stravaAccessToken = accessToken;
		}, error => {
			console.error(error);
			this.stravaAccessToken = error;
		});

	}
}
