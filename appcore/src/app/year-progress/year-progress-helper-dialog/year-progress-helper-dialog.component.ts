import { Component, OnInit } from "@angular/core";
import * as moment from "moment";
import { Moment } from "moment";

@Component({
	selector: "app-year-progress-helper-dialog",
	templateUrl: "./year-progress-helper-dialog.component.html",
	styleUrls: ["./year-progress-helper-dialog.component.scss"]
})
export class YearProgressHelperDialogComponent implements OnInit {

	public static readonly MAX_WIDTH: string = "80%";
	public static readonly MIN_WIDTH: string = "40%";

	public todayMoment: Moment;

	constructor() {
	}

	public ngOnInit(): void {
		this.todayMoment = moment();
	}

}
