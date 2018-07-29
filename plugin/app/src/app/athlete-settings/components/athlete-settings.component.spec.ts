import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { AthleteSettingsComponent } from "./athlete-settings.component";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { AthleteSettingsModule } from "../athlete-settings.module";
import { UserSettingsDao } from "../../shared/dao/user-settings/user-settings.dao";
import * as _ from "lodash";
import { userSettings } from "../../../../../shared/UserSettings";


describe("AthleteSettingsComponent", () => {

	let component: AthleteSettingsComponent;
	let fixture: ComponentFixture<AthleteSettingsComponent>;
	let userSettingsDao: UserSettingsDao;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				AthleteSettingsModule
			]
		}).compileComponents();

		userSettingsDao = TestBed.get(UserSettingsDao);

		spyOn(userSettingsDao, "browserStorageSync").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(_.cloneDeep(userSettings));
			}
		});
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(AthleteSettingsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
