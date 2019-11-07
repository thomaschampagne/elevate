import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material";
import { ElectronService } from "../shared/services/electron/electron.service";

@Component({
	selector: "app-guard",
	templateUrl: "./desktop-app-guard-dialog.component.html",
	styleUrls: ["./desktop-app-guard-dialog.component.scss"]
})
export class DesktopAppGuardDialogComponent implements OnInit {

	public machineId: string;

	constructor(public electronService: ElectronService,
				@Inject(MAT_DIALOG_DATA) machineId: string) {
		this.machineId = machineId;
	}

	public ngOnInit(): void {
	}

	public closeApp(): void {
		this.electronService.remote.getCurrentWindow().close();
	}
}
