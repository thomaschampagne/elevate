import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material";
import { GotItDialogDataModel } from "./got-it-dialog-data.model";

@Component({
	selector: "app-got-it-dialog",
	templateUrl: "./got-it-dialog.component.html",
	styleUrls: ["./got-it-dialog.component.scss"]
})
export class GotItDialogComponent implements OnInit {

	public static readonly MAX_WIDTH: string = "80%";
	public static readonly MIN_WIDTH: string = "40%";

	constructor(@Inject(MAT_DIALOG_DATA) public dialogData: GotItDialogDataModel) {
	}

	public ngOnInit(): void {
	}
}
