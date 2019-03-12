import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AthleteSettingsComponent } from "./athlete-settings.component";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { AthleteSettingsModule } from "../athlete-settings.module";
import * as _ from "lodash";
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";
import { AthleteService } from "../../shared/services/athlete/athlete.service";
import { AthleteModel, UserSettings } from "@elevate/shared/models";
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

describe("AthleteSettingsComponent", () => {

	let component: AthleteSettingsComponent;
	let fixture: ComponentFixture<AthleteSettingsComponent>;
	let userSettingsService: UserSettingsService;
	let athleteService: AthleteService;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				AthleteSettingsModule
			]
		}).compileComponents();

		userSettingsService = TestBed.get(UserSettingsService);
		athleteService = TestBed.get(AthleteService);

		spyOn(userSettingsService, "fetch").and.returnValue(Promise.resolve(_.cloneDeep(DesktopUserSettingsModel.DEFAULT_MODEL)));
		spyOn(athleteService, "fetch").and.returnValue(Promise.resolve(AthleteModel.DEFAULT_MODEL));
		done();
	});

	beforeEach((done: Function) => {
		fixture = TestBed.createComponent(AthleteSettingsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		done();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});

});
