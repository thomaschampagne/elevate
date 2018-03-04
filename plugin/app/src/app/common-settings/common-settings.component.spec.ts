import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CommonSettingsComponent } from "./common-settings.component";
import { UserSettingsDao } from "../shared/dao/user-settings/user-settings.dao";
import { SharedModule } from "../shared/shared.module";
import * as _ from "lodash";
import { userSettings } from "../../../../common/scripts/UserSettings";
import { CoreModule } from "../core/core.module";

describe("CommonSettingsComponent", () => {

	let component: CommonSettingsComponent;
	let fixture: ComponentFixture<CommonSettingsComponent>;
	let userSettingsDao: UserSettingsDao;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			],
			declarations: [],
			providers: []
		}).compileComponents();

		userSettingsDao = TestBed.get(UserSettingsDao);

		spyOn(userSettingsDao, "chromeStorageSync").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(_.cloneDeep(userSettings));
			}
		});

		spyOn(userSettingsDao, "getChromeError").and.returnValue(null);

		done();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(CommonSettingsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
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
		const actual = CommonSettingsComponent.getOptionHelperDir(pathname);

		// Then
		expect(actual).toEqual(expected);
		done();

	});

	it("should get option helper dir", (done: Function) => {

		// Given
		const pathname = null;

		// When
		const actual = CommonSettingsComponent.getOptionHelperDir(pathname);

		// Then
		expect(actual).toBeNull();
		done();

	});
});
