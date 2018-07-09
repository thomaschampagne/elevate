import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AthleteSettingsComponent } from "./athlete-settings.component";
import { UserSettingsDao } from "../shared/dao/user-settings/user-settings.dao";
import * as _ from "lodash";
import { userSettings } from "../../../../shared/UserSettings";
import { CoreModule } from "../core/core.module";
import { SharedModule } from "../shared/shared.module";

describe("AthleteSettingsComponent", () => {

	let component: AthleteSettingsComponent;
	let fixture: ComponentFixture<AthleteSettingsComponent>;
	let userSettingsDao: UserSettingsDao;

	beforeEach((done: Function) => {

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			]
		}).compileComponents();

		userSettingsDao = TestBed.get(UserSettingsDao);

		spyOn(userSettingsDao, "browserStorageSync").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(_.cloneDeep(userSettings));
			}
		});

		spyOn(userSettingsDao, "getChromeError").and.returnValue(null);

		done();
	});

	beforeEach(() => {

		fixture = TestBed.createComponent(AthleteSettingsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();

	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});

	it("should convert runningFtp in seconds to pace using imperial system", (done: Function) => {

		// Given
		component.runningFtp = 5 * 60; // 5 Minutes
		const expectedPace = "00:08:03/mi";

		// When
		const pace = component.convertToPace("imperial");

		// Then
		expect(pace).toEqual(expectedPace);
		done();
	});

	it("should convert runningFtp in seconds to pace using metric system", (done: Function) => {

		// Given
		component.runningFtp = 5 * 60; // 5 Minutes
		const expectedPace = "00:05:00/km";

		// When
		const pace = component.convertToPace("metric");

		// Then
		expect(pace).toEqual(expectedPace);
		done();
	});
});
