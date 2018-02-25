import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AthleteSettingsComponent } from "./athlete-settings.component";
import { UserSettingsDao } from "../shared/dao/user-settings/user-settings.dao";
import * as _ from "lodash";
import { userSettings } from "../../../../common/scripts/UserSettings";
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

		spyOn(userSettingsDao, "chromeStorageSync").and.returnValue({
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
});
