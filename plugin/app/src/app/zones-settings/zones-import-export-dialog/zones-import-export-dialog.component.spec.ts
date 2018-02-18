import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ZonesImportExportDialogComponent } from "./zones-import-export-dialog.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { SharedModule } from "../../shared/shared.module";
import { CoreModule } from "../../core/core.module";
import { ZoneImportExportDataModel } from "./zone-import-export-data.model";
import { ZoneDefinitionModel } from "../../shared/models/zone-definition.model";
import { Mode } from "./mode.enum";
import { userSettings } from "../../../../../common/scripts/UserSettings";

describe("ZonesImportExportDialogComponent", () => {

	const zoneSpeedDefinition: ZoneDefinitionModel = {
		name: "Cycling Speed",
		value: "speed",
		units: "KPH",
		step: 0.1,
		min: 0,
		max: 9999,
		customDisplay: null
	};

	let component: ZonesImportExportDialogComponent;
	let fixture: ComponentFixture<ZonesImportExportDialogComponent>;
	let zoneImportExportDataModel_As_Export: ZoneImportExportDataModel;

	beforeEach(async(() => {

		zoneImportExportDataModel_As_Export = new ZoneImportExportDataModel(zoneSpeedDefinition, userSettings.zones.speed, Mode.EXPORT);

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			],
			declarations: [],
			providers: [
				{
					provide: MAT_DIALOG_DATA, useValue: zoneImportExportDataModel_As_Export,
				},
				{
					provide: MatDialogRef, useValue: {},
				},
			]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ZonesImportExportDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});

	it("should render the 'Export' zones dialog", () => {

		// Given
		const fixture = TestBed.createComponent(ZonesImportExportDialogComponent);
		const compiled = fixture.debugElement.nativeElement;

		// When
		fixture.detectChanges();

		// Then
		expect(component.zonesJsonData).toEqual(JSON.stringify(userSettings.zones.speed));
		expect(compiled.querySelector("h2").textContent).toContain("Export <Cycling Speed> zones");

	});
});
