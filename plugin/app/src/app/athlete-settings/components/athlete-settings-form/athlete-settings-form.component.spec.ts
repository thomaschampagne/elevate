import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AthleteSettingsFormComponent } from "./athlete-settings-form.component";
import * as _ from "lodash";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../../shared/shared.module";
import { AthleteSettingsModel } from "@elevate/shared/models";
import { userSettingsData } from "@elevate/shared/data";
import { AthleteSettingsModule } from "../../athlete-settings.module";
import { UserSettingsService } from "../../../shared/services/user-settings/user-settings.service";

describe("AthleteSettingsFormComponent", () => {

	let component: AthleteSettingsFormComponent;
	let fixture: ComponentFixture<AthleteSettingsFormComponent>;
	let userSettingsService: UserSettingsService;

	beforeEach((done: Function) => {

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				AthleteSettingsModule
			]
		}).compileComponents();

		userSettingsService = TestBed.get(UserSettingsService);
		spyOn(userSettingsService, "fetch").and.returnValue(Promise.resolve(_.cloneDeep(userSettingsData)));

		done();
	});

	beforeEach((done: Function) => {

		fixture = TestBed.createComponent(AthleteSettingsFormComponent);
		component = fixture.componentInstance;
		component.athleteSettingsModel = _.cloneDeep(AthleteSettingsModel.DEFAULT_MODEL);
		fixture.detectChanges();

		done();

	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});

	it("should convert runningFtp in seconds to pace using imperial system", (done: Function) => {

		// Given
		component.athleteSettingsModel.runningFtp = 5 * 60; // 5 Minutes
		const expectedPace = "00:08:03/mi";

		// When
		const pace = component.convertToPace("imperial");

		// Then
		expect(pace).toEqual(expectedPace);
		done();
	});

	it("should convert runningFtp in seconds to pace using metric system", (done: Function) => {

		// Given
		component.athleteSettingsModel.runningFtp = 5 * 60; // 5 Minutes
		const expectedPace = "00:05:00/km";

		// When
		const pace = component.convertToPace("metric");

		// Then
		expect(pace).toEqual(expectedPace);
		done();
	});
});
