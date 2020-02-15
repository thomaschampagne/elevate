import { Component, OnInit } from "@angular/core";
import { ElectronService } from "../shared/services/electron/electron.service";
import { ConfirmDialogDataModel } from "../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { MatDialog } from "@angular/material/dialog";

@Component({
	selector: "app-connectors",
	templateUrl: "./connectors.component.html",
	styleUrls: ["./connectors.component.scss"]
})
export class ConnectorsComponent implements OnInit {

	constructor(public electronService: ElectronService,
				public dialog: MatDialog) {
	}

	public ngOnInit(): void {

	}

	public onOpenLink(url: string): void {

		const data: ConfirmDialogDataModel = {
			title: "Add your connector as fitness company or organization",
			content: "Please contact me on twitter to get your fitness company or organization connector in Elevate.",
			confirmText: "Contact me"
		};

		const dialogRef = this.dialog.open(ConfirmDialogComponent, {
			minWidth: ConfirmDialogComponent.MIN_WIDTH,
			maxWidth: ConfirmDialogComponent.MAX_WIDTH,
			data: data
		});

		dialogRef.afterClosed().subscribe((confirm: boolean) => {
			if (confirm) {
				this.electronService.openExternalUrl(url);
			}
		});

	}
}
