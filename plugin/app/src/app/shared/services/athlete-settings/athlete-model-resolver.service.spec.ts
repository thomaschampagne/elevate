import { TestBed } from "@angular/core/testing";

import { AthleteModelResolverService } from "./athlete-model-resolver.service";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import { AthleteModelResolver } from "../../../../../../shared/resolvers/athlete-model.resolver";
import { PeriodicAthleteSettingsModel } from "../../../../../../shared/models/athlete-settings/periodic-athlete-settings.model";
import { UserSettingsModel } from "../../../../../../shared/models/user-settings/user-settings.model";
import { userSettings } from "../../../../../../shared/UserSettings";
import * as _ from "lodash";
import { AthleteModel } from "../../../../../../shared/models/athlete.model";

describe("AthleteModelResolverService", () => {

	const lthr = {default: 172, cycling: null, running: null};

	let athleteModelResolverService: AthleteModelResolverService;

	let userSettingsModel: UserSettingsModel;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule
			]
		});

		athleteModelResolverService = TestBed.get(AthleteModelResolverService);

		userSettingsModel = _.cloneDeep(userSettings);

		done();
	});

	it("should be created", (done: Function) => {
		expect(athleteModelResolverService).toBeTruthy();
		done();
	});

	it("should init the service", (done: Function) => {

		// Given
		const periodicAthleteSettingsModels: PeriodicAthleteSettingsModel[] = [
			new PeriodicAthleteSettingsModel("2018-05-10", 200, 50, lthr, 190, 325, 32, 75),
			new PeriodicAthleteSettingsModel("2018-02-01", 190, 65, lthr, 110, 325, 32, 78),
			new PeriodicAthleteSettingsModel(null, 190, 65, lthr, 110, 325, 32, 78)
		];

		spyOn(athleteModelResolverService.userSettingsService, "fetch").and.returnValue(Promise.resolve(userSettingsModel));
		spyOn(athleteModelResolverService.periodicAthleteSettingsService, "fetch").and.returnValue(Promise.resolve(periodicAthleteSettingsModels));

		// When
		const promise = athleteModelResolverService.init();

		// Then
		promise.then(() => {

			expect(_.isEmpty(athleteModelResolverService.athleteModelResolver)).toBeFalsy();
			expect(athleteModelResolverService.athleteModelResolver.userSettingsModel).toEqual(userSettingsModel);
			expect(athleteModelResolverService.athleteModelResolver.periodicAthleteSettingsModels).toEqual(periodicAthleteSettingsModels);
			done();

		}, error => {

			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it("should reject init the service", (done: Function) => {

		// Given
		const errorMessage = "We have an error !";
		spyOn(athleteModelResolverService.userSettingsService, "fetch").and.returnValue(Promise.resolve(userSettingsModel));
		spyOn(athleteModelResolverService.periodicAthleteSettingsService, "fetch").and.returnValue(Promise.reject(errorMessage));

		// When
		const promise = athleteModelResolverService.init();

		// Then
		promise.then(() => {

			expect(_.isEmpty(athleteModelResolverService.athleteModelResolver)).toBeTruthy();
			expect(false).toBeTruthy("Whoops! I should not be here!");

			done();

		}, error => {

			expect(error).not.toBeNull();
			expect(error).toEqual(errorMessage);
			done();
		});

	});

	it("should resolve AthleteModel at given date with hasPeriodicAthleteSettings 'true' (1)", (done: Function) => {

		// Given
		const onDate = "2018-04-29";
		userSettingsModel.hasPeriodicAthleteSettings = true;

		const expectedPeriodicAthleteSettingsModel = new PeriodicAthleteSettingsModel("2018-04-15", 195, 55, lthr, 150, 325, 32, 76);
		const periodicAthleteSettingsModels: PeriodicAthleteSettingsModel[] = [
			new PeriodicAthleteSettingsModel("2018-05-10", 200, 50, lthr, 190, 325, 32, 75),
			expectedPeriodicAthleteSettingsModel,
			new PeriodicAthleteSettingsModel("2018-02-01", 190, 65, lthr, 110, 325, 32, 78),
			new PeriodicAthleteSettingsModel(null, 190, 65, lthr, 110, 325, 32, 78)
		];

		const expectedAthleteModel = new AthleteModel(userSettings.athleteModel.gender, expectedPeriodicAthleteSettingsModel.toAthleteSettingsModel());
		athleteModelResolverService.athleteModelResolver = new AthleteModelResolver(userSettingsModel, periodicAthleteSettingsModels);

		// When
		const athleteModel = athleteModelResolverService.resolve(onDate);

		// Then
		expect(athleteModel).toEqual(expectedAthleteModel);

		done();
	});

	it("should resolve AthleteModel at given date with hasPeriodicAthleteSettings 'true' (2)", (done: Function) => {

		// Given
		const onDate = "2018-04-15";
		userSettingsModel.hasPeriodicAthleteSettings = true;

		const expectedPeriodicAthleteSettingsModel = new PeriodicAthleteSettingsModel("2018-04-15", 195, 55, lthr, 150, 325, 32, 76);
		const periodicAthleteSettingsModels: PeriodicAthleteSettingsModel[] = [
			new PeriodicAthleteSettingsModel("2018-05-10", 200, 50, lthr, 190, 325, 32, 75),
			expectedPeriodicAthleteSettingsModel,
			new PeriodicAthleteSettingsModel("2018-02-01", 190, 65, lthr, 110, 325, 32, 78),
			new PeriodicAthleteSettingsModel(null, 190, 65, lthr, 110, 325, 32, 78)
		];

		const expectedAthleteModel = new AthleteModel(userSettings.athleteModel.gender, expectedPeriodicAthleteSettingsModel.toAthleteSettingsModel());
		athleteModelResolverService.athleteModelResolver = new AthleteModelResolver(userSettingsModel, periodicAthleteSettingsModels);

		// When
		const athleteModel = athleteModelResolverService.resolve(onDate);

		// Then
		expect(athleteModel).toEqual(expectedAthleteModel);

		done();
	});

	it("should resolve AthleteModel at given date with hasPeriodicAthleteSettings 'true' (3)", (done: Function) => {

		// Given
		const onDate = "2018-01-15";
		userSettingsModel.hasPeriodicAthleteSettings = false;

		const expectedPeriodicAthleteSettingsModel = new PeriodicAthleteSettingsModel(null, 190, 65, lthr, 110, 325, 32, 78);
		const periodicAthleteSettingsModels: PeriodicAthleteSettingsModel[] = [
			new PeriodicAthleteSettingsModel("2018-05-10", 200, 50, lthr, 190, 325, 32, 75),
			new PeriodicAthleteSettingsModel("2018-04-15", 195, 55, lthr, 150, 325, 32, 76),
			new PeriodicAthleteSettingsModel("2018-02-01", 190, 65, lthr, 110, 325, 32, 78),
			expectedPeriodicAthleteSettingsModel
		];

		const expectedAthleteModel = userSettings.athleteModel;
		athleteModelResolverService.athleteModelResolver = new AthleteModelResolver(userSettingsModel, periodicAthleteSettingsModels);

		// When
		const athleteModel = athleteModelResolverService.resolve(onDate);

		// Then
		expect(athleteModel).toEqual(expectedAthleteModel);

		done();
	});

	it("should resolve AthleteModel at given date with hasPeriodicAthleteSettings 'false'", (done: Function) => {

		// Given
		const onDate = "2018-01-15";
		userSettingsModel.hasPeriodicAthleteSettings = true;

		const expectedPeriodicAthleteSettingsModel = new PeriodicAthleteSettingsModel(null, 190, 65, lthr, 110, 325, 32, 78);
		const periodicAthleteSettingsModels: PeriodicAthleteSettingsModel[] = [
			new PeriodicAthleteSettingsModel("2018-05-10", 200, 50, lthr, 190, 325, 32, 75),
			new PeriodicAthleteSettingsModel("2018-04-15", 195, 55, lthr, 150, 325, 32, 76),
			new PeriodicAthleteSettingsModel("2018-02-01", 190, 65, lthr, 110, 325, 32, 78),
			expectedPeriodicAthleteSettingsModel
		];

		const expectedAthleteModel = new AthleteModel(userSettings.athleteModel.gender, expectedPeriodicAthleteSettingsModel.toAthleteSettingsModel());
		athleteModelResolverService.athleteModelResolver = new AthleteModelResolver(userSettingsModel, periodicAthleteSettingsModels);

		// When
		const athleteModel = athleteModelResolverService.resolve(onDate);

		// Then
		expect(athleteModel).toEqual(expectedAthleteModel);

		done();
	});

	it("should not resolve AthleteModel when athleteModelResolver not ready.", (done: Function) => {

		// Given
		const onDate = "2018-01-15";
		const expectedError = new Error("AthleteModelResolver do not exists. Please init service at first with AthleteModelResolverService#init()");

		// When
		const call = () => {
			athleteModelResolverService.resolve(onDate);
		};

		// Then
		expect(call).toThrow(expectedError);

		done();
	});

	it("should not resolve AthleteModel with wrong date.", (done: Function) => {

		// Given
		const onDate = "2018-13.15"; // Wrong pattern
		const expectedError = new Error("Invalid date or not formatted as 'YYYY-MM-DD'");
		athleteModelResolverService.athleteModelResolver = new AthleteModelResolver(userSettingsModel, []);

		// When
		const call = () => {
			athleteModelResolverService.resolve(onDate);
		};

		// Then
		expect(call).toThrow(expectedError);

		done();
	});

	it("should not resolve AthleteModel with wrong pattern date.", (done: Function) => {

		// Given
		const onDate = "2018-13-15"; // Wrong date
		const expectedError = new Error("Invalid date or not formatted as 'YYYY-MM-DD'");
		athleteModelResolverService.athleteModelResolver = new AthleteModelResolver(userSettingsModel, []);

		// When
		const call = () => {
			athleteModelResolverService.resolve(onDate);
		};

		// Then
		expect(call).toThrow(expectedError);

		done();
	});

});
