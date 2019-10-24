import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { YearProgressForOverviewModel } from "../shared/models/year-progress-for-overview.model";
import { ProgressMode } from "../shared/enums/progress-mode.enum";

@Component({
	selector: "app-year-progress-overview-dialog",
	templateUrl: "./year-progress-overview-dialog.component.html",
	styleUrls: ["./year-progress-overview-dialog.component.scss"]
})
export class YearProgressOverviewDialogComponent implements OnInit {

	public static readonly WIDTH: string = "95%";

	public readonly ProgressMode = ProgressMode;

	constructor(@Inject(MAT_DIALOG_DATA) public data: YearProgressForOverviewModel) {
	}

	public ngOnInit(): void {
	}

}
