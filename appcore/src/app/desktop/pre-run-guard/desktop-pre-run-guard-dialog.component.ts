import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ElectronService } from "../../shared/services/electron/electron.service";

@Component({
	selector: "app-guard",
	templateUrl: "./desktop-pre-run-guard-dialog.component.html",
	styleUrls: ["./desktop-pre-run-guard-dialog.component.scss"]
})
export class DesktopPreRunGuardDialogComponent implements OnInit {

	public athleteMachineId: string;

	constructor(public electronService: ElectronService,
				@Inject(MAT_DIALOG_DATA) athleteMachineId: string) {
		this.athleteMachineId = athleteMachineId;
	}

	public ngOnInit(): void {
	}

	public closeApp(): void {
		this.electronService.remote.getCurrentWindow().close();
	}
}
