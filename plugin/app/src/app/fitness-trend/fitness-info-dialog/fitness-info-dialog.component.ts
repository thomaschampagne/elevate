import { Component, OnInit } from "@angular/core";

@Component({
	selector: "app-fitness-info-dialog",
	templateUrl: "./fitness-info-dialog.component.html",
	styleUrls: ["./fitness-info-dialog.component.scss"]
})
export class FitnessInfoDialogComponent implements OnInit {

	public static readonly MAX_WIDTH: string = "80%";
	public static readonly MIN_WIDTH: string = "40%";

	constructor() {
	}

	public ngOnInit() {
	}

}
