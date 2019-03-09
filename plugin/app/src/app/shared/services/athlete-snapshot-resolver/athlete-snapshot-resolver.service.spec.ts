import { TestBed } from "@angular/core/testing";
import { AthleteSnapshotResolverService } from "./athlete-snapshot-resolver.service";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import { AthleteModel, AthleteSettingsModel, AthleteSnapshotModel, DatedAthleteSettingsModel } from "@elevate/shared/models";
import * as _ from "lodash";
import { AthleteSnapshotResolver } from "@elevate/shared/resolvers";

describe("AthleteSnapshotResolverService", () => {

	const lthr = {default: 172, cycling: null, running: null};

	let athleteSnapshotResolverService: AthleteSnapshotResolverService;

	let defaultAthleteModel: AthleteModel;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule
			]
		});

		athleteSnapshotResolverService = TestBed.get(AthleteSnapshotResolverService);

		defaultAthleteModel = AthleteModel.DEFAULT_MODEL;

		done();
	});

	it("should be created", (done: Function) => {
		expect(athleteSnapshotResolverService).toBeTruthy();
		done();
	});

	it("should update the service", (done: Function) => {

		// Given
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75)),
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78))
		];

		defaultAthleteModel.datedAthleteSettings = datedAthleteSettingsModels;

		spyOn(athleteSnapshotResolverService.athleteService, "fetch").and.returnValue(Promise.resolve(defaultAthleteModel));

		// When
		const promise = athleteSnapshotResolverService.update();

		// Then
		promise.then(() => {

			expect(_.isEmpty(athleteSnapshotResolverService.athleteSnapshotResolver)).toBeFalsy();
			expect(athleteSnapshotResolverService.athleteSnapshotResolver.athleteModel.datedAthleteSettings).toEqual(datedAthleteSettingsModels);
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
		spyOn(athleteSnapshotResolverService.athleteService, "fetch").and.returnValue(Promise.reject(errorMessage));

		// When
		const promise = athleteSnapshotResolverService.update();

		// Then
		promise.then(() => {

			expect(_.isEmpty(athleteSnapshotResolverService.athleteSnapshotResolver)).toBeTruthy();
			expect(false).toBeTruthy("Whoops! I should not be here!");

			done();

		}, error => {

			expect(error).not.toBeNull();
			expect(error).toEqual(errorMessage);
			done();
		});

	});

	it("should resolve AthleteSnapshotModel at given date (as Date object)", (done: Function) => {

		// Given
		const onDate = new Date("2018-04-29");

		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, 55, lthr, 150, 325, 32, 76));
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75)),
			expectedDatedAthleteSettingsModel,
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78))
		];

		const expectedAthleteSnapshotModel = new AthleteSnapshotModel(defaultAthleteModel.gender, expectedDatedAthleteSettingsModel.toAthleteSettingsModel());
		const clonedDefaultAthleteModel = _.cloneDeep(defaultAthleteModel);
		clonedDefaultAthleteModel.datedAthleteSettings = datedAthleteSettingsModels;
		athleteSnapshotResolverService.athleteSnapshotResolver = new AthleteSnapshotResolver(clonedDefaultAthleteModel);

		// When
		const athleteSnapshot = athleteSnapshotResolverService.resolve(onDate);

		// Then
		expect(athleteSnapshot).toEqual(expectedAthleteSnapshotModel);

		done();
	});

	it("should resolve AthleteSnapshotModel at given date (as string) (1)", (done: Function) => {

		// Given
		const onDate = "2018-04-29";

		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, 55, lthr, 150, 325, 32, 76));
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75)),
			expectedDatedAthleteSettingsModel,
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78))
		];

		const expectedAthleteSnapshotModel = new AthleteSnapshotModel(defaultAthleteModel.gender, expectedDatedAthleteSettingsModel.toAthleteSettingsModel());
		const clonedDefaultAthleteModel = _.cloneDeep(defaultAthleteModel);
		clonedDefaultAthleteModel.datedAthleteSettings = datedAthleteSettingsModels;
		athleteSnapshotResolverService.athleteSnapshotResolver = new AthleteSnapshotResolver(clonedDefaultAthleteModel);

		// When
		const athleteSnapshot = athleteSnapshotResolverService.resolve(onDate);

		// Then
		expect(athleteSnapshot).toEqual(expectedAthleteSnapshotModel);

		done();
	});

	it("should resolve AthleteSnapshotModel at given date (as string) (2)", (done: Function) => {

		// Given
		const onDate = "2018-04-15";

		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, 55, lthr, 150, 325, 32, 76));
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75)),
			expectedDatedAthleteSettingsModel,
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78))
		];

		const expectedAthleteSnapshotModel = new AthleteSnapshotModel(defaultAthleteModel.gender, expectedDatedAthleteSettingsModel.toAthleteSettingsModel());
		const clonedDefaultAthleteModel = _.cloneDeep(defaultAthleteModel);
		clonedDefaultAthleteModel.datedAthleteSettings = datedAthleteSettingsModels;
		athleteSnapshotResolverService.athleteSnapshotResolver = new AthleteSnapshotResolver(clonedDefaultAthleteModel);

		// When
		const athleteSnapshot = athleteSnapshotResolverService.resolve(onDate);

		// Then
		expect(athleteSnapshot).toEqual(expectedAthleteSnapshotModel);

		done();
	});

	it("should resolve AthleteSnapshotModel at given date (as string) (3)", (done: Function) => {

		// Given
		const onDate = "2018-01-15";

		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78));
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75)),
			new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, 55, lthr, 150, 325, 32, 76)),
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			expectedDatedAthleteSettingsModel
		];

		const expectedAthleteSnapshotModel = new AthleteSnapshotModel(defaultAthleteModel.gender, expectedDatedAthleteSettingsModel.toAthleteSettingsModel());
		const clonedDefaultAthleteModel = _.cloneDeep(defaultAthleteModel);
		clonedDefaultAthleteModel.datedAthleteSettings = datedAthleteSettingsModels;
		athleteSnapshotResolverService.athleteSnapshotResolver = new AthleteSnapshotResolver(clonedDefaultAthleteModel);

		// When
		const athleteSnapshot = athleteSnapshotResolverService.resolve(onDate);

		// Then
		expect(athleteSnapshot).toEqual(expectedAthleteSnapshotModel);

		done();
	});

	it("should resolve AthleteSnapshotModel at given date (as string) (4)", (done: Function) => {

		// Given
		const onDate = "2018-01-15";

		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78));
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			expectedDatedAthleteSettingsModel
		];

		const expectedAthleteSnapshotModel = new AthleteSnapshotModel(defaultAthleteModel.gender, expectedDatedAthleteSettingsModel.toAthleteSettingsModel());
		const clonedDefaultAthleteModel = _.cloneDeep(defaultAthleteModel);
		clonedDefaultAthleteModel.datedAthleteSettings = datedAthleteSettingsModels;
		athleteSnapshotResolverService.athleteSnapshotResolver = new AthleteSnapshotResolver(clonedDefaultAthleteModel);

		// When
		const athleteSnapshot = athleteSnapshotResolverService.resolve(onDate);

		// Then
		expect(athleteSnapshot).toEqual(expectedAthleteSnapshotModel);

		done();
	});

	it("should resolve AthleteSnapshotModel at given date (as string)", (done: Function) => {

		// Given
		const onDate = "2018-01-15";

		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78));
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75)),
			new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, 55, lthr, 150, 325, 32, 76)),
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			expectedDatedAthleteSettingsModel
		];

		const expectedAthleteSnapshotModel = new AthleteSnapshotModel(defaultAthleteModel.gender, expectedDatedAthleteSettingsModel.toAthleteSettingsModel());
		const clonedDefaultAthleteModel = _.cloneDeep(defaultAthleteModel);
		clonedDefaultAthleteModel.datedAthleteSettings = datedAthleteSettingsModels;
		athleteSnapshotResolverService.athleteSnapshotResolver = new AthleteSnapshotResolver(clonedDefaultAthleteModel);

		// When
		const athleteSnapshot = athleteSnapshotResolverService.resolve(onDate);

		// Then
		expect(athleteSnapshot).toEqual(expectedAthleteSnapshotModel);

		done();
	});

	it("should resolve current and latest AthleteSnapshotModel", (done: Function) => {

		// Given
		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75));
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			expectedDatedAthleteSettingsModel,
			new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, 55, lthr, 150, 325, 32, 76)),
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78))
		];

		const expectedAthleteSnapshotModel = new AthleteSnapshotModel(defaultAthleteModel.gender, expectedDatedAthleteSettingsModel.toAthleteSettingsModel());
		const clonedDefaultAthleteModel = _.cloneDeep(defaultAthleteModel);
		clonedDefaultAthleteModel.datedAthleteSettings = datedAthleteSettingsModels;
		athleteSnapshotResolverService.athleteSnapshotResolver = new AthleteSnapshotResolver(clonedDefaultAthleteModel);

		// When
		const athleteSnapshot = athleteSnapshotResolverService.getCurrent();

		// Then
		expect(athleteSnapshot).toEqual(expectedAthleteSnapshotModel);

		done();
	});

	it("should resolve AthleteSnapshotModel with not sorted dated athlete settings", (done: Function) => {

		// Given
		const onDate = "2018-04-15";

		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, 55, lthr, 150, 325, 32, 76));

		// Below dated athlete settings are not sorted along since attribute
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75)),
			new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			expectedDatedAthleteSettingsModel,
		];

		const expectedAthleteSnapshotModel = new AthleteSnapshotModel(defaultAthleteModel.gender, expectedDatedAthleteSettingsModel.toAthleteSettingsModel());
		const clonedDefaultAthleteModel = _.cloneDeep(defaultAthleteModel);
		clonedDefaultAthleteModel.datedAthleteSettings = datedAthleteSettingsModels;
		athleteSnapshotResolverService.athleteSnapshotResolver = new AthleteSnapshotResolver(clonedDefaultAthleteModel);


		// When
		const athleteSnapshot = athleteSnapshotResolverService.resolve(onDate);

		// Then
		expect(athleteSnapshot).toEqual(expectedAthleteSnapshotModel);

		done();
	});

	it("should resolve a default AthleteModel when no DatedAthleteSettings found", (done: Function) => {

		// Given
		const onDate = new Date("2018-04-29");
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [];

		const expectedAthleteSnapshotModel = new AthleteSnapshotModel(defaultAthleteModel.gender, AthleteSettingsModel.DEFAULT_MODEL);
		const clonedDefaultAthleteModel = _.cloneDeep(defaultAthleteModel);
		clonedDefaultAthleteModel.datedAthleteSettings = datedAthleteSettingsModels;
		athleteSnapshotResolverService.athleteSnapshotResolver = new AthleteSnapshotResolver(clonedDefaultAthleteModel);

		// When
		const athleteSnapshot = athleteSnapshotResolverService.resolve(onDate);

		// Then
		expect(athleteSnapshot).not.toBeNull();
		expect(athleteSnapshot).toEqual(expectedAthleteSnapshotModel);

		done();
	});

	it("should resolve forever AthleteSnapshotModel when an invalid date is given (new Date(undefined))", (done: Function) => {

		// Given
		const onDate = new Date(undefined);

		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78));
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75)),
			new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, 55, lthr, 150, 325, 32, 76)),
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			expectedDatedAthleteSettingsModel
		];

		const expectedAthleteSnapshotModel = new AthleteSnapshotModel(defaultAthleteModel.gender, expectedDatedAthleteSettingsModel.toAthleteSettingsModel());
		const clonedDefaultAthleteModel = _.cloneDeep(defaultAthleteModel);
		clonedDefaultAthleteModel.datedAthleteSettings = datedAthleteSettingsModels;
		athleteSnapshotResolverService.athleteSnapshotResolver = new AthleteSnapshotResolver(clonedDefaultAthleteModel);

		// When
		const athleteSnapshot = athleteSnapshotResolverService.resolve(onDate);

		// Then
		expect(athleteSnapshot).toEqual(expectedAthleteSnapshotModel);

		done();
	});

	it("should resolve forever AthleteSnapshotModel when an invalid date is given (13 months)", (done: Function) => {

		// Given
		const onDate = "2018-13-15"; // Invalid date: 13 months

		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78));
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75)),
			new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, 55, lthr, 150, 325, 32, 76)),
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			expectedDatedAthleteSettingsModel
		];

		const expectedAthleteSnapshotModel = new AthleteSnapshotModel(defaultAthleteModel.gender, expectedDatedAthleteSettingsModel.toAthleteSettingsModel());
		const clonedDefaultAthleteModel = _.cloneDeep(defaultAthleteModel);
		clonedDefaultAthleteModel.datedAthleteSettings = datedAthleteSettingsModels;
		athleteSnapshotResolverService.athleteSnapshotResolver = new AthleteSnapshotResolver(clonedDefaultAthleteModel);

		// When
		const athleteSnapshot = athleteSnapshotResolverService.resolve(onDate);

		// Then
		expect(athleteSnapshot).toEqual(expectedAthleteSnapshotModel);

		done();
	});

	it("should resolve forever AthleteSnapshotModel when an undefined date is given (undefined)", (done: Function) => {

		// Given
		const onDate = undefined;

		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78));
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75)),
			new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, 55, lthr, 150, 325, 32, 76)),
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			expectedDatedAthleteSettingsModel
		];

		const expectedAthleteSnapshotModel = new AthleteSnapshotModel(defaultAthleteModel.gender, expectedDatedAthleteSettingsModel.toAthleteSettingsModel());
		const clonedDefaultAthleteModel = _.cloneDeep(defaultAthleteModel);
		clonedDefaultAthleteModel.datedAthleteSettings = datedAthleteSettingsModels;
		athleteSnapshotResolverService.athleteSnapshotResolver = new AthleteSnapshotResolver(clonedDefaultAthleteModel);

		// When
		const athleteSnapshot = athleteSnapshotResolverService.resolve(onDate);

		// Then
		expect(athleteSnapshot).toEqual(expectedAthleteSnapshotModel);

		done();
	});

	it("should resolve forever AthleteSnapshotModel when an undefined date is given (wrong pattern)", (done: Function) => {

		// Given
		const onDate = "2018-13.15"; // Wrong pattern

		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78));
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75)),
			new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, 55, lthr, 150, 325, 32, 76)),
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			expectedDatedAthleteSettingsModel
		];

		const expectedAthleteSnapshotModel = new AthleteSnapshotModel(defaultAthleteModel.gender, expectedDatedAthleteSettingsModel.toAthleteSettingsModel());
		const clonedDefaultAthleteModel = _.cloneDeep(defaultAthleteModel);
		clonedDefaultAthleteModel.datedAthleteSettings = datedAthleteSettingsModels;
		athleteSnapshotResolverService.athleteSnapshotResolver = new AthleteSnapshotResolver(clonedDefaultAthleteModel);

		// When
		const athleteSnapshot = athleteSnapshotResolverService.resolve(onDate);

		// Then
		expect(athleteSnapshot).toEqual(expectedAthleteSnapshotModel);

		done();
	});

	it("should resolve forever AthleteSnapshotModel when a wrong date (Type Date) is given", (done: Function) => {

		// Given
		const onDate = new Date(undefined);

		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78));
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75)),
			new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, 55, lthr, 150, 325, 32, 76)),
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			expectedDatedAthleteSettingsModel
		];

		const expectedAthleteSnapshotModel = new AthleteSnapshotModel(defaultAthleteModel.gender, expectedDatedAthleteSettingsModel.toAthleteSettingsModel());
		const clonedDefaultAthleteModel = _.cloneDeep(defaultAthleteModel);
		clonedDefaultAthleteModel.datedAthleteSettings = datedAthleteSettingsModels;
		athleteSnapshotResolverService.athleteSnapshotResolver = new AthleteSnapshotResolver(clonedDefaultAthleteModel);

		// When
		const athleteSnapshot = athleteSnapshotResolverService.resolve(onDate);

		// Then
		expect(athleteSnapshot).toEqual(expectedAthleteSnapshotModel);

		done();
	});

	it("should resolve forever AthleteSnapshotModel when a wrong date (undefined) is given", (done: Function) => {

		// Given
		const onDate = undefined;

		const expectedDatedAthleteSettingsModel = new DatedAthleteSettingsModel(null, new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78));
		const datedAthleteSettingsModels: DatedAthleteSettingsModel[] = [
			new DatedAthleteSettingsModel("2018-05-10", new AthleteSettingsModel(200, 50, lthr, 190, 325, 32, 75)),
			new DatedAthleteSettingsModel("2018-04-15", new AthleteSettingsModel(195, 55, lthr, 150, 325, 32, 76)),
			new DatedAthleteSettingsModel("2018-02-01", new AthleteSettingsModel(190, 65, lthr, 110, 325, 32, 78)),
			expectedDatedAthleteSettingsModel
		];

		const expectedAthleteSnapshotModel = new AthleteSnapshotModel(defaultAthleteModel.gender, expectedDatedAthleteSettingsModel.toAthleteSettingsModel());
		const clonedDefaultAthleteModel = _.cloneDeep(defaultAthleteModel);
		clonedDefaultAthleteModel.datedAthleteSettings = datedAthleteSettingsModels;
		athleteSnapshotResolverService.athleteSnapshotResolver = new AthleteSnapshotResolver(clonedDefaultAthleteModel);

		// When
		const athleteSnapshot = athleteSnapshotResolverService.resolve(onDate);

		// Then
		expect(athleteSnapshot).toEqual(expectedAthleteSnapshotModel);

		done();
	});

	it("should not resolve AthleteModel when athleteSnapshotResolver not ready.", (done: Function) => {

		// Given
		const onDate = "2018-01-15";
		const expectedError = new Error("AthleteSnapshotResolver do not exists. Please update service at first with AthleteSnapshotResolverService#update()");

		// When
		const call = () => {
			athleteSnapshotResolverService.resolve(onDate);
		};

		// Then
		expect(call).toThrow(expectedError);

		done();
	});

});
