import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AthleteSettingsComponent } from "./athlete-settings.component";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { AthleteSettingsModule } from "../athlete-settings.module";
import * as _ from "lodash";
import { userSettings } from "../../../../../shared/UserSettings";
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";

describe("AthleteSettingsComponent", () => {

	let component: AthleteSettingsComponent;
	let fixture: ComponentFixture<AthleteSettingsComponent>;
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

		spyOn(userSettingsService, "fetch").and.returnValue(Promise.resolve(_.cloneDeep(userSettings)));
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
