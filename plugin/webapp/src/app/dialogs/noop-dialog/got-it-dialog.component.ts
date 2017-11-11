import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { SafeHtml } from "@angular/platform-browser";

export interface IGotItDialogData {
	title: string;
	html: SafeHtml;
}

@Component({
	selector: 'app-noop-dialog',
	templateUrl: './got-it-dialog.component.html',
	styleUrls: ['./got-it-dialog.component.scss']
})
export class GotItDialogComponent implements OnInit {

	public static MAX_WIDTH: string = '80%';
	public static MIN_WIDTH: string = '40%';

	constructor(@Inject(MAT_DIALOG_DATA) private _dialogData: IGotItDialogData, private dialogRef: MatDialogRef<GotItDialogComponent>) {
	}

	public onNoClick(): void {
		this.dialogRef.close();
	}

	public ngOnInit() {
	}


	get dialogData(): IGotItDialogData {
		return this._dialogData;
	}
}
