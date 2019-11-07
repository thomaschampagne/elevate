import { Component, Inject, InjectionToken, OnInit } from "@angular/core";
import { ElectronService } from "../shared/services/electron/electron.service";
import { VERSIONS_PROVIDER, VersionsProvider } from "../shared/services/versions/versions-provider.interface";

export const TOP_BAR_COMPONENT_TOKEN = new InjectionToken<TopBarComponent>("TOP_BAR_COMPONENT_TOKEN");

@Component({template: ""})
export class TopBarComponent {
}

@Component({
	selector: "app-desktop-top-bar",
	template: `
        <div class="top-bar">
            <div class="draggable"></div>
            <span class="top-bar-title mat-body-strong" *ngIf="buildMetadata && buildMetadata.commit && buildMetadata.date">
				Elevate Desktop - {{currentVersion}}+{{buildMetadata.date}}.{{buildMetadata.commit.slice(0, 8)}}
			</span>
            <span class="toolbar-spacer"></span>
            <button mat-icon-button (click)="onMinimizeAppClicked()">
                <mat-icon inline="true">minimize</mat-icon>
            </button>
            <button *ngIf="!isFullscreen" mat-icon-button (click)="onFullscreenAppClicked()">
                <mat-icon inline="true">fullscreen</mat-icon>
            </button>
            <button *ngIf="isFullscreen" mat-icon-button (click)="onNormalScreenAppClicked()">
                <mat-icon inline="true">fullscreen_exit</mat-icon>
            </button>
            <button mat-icon-button (click)="onCloseAppClicked()">
                <mat-icon inline="true">close</mat-icon>
            </button>
        </div>
	`,
	styles: [`
        .top-bar {
            background-color: black;
            display: flex;
            align-items: center;
            color: white;
        }

        .draggable {
            -webkit-app-region: drag;
            position: absolute;
            left: 3px;
            right: 3px;
            top: 3px;
            height: 35px;
        }

        .top-bar-title {
            margin: 0 0 0 16px;
        }

        .toolbar-spacer {
            flex: 1 1 auto;
        }

        button {
            -webkit-app-region: no-drag;
        }

        button:last-child:hover { /* Set close icon red */
            color: #ff4643;
        }
	`]
})
export class DesktopTopBarComponent extends TopBarComponent implements OnInit {

	public isFullscreen: boolean = null;
	public currentVersion: string;
	public buildMetadata: { commit: string, date: string };

	constructor(@Inject(VERSIONS_PROVIDER) public versionsProvider: VersionsProvider,
				public electronService: ElectronService) {
		super();
	}

	public ngOnInit() {

		this.versionsProvider.getInstalledAppVersion().then(version => {
			this.currentVersion = version;
		});

		this.versionsProvider.getBuildMetadata().then((buildMetadata: { commit: string, date: string }) => {
			this.buildMetadata = buildMetadata;
			this.buildMetadata.date = this.buildMetadata.date.slice(0, 10).replace(/-/g, "");
		});

		this.electronService.remote.getCurrentWindow().on("enter-full-screen", event => {
			this.isFullscreen = this.electronService.remote.getCurrentWindow().isFullScreen();
		});

		this.electronService.remote.getCurrentWindow().addListener("leave-full-screen", event => {
			this.isFullscreen = this.electronService.remote.getCurrentWindow().isFullScreen();
		});

		this.isFullscreen = this.electronService.remote.getCurrentWindow().isFullScreen();
	}

	public onMinimizeAppClicked() {
		this.electronService.remote.getCurrentWindow().minimize();
	}

	public onCloseAppClicked() {
		this.electronService.remote.getCurrentWindow().close();
	}

	public onFullscreenAppClicked() {
		this.electronService.remote.getCurrentWindow().setFullScreen(true);
	}

	public onNormalScreenAppClicked() {
		this.electronService.remote.getCurrentWindow().setFullScreen(false);
	}
}


@Component({
	selector: "app-extension-top-bar",
	template: ""
})
export class ExtensionTopBarComponent extends TopBarComponent {
}
