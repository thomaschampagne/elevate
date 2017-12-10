import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { ConfirmDialogDataModel } from "./confirm-dialog-data.model";

@Component({
	selector: "app-confirm-dialog",
	templateUrl: "./confirm-dialog.component.html",
	styleUrls: ["./confirm-dialog.component.scss"]
})
export class ConfirmDialogComponent implements OnInit {

	public static readonly MAX_WIDTH: string = "80%";
	public static readonly MIN_WIDTH: string = "40%";

	constructor(public dialogRef: MatDialogRef<ConfirmDialogComponent>,
				@Inject(MAT_DIALOG_DATA) public dialogData: ConfirmDialogDataModel) {
	}

	public ngOnInit() {
	}

	public OnConfirm() {
		this.dialogRef.close(true);
	}

	public OnCancel() {
		this.dialogRef.close(false);
	}
}
