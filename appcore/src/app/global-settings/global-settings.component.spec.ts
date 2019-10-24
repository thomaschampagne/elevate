import { ComponentFixture, TestBed } from "@angular/core/testing";

import { GlobalSettingsComponent } from "./global-settings.component";
import { SharedModule } from "../shared/shared.module";
import * as _ from "lodash";
import { CoreModule } from "../core/core.module";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { UserSettings } from "@elevate/shared/models";
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

describe("GlobalSettingsComponent", () => {

	let component: GlobalSettingsComponent;
	let fixture: ComponentFixture<GlobalSettingsComponent>;
	let userSettingsService: UserSettingsService;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			],
			declarations: [],
			providers: []
		}).compileComponents();

		userSettingsService = TestBed.get(UserSettingsService);
		spyOn(userSettingsService, "fetch").and.returnValue(Promise.resolve(_.cloneDeep(DesktopUserSettingsModel.DEFAULT_MODEL)));

		done();
	});

	beforeEach((done: Function) => {
		fixture = TestBed.createComponent(GlobalSettingsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		done();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});

	it("should get option helper dir", (done: Function) => {

		// Given
		const pathname = "/app/index.html";
		const expected = "/app/assets/option-helpers/";

		// When
		const actual = GlobalSettingsComponent.getOptionHelperDir(pathname);

		// Then
		expect(actual).toEqual(expected);
		done();

	});

	it("should get option helper dir", (done: Function) => {

		// Given
		const pathname = null;

		// When
		const actual = GlobalSettingsComponent.getOptionHelperDir(pathname);

		// Then
		expect(actual).toBeNull();
		done();

	});
});
