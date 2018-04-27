import { ComponentFixture, TestBed } from "@angular/core/testing";

import { GlobalSettingsComponent } from "./global-settings.component";
import { UserSettingsDao } from "../shared/dao/user-settings/user-settings.dao";
import { SharedModule } from "../shared/shared.module";
import * as _ from "lodash";
import { userSettings } from "../../../../core/shared/UserSettings";
import { CoreModule } from "../core/core.module";

describe("GlobalSettingsComponent", () => {

	let component: GlobalSettingsComponent;
	let fixture: ComponentFixture<GlobalSettingsComponent>;
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

		spyOn(userSettingsDao, "browserStorageSync").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(_.cloneDeep(userSettings));
			}
		});

		spyOn(userSettingsDao, "getChromeError").and.returnValue(null);

		done();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(GlobalSettingsComponent);
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
