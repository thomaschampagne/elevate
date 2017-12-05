import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { GotItDialogData } from "./got-it-dialog-data.model";

@Component({
	selector: 'got-it-dialog',
	templateUrl: './got-it-dialog.component.html',
	styleUrls: ['./got-it-dialog.component.scss']
})
export class GotItDialog implements OnInit {

	public static readonly MAX_WIDTH: string = '80%';
	public static readonly MIN_WIDTH: string = '40%';

	constructor(@Inject(MAT_DIALOG_DATA) public dialogData: GotItDialogData, private dialogRef: MatDialogRef<GotItDialog>) {
	}

	public ngOnInit(): void {
	}
}
