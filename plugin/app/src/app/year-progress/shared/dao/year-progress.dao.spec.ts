import { TestBed } from "@angular/core/testing";
import { YearProgressDao } from "./year-progress.dao";
import { YearProgressPresetModel } from "../models/year-progress-preset.model";
import { ProgressType } from "../models/progress-type.enum";
import * as _ from "lodash";

describe("YearProgressDao", () => {

	let service: YearProgressDao;
	let yearProgressPresets: YearProgressPresetModel[];
	let browserStorageLocalSpy: jasmine.Spy;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			providers: [YearProgressDao]
		});

		yearProgressPresets = [
			new YearProgressPresetModel(ProgressType.DISTANCE, ["Run"], false, false, 750),
			new YearProgressPresetModel(ProgressType.COUNT, ["VirtualRide"], false, false),
			new YearProgressPresetModel(ProgressType.ELEVATION, ["Ride"], false, false, 30000),
		];

		service = TestBed.get(YearProgressDao);

		browserStorageLocalSpy = spyOn(service, "browserStorageLocal");

		done();

	});

	it("should be created", (done: Function) => {
		expect(service).toBeTruthy();
		done();
	});


	it("should fetch existing presets", (done: Function) => {

		// Given
		browserStorageLocalSpy.and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback({yearProgressPresets: yearProgressPresets});
			}
		});

		spyOn(service, "getChromeError").and.returnValue(undefined);

		// When
		const promise: Promise<YearProgressPresetModel[]> = service.fetchPresets();

		// Then
		promise.then((result: YearProgressPresetModel[]) => {

			expect(result).not.toBeNull();
			expect(result).toEqual(yearProgressPresets);
			expect(browserStorageLocalSpy).toHaveBeenCalledTimes(1);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	it("should fetch empty presets", (done: Function) => {

		// Given
		browserStorageLocalSpy.and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback({});
			}
		});

		const expected = [];

		spyOn(service, "getChromeError").and.returnValue(undefined);

		// When
		const promise: Promise<YearProgressPresetModel[]> = service.fetchPresets();

		// Then
		promise.then((result: YearProgressPresetModel[]) => {

			expect(result).not.toBeNull();
			expect(browserStorageLocalSpy).toHaveBeenCalledTimes(1);
			expect(result).toEqual(expected);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});


	it("should save presets", (done: Function) => {

		// Given
		const yearProgressPresetsModel = _.cloneDeep(yearProgressPresets);
		let fakeStorage: any = {
			yearProgressPresets: yearProgressPresetsModel
		};

		browserStorageLocalSpy.and.returnValue({
			set: (object: Object, callback: () => {}) => {
				fakeStorage = object;
				callback();
			},
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(fakeStorage);
			}
		});

		spyOn(service, "getChromeError").and.returnValue(undefined);

		const updatedPresetsModels = [
			new YearProgressPresetModel(ProgressType.TIME, ["Ride"], true, true, 200)
		];

		// When
		const promise: Promise<YearProgressPresetModel[]> = service.savePresets(updatedPresetsModels);

		// Then
		promise.then((result: YearProgressPresetModel[]) => {

			expect(result).not.toBeNull();
			expect(browserStorageLocalSpy).toHaveBeenCalledTimes(2);
			expect(result).toEqual(updatedPresetsModels);

			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});
	});

	/*
		it("should delete presets", (done: Function) => {

			// Given
			const yearProgressPresetsModel = _.cloneDeep(yearProgressPresets);
			let fakeStorage: any = {
				yearProgressPresets: yearProgressPresetsModel
			};

			browserStorageLocalSpy.and.returnValue({
				set: (object: Object, callback: () => {}) => {
					fakeStorage = object;
					callback();
				},
				get: (keys: any, callback: (item: Object) => {}) => {
					callback(fakeStorage);
				}
			});

			spyOn(service, "getChromeError").and.returnValue(undefined);

			const updatedPresetsModels = [
				new YearProgressPresetModel(ProgressType.TIME, ["Ride"], true, true, 200)
			];

			// When
			const promise: Promise<YearProgressPresetModel[]> = service.savePresets(updatedPresetsModels);

			// Then
			promise.then((result: YearProgressPresetModel[]) => {

				expect(result).not.toBeNull();
				expect(browserStorageLocalSpy).toHaveBeenCalledTimes(2);
				expect(result).toEqual(updatedPresetsModels);

				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});
		});
	*/
});
