import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DatedAthleteSettingsManagerComponent } from "./dated-athlete-settings-manager.component";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../../shared/shared.module";
import { AthleteSettingsModule } from "../../athlete-settings.module";
import { AthleteService } from "../../../shared/services/athlete/athlete.service";
import { AthleteModel, AthleteSettingsModel, DatedAthleteSettingsModel, Gender } from "@elevate/shared/models";

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

		const athleteService = TestBed.get(AthleteService);

		const datedAthleteSettings: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, null, 190, null, null, 75)),
			new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, null, null, 150, null, null, 76)),
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, null, 110, null, null, 78)),
			new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, null, 110, null, null, 78))
		];

		const athleteModel = new AthleteModel(Gender.MEN, datedAthleteSettings);

		spyOn(athleteService, "fetch").and.returnValue(Promise.resolve(athleteModel));

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
