import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { SafeHtml } from "@angular/platform-browser";

export interface IGotItDialogData {
	title: string;
	html: SafeHtml;
}

@Component({
	selector: 'got-it-dialog',
	templateUrl: './got-it-dialog.component.html',
	styleUrls: ['./got-it-dialog.component.scss']
})
export class GotItDialog implements OnInit {

	public static MAX_WIDTH: string = '80%';
	public static MIN_WIDTH: string = '40%';

	constructor(@Inject(MAT_DIALOG_DATA) private _dialogData: IGotItDialogData, private dialogRef: MatDialogRef<GotItDialog>) {
	}

	public onNoClick(): void {
		this.dialogRef.close();
	}

	public ngOnInit(): void {
	}


	get dialogData(): IGotItDialogData {
		return this._dialogData;
	}
}
