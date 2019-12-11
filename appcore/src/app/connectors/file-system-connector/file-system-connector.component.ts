import { Component, OnInit } from "@angular/core";
import { ConnectorsComponent } from "../connectors.component";
import { MatSnackBar } from "@angular/material";

@Component({
	selector: "app-file-system-connector",
	templateUrl: "./file-system-connector.component.html",
	styleUrls: ["./file-system-connector.component.scss"]
})
export class FileSystemConnectorComponent extends ConnectorsComponent implements OnInit {

	constructor(public snackBar: MatSnackBar) {
		super();
	}

	public ngOnInit(): void {
	}

	public onConfigure(): void {
		this.snackBar.open("This connector is in work in progress.", "Got it");
	}
}
