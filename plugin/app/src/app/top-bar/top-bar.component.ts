import { Component, Inject, InjectionToken, OnInit } from "@angular/core";
import { ElectronService } from "../shared/services/electron/electron.service";
import { VERSIONS_PROVIDER, VersionsProvider } from "../shared/services/versions/versions-provider.interface";

export const TOP_BAR_COMPONENT_TOKEN = new InjectionToken<TopBarComponent>("TOP_BAR_COMPONENT_TOKEN");

@Component({template: ""})
export class TopBarComponent implements OnInit {
	public ngOnInit(): void {
	}
}

@Component({
	selector: "app-desktop-top-bar",
	template: `
        <div class="top-bar">
			<span class="top-bar-title mat-subheading-1">
			Elevate v{{currentVersion}}
			</span>
            <span class="toolbar-spacer"></span>
            <button mat-icon-button (click)="onMinimizeAppClicked()">
                <mat-icon>minimize</mat-icon>
            </button>
            <button *ngIf="!isMaximized" mat-icon-button (click)="onMaximizeAppClicked()">
                <mat-icon>fullscreen</mat-icon>
            </button>
            <button *ngIf="isMaximized" mat-icon-button (click)="onUnMaximizeAppClicked()">
                <mat-icon>fullscreen_exit</mat-icon>
            </button>
            <button mat-icon-button (click)="onCloseAppClicked()">
                <mat-icon>close</mat-icon>
            </button>
        </div>
	`,
	styles: [`
        .top-bar {
            -webkit-app-region: drag;
            background-color: black;
            display: flex;
            align-items: center;
            color: white;
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

        .mat-icon {
            transform: scale(0.75);
        }
	`]
})
export class DesktopTopBarComponent implements OnInit {

	public isMaximized: boolean;
	public currentVersion: string;

	constructor(@Inject(VERSIONS_PROVIDER) public versionsProvider: VersionsProvider,
				public electronService: ElectronService) {
	}

	public ngOnInit() {

		this.versionsProvider.getInstalledAppVersion().then(version => {
			this.currentVersion = version;
		});

		this.refreshWindowsMaximizedState();

		this.electronService.remote.getCurrentWindow().on("maximize", () => {
			this.refreshWindowsMaximizedState();
		});

		this.electronService.remote.getCurrentWindow().on("unmaximize", () => {
			this.refreshWindowsMaximizedState();
		});
	}

	public refreshWindowsMaximizedState() {
		this.isMaximized = this.electronService.remote.getCurrentWindow().isMaximized();
	}

	public onMinimizeAppClicked() {
		this.electronService.remote.getCurrentWindow().minimize();
	}

	public onCloseAppClicked() {
		this.electronService.remote.getCurrentWindow().close();
	}

	public onMaximizeAppClicked() {
		this.electronService.remote.getCurrentWindow().maximize();
	}

	public onUnMaximizeAppClicked() {
		this.electronService.remote.getCurrentWindow().unmaximize();
	}
}


@Component({
	selector: "app-extension-top-bar",
	template: ""
})
export class ExtensionTopBarComponent extends TopBarComponent implements OnInit {
	public ngOnInit(): void {
	}
}
