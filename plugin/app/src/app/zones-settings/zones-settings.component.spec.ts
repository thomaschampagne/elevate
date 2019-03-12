import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ZonesSettingsComponent } from "./zones-settings.component";
import { CoreModule } from "../core/core.module";
import { SharedModule } from "../shared/shared.module";
import * as _ from "lodash";
import { UserSettings } from "@elevate/shared/models";
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

describe("ZonesSettingsComponent", () => {

	let component: ZonesSettingsComponent;
	let fixture: ComponentFixture<ZonesSettingsComponent>;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			]
		}).compileComponents();

		done();
	});

	beforeEach((done: Function) => {
		fixture = TestBed.createComponent(ZonesSettingsComponent);
		component = fixture.componentInstance;

		spyOn(component.userSettingsService, "fetch").and.returnValue(Promise.resolve(_.cloneDeep(DesktopUserSettingsModel.DEFAULT_MODEL)));

		fixture.detectChanges();
		done();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});

});
