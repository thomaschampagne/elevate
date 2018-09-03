import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DatedAthleteSettingsManagerComponent } from "./dated-athlete-settings-manager.component";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../../shared/shared.module";
import { AthleteSettingsModule } from "../../athlete-settings.module";
import { DatedAthleteSettingsService } from "../../../shared/services/dated-athlete-settings/dated-athlete-settings.service";

describe("DatedAthleteSettingsManagerComponent", () => {
	let component: DatedAthleteSettingsManagerComponent;
	let fixture: ComponentFixture<DatedAthleteSettingsManagerComponent>;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				AthleteSettingsModule
			]
		}).compileComponents();

		const datedAthleteSettingsService = TestBed.get(DatedAthleteSettingsService);

		spyOn(datedAthleteSettingsService, "fetch").and.returnValue(Promise.resolve([]));

		done();
	});

	beforeEach((done: Function) => {
		fixture = TestBed.createComponent(DatedAthleteSettingsManagerComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		done();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
