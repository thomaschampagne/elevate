import { async, ComponentFixture, TestBed } from "@angular/core/testing";

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

	beforeEach(async(() => {
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

	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(CommonSettingsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});

	it("should get option helper dir", () => {

		// Given
		const pathname = "/webapp/dist/index.html";
		const expected = "/webapp/dist/assets/option-helpers/";

		// When
		const actual = CommonSettingsComponent.getOptionHelperDir(pathname);

		// Then
		expect(actual).toEqual(expected);

	});

	it("should get option helper dir", () => {

		// Given
		const pathname = null;

		// When
		const actual = CommonSettingsComponent.getOptionHelperDir(pathname);

		// Then
		expect(actual).toBeNull();

	});
});
