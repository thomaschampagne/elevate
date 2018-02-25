import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ZoneToolBarComponent } from "./zone-tool-bar.component";
import { UserSettingsDao } from "../../shared/dao/user-settings/user-settings.dao";
import * as _ from "lodash";
import { userSettings } from "../../../../../common/scripts/UserSettings";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { ZoneDefinitionModel } from "../../shared/models/zone-definition.model";

describe("ZoneToolBarComponent", () => {

	let component: ZoneToolBarComponent;
	let fixture: ComponentFixture<ZoneToolBarComponent>;
	let userSettingsDao: UserSettingsDao;

	const zoneSpeedDefinition: ZoneDefinitionModel[] = [{
		name: "Cycling Speed",
		value: "speed",
		units: "KPH",
		step: 0.1,
		min: 0,
		max: 9999,
		customDisplay: null
	}, {
		name: "Heart Rate",
		value: "heartRate",
		units: "BPM",
		step: 1,
		min: 0,
		max: 9999,
		customDisplay: null
	}];

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			]
		}).compileComponents();

		userSettingsDao = TestBed.get(UserSettingsDao);

		spyOn(userSettingsDao, "chromeStorageSync").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(_.cloneDeep(userSettings));
			}
		});

		done();
	});

	beforeEach(() => {

		fixture = TestBed.createComponent(ZoneToolBarComponent);
		component = fixture.componentInstance;

		component.zoneDefinitions = _.clone(zoneSpeedDefinition);
		component.zoneDefinitionSelected = _.first(_.clone(zoneSpeedDefinition));
		component.zonesService.zoneDefinition = _.first(_.clone(zoneSpeedDefinition));

		fixture.detectChanges();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});

	it("should call zone service on AddLastZone", (done: Function) => {

		// Given
		const spy = spyOn(component.zonesService, "addLastZone").and.returnValue(Promise.resolve(null));
		const compiled = fixture.debugElement.nativeElement;

		// When
		compiled.querySelector("#addLastZone").click();

		// Then
		expect(spy).toHaveBeenCalledTimes(1);
		done();
	});

	it("should call zone service on RemoveLastZone", (done: Function) => {

		// Given
		const spy = spyOn(component.zonesService, "removeLastZone").and.returnValue(Promise.resolve(null));
		const compiled = fixture.debugElement.nativeElement;

		// When
		compiled.querySelector("#removeLastZone").click();

		// Then
		expect(spy).toHaveBeenCalledTimes(1);
		done();
	});

	it("should call zone service on SaveZones", (done: Function) => {

		// Given
		const spy = spyOn(component.zonesService, "saveZones").and.returnValue(Promise.resolve(null));
		const compiled = fixture.debugElement.nativeElement;

		// When
		compiled.querySelector("#saveZones").click();

		// Then
		expect(spy).toHaveBeenCalledTimes(1);
		done();
	});

});
