import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { ConfirmDialogData } from "./confirm-dialog-data.model";

@Component({
	selector: 'app-confirm-dialog',
	templateUrl: './confirm-dialog.component.html',
	styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialog implements OnInit {

	public static readonly MAX_WIDTH: string = '80%';
	public static readonly MIN_WIDTH: string = '40%';

	constructor(private _dialogRef: MatDialogRef<ConfirmDialog>,
				@Inject(MAT_DIALOG_DATA) private _dialogData: ConfirmDialogData) {
	}

	public ngOnInit() {
	}

	public OnConfirm() {
		this.dialogRef.close(true);
	}

	public OnCancel() {
		this.dialogRef.close(false);
	}

	get dialogData(): ConfirmDialogData {
		return this._dialogData;
	}

	set dialogData(value: ConfirmDialogData) {
		this._dialogData = value;
	}

	get dialogRef(): MatDialogRef<ConfirmDialog> {
		return this._dialogRef;
	}

	set dialogRef(value: MatDialogRef<ConfirmDialog>) {
		this._dialogRef = value;
	}
}
