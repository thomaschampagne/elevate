import { TestBed } from "@angular/core/testing";

import { AthleteModelResolverService } from "./athlete-model-resolver.service";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import { AthleteModel, AthleteSettingsModel, DatedAthleteSettingsModel, UserSettingsModel } from "@elevate/shared/models";
import * as _ from "lodash";
import { userSettingsData } from "@elevate/shared/data";
import { AthleteModelResolver } from "@elevate/shared/resolvers";

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

		userSettingsModel = _.cloneDeep(userSettingsData);

		done();
	});

	it("should be created", (done: Function) => {
		expect(athleteModelResolverService).toBeTruthy();
		done();
	});

	it("should update the service", (done: Function) => {

		// Given
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75)),
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78))
		];

		spyOn(athleteModelResolverService.userSettingsService, "fetch").and.returnValue(Promise.resolve(userSettingsModel));
		spyOn(athleteModelResolverService.datedAthleteSettingsService, "fetch").and.returnValue(Promise.resolve(datedAthleteSettingsModels));

		// When
		const promise = athleteModelResolverService.update();

		// Then
		promise.then(() => {

			expect(_.isEmpty(athleteModelResolverService.athleteModelResolver)).toBeFalsy();
			expect(athleteModelResolverService.athleteModelResolver.userSettingsModel).toEqual(userSettingsModel);
			expect(athleteModelResolverService.athleteModelResolver.datedAthleteSettingsModels).toEqual(datedAthleteSettingsModels);
			done();

		}, error => {

			expect(error).toBeNull();
			expect(false).toBeTruthy("Whoops! I should not be here!");
			done();
		});

	});

	it("should reject update the service", (done: Function) => {

		// Given
		const errorMessage = "We have an error !";
		spyOn(athleteModelResolverService.userSettingsService, "fetch").and.returnValue(Promise.resolve(userSettingsModel));
		spyOn(athleteModelResolverService.datedAthleteSettingsService, "fetch").and.returnValue(Promise.reject(errorMessage));

		// When
		const promise = athleteModelResolverService.update();

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

	it("should resolve AthleteModel at given date (as Date object) with hasDatedAthleteSettings 'true'", (done: Function) => {

		// Given
		const onDate = new Date("2018-04-29");
		userSettingsModel.hasDatedAthleteSettings = true;

		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, 55, lthr, 150, 325, 32, 76));
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75)),
			expectedDatedAthleteSettingsModel,
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78))
		];

		const expectedAthleteModel = new AthleteModel(userSettingsData.athleteModel.gender, expectedDatedAthleteSettingsModel.toAthleteSettingsModel());
		athleteModelResolverService.athleteModelResolver = new AthleteModelResolver(userSettingsModel, datedAthleteSettingsModels);

		// When
		const athleteModel = athleteModelResolverService.resolve(onDate);

		// Then
		expect(athleteModel).toEqual(expectedAthleteModel);

		done();
	});

	it("should resolve AthleteModel at given date (as string) with hasDatedAthleteSettings 'true' (1)", (done: Function) => {

		// Given
		const onDate = "2018-04-29";
		userSettingsModel.hasDatedAthleteSettings = true;

		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, 55, lthr, 150, 325, 32, 76));
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75)),
			expectedDatedAthleteSettingsModel,
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78))
		];

		const expectedAthleteModel = new AthleteModel(userSettingsData.athleteModel.gender, expectedDatedAthleteSettingsModel.toAthleteSettingsModel());
		athleteModelResolverService.athleteModelResolver = new AthleteModelResolver(userSettingsModel, datedAthleteSettingsModels);

		// When
		const athleteModel = athleteModelResolverService.resolve(onDate);

		// Then
		expect(athleteModel).toEqual(expectedAthleteModel);

		done();
	});

	it("should resolve AthleteModel at given date (as string) with hasDatedAthleteSettings 'true' (2)", (done: Function) => {

		// Given
		const onDate = "2018-04-15";
		userSettingsModel.hasDatedAthleteSettings = true;

		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, 55, lthr, 150, 325, 32, 76));
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75)),
			expectedDatedAthleteSettingsModel,
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78))
		];

		const expectedAthleteModel = new AthleteModel(userSettingsData.athleteModel.gender, expectedDatedAthleteSettingsModel.toAthleteSettingsModel());
		athleteModelResolverService.athleteModelResolver = new AthleteModelResolver(userSettingsModel, datedAthleteSettingsModels);

		// When
		const athleteModel = athleteModelResolverService.resolve(onDate);

		// Then
		expect(athleteModel).toEqual(expectedAthleteModel);

		done();
	});

	it("should resolve AthleteModel at given date (as string) with hasDatedAthleteSettings 'false' (3)", (done: Function) => {

		// Given
		const onDate = "2018-01-15";
		userSettingsModel.hasDatedAthleteSettings = false;

		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78));
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75)),
			new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, 55, lthr, 150, 325, 32, 76)),
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			expectedDatedAthleteSettingsModel
		];

		const expectedAthleteModel = userSettingsData.athleteModel;
		athleteModelResolverService.athleteModelResolver = new AthleteModelResolver(userSettingsModel, datedAthleteSettingsModels);

		// When
		const athleteModel = athleteModelResolverService.resolve(onDate);

		// Then
		expect(athleteModel).toEqual(expectedAthleteModel);

		done();
	});

	it("should resolve AthleteModel at given date (as string) with hasDatedAthleteSettings 'false' (4)", (done: Function) => {

		// Given
		const onDate = "2018-01-15";
		userSettingsModel.hasDatedAthleteSettings = false;

		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78));
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			expectedDatedAthleteSettingsModel
		];

		const expectedAthleteModel = userSettingsData.athleteModel;
		athleteModelResolverService.athleteModelResolver = new AthleteModelResolver(userSettingsModel, datedAthleteSettingsModels);

		// When
		const athleteModel = athleteModelResolverService.resolve(onDate);

		// Then
		expect(athleteModel).toEqual(expectedAthleteModel);

		done();
	});

	it("should resolve AthleteModel at given date (as string) with hasDatedAthleteSettings 'false'", (done: Function) => {

		// Given
		const onDate = "2018-01-15";
		userSettingsModel.hasDatedAthleteSettings = false;

		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78));
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75)),
			new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, 55, lthr, 150, 325, 32, 76)),
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			expectedDatedAthleteSettingsModel
		];

		const expectedAthleteModel = userSettingsData.athleteModel;
		athleteModelResolverService.athleteModelResolver = new AthleteModelResolver(userSettingsModel, datedAthleteSettingsModels);

		// When
		const athleteModel = athleteModelResolverService.resolve(onDate);

		// Then
		expect(athleteModel).toEqual(expectedAthleteModel);

		done();
	});

	it("should resolve current and latest AthleteModel with hasDatedAthleteSettings 'true'", (done: Function) => {

		// Given
		userSettingsModel.hasDatedAthleteSettings = true;
		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75));
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			expectedDatedAthleteSettingsModel,
			new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, 55, lthr, 150, 325, 32, 76)),
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78))
		];

		const expectedAthleteModel = new AthleteModel(userSettingsData.athleteModel.gender, expectedDatedAthleteSettingsModel.toAthleteSettingsModel());
		athleteModelResolverService.athleteModelResolver = new AthleteModelResolver(userSettingsModel, datedAthleteSettingsModels);

		// When
		const athleteModel = athleteModelResolverService.getCurrent();

		// Then
		expect(athleteModel).toEqual(expectedAthleteModel);

		done();
	});

	it("should resolve AthleteModel with not sorted dated athlete settings", (done: Function) => {

		// Given
		const onDate = "2018-04-15";
		userSettingsModel.hasDatedAthleteSettings = true;

		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, 55, lthr, 150, 325, 32, 76));

		// Below dated athlete settings are not sorted along since attribute
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75)),
			new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			expectedDatedAthleteSettingsModel,
		];

		const expectedAthleteModel = new AthleteModel(userSettingsData.athleteModel.gender, expectedDatedAthleteSettingsModel.toAthleteSettingsModel());
		athleteModelResolverService.athleteModelResolver = new AthleteModelResolver(userSettingsModel, datedAthleteSettingsModels);

		// When
		const athleteModel = athleteModelResolverService.resolve(onDate);

		// Then
		expect(athleteModel).toEqual(expectedAthleteModel);

		done();
	});

	it("should resolve a default AthleteModel when no DatedAthleteSettings found", (done: Function) => {

		// Given
		const onDate = new Date("2018-04-29");
		userSettingsModel.hasDatedAthleteSettings = true;
		const expectedAthleteModel = userSettingsModel.athleteModel;

		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [];

		athleteModelResolverService.athleteModelResolver = new AthleteModelResolver(userSettingsModel, datedAthleteSettingsModels);

		// When
		const athleteModel = athleteModelResolverService.resolve(onDate);

		// Then
		expect(athleteModel).not.toBeNull();
		expect(athleteModel).toEqual(expectedAthleteModel);

		done();
	});

	it("should not resolve AthleteModel when athleteModelResolver not ready.", (done: Function) => {

		// Given
		const onDate = "2018-01-15";
		const expectedError = new Error("AthleteModelResolver do not exists. Please update service at first with AthleteModelResolverService#update()");

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
