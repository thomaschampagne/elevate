import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";

export interface IOptionHelperData {
	title: string;
	markdownData: string;
}

@Component({
	selector: 'option-helper-dialog',
	templateUrl: './option-helper-dialog.component.html',
	styleUrls: ['./option-helper-dialog.component.scss']
})
export class OptionHelperDialogComponent implements OnInit {

	public static MAX_WIDTH: string = '80%';
	public static MIN_WIDTH: string = '40%';

	constructor(@Inject(MAT_DIALOG_DATA) private _dialogData: IOptionHelperData,
				private dialogRef: MatDialogRef<OptionHelperDialogComponent>) {
	}

	public ngOnInit() {
	}

	get dialogData(): IOptionHelperData {
		return this._dialogData;
	}
}
