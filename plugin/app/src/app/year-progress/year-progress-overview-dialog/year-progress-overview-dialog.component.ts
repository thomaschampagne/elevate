import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material";
import { YearProgressForOverviewModel } from "../shared/models/year-progress-for-overview.model";

@Component({
	selector: "app-year-progress-overview-dialog",
	templateUrl: "./year-progress-overview-dialog.component.html",
	styleUrls: ["./year-progress-overview-dialog.component.scss"]
})
export class YearProgressOverviewDialogComponent implements OnInit {

	public static readonly WIDTH: string = "95%";

	constructor(@Inject(MAT_DIALOG_DATA) public data: YearProgressForOverviewModel) {
	}

	public ngOnInit(): void {
	}

}
