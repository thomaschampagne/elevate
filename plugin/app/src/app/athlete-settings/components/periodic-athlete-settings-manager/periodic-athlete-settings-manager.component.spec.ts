import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { PeriodicAthleteSettingsManagerComponent } from "./periodic-athlete-settings-manager.component";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../../shared/shared.module";
import { AthleteSettingsModule } from "../../athlete-settings.module";
import { PeriodicAthleteSettingsService } from "../../../shared/services/periodic-athlete-settings/periodic-athlete-settings.service";

describe("PeriodicAthleteSettingsManagerComponent", () => {
	let component: PeriodicAthleteSettingsManagerComponent;
	let fixture: ComponentFixture<PeriodicAthleteSettingsManagerComponent>;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				AthleteSettingsModule
			]
		}).compileComponents();

		const periodicAthleteSettingsService = TestBed.get(PeriodicAthleteSettingsService);

		spyOn(periodicAthleteSettingsService, "fetch").and.returnValue(Promise.resolve([]));

		done();
	});

	beforeEach((done: Function) => {
		fixture = TestBed.createComponent(PeriodicAthleteSettingsManagerComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		done();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
