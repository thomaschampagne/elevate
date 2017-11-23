import { inject, TestBed } from '@angular/core/testing';
import { ZonesService } from './zones.service';
import * as _ from "lodash";
import { IZone } from "../../../../common/scripts/interfaces/IActivityData";

describe('ZonesService', () => {

	let zoneService: ZonesService;

	beforeEach(() => {

		TestBed.configureTestingModule({
			providers: [ZonesService]
		});

		zoneService = TestBed.get(ZonesService);

		const USER_ZONES = [ // Set 10 fake zones
			{from: 0, to: 10},
			{from: 10, to: 20},
			{from: 20, to: 30},
			{from: 30, to: 40},
			{from: 40, to: 50},
			{from: 50, to: 60},
			{from: 60, to: 70},
			{from: 70, to: 80},
			{from: 80, to: 90},
			{from: 90, to: 100}
		];

		zoneService.currentZones = USER_ZONES;
	});

	it('should be created', inject([ZonesService], (zoneService: ZonesService) => {
		expect(zoneService).toBeTruthy();
	}));

	it('should add a last zone', (done: Function) => {

		// Given
		const expectedZonesLength = 11;
		const expectedZoneIdAdded = 11;

		// When
		const addZoneLastPromise: Promise<string> = zoneService.addLastZone();

		// Then
		addZoneLastPromise.then((result: string) => {

			const lastAddedZone = _.last(zoneService.currentZones);

			expect(result).not.toBeNull();


			expect(result).toEqual("Zone <" + expectedZoneIdAdded + "> has been added.");

			expect(zoneService.currentZones.length).toBe(expectedZonesLength);
			expect(lastAddedZone.from).toBe(95);
			expect(lastAddedZone.to).toBe(100);

			done();
		});

	});

	it('should not add last zone if MAX zone count reached', (done: Function) => {

		// Given
		const MAX_ZONE_COUNT = 10;
		spyOn(zoneService, 'getMaxZoneCount').and.returnValue(MAX_ZONE_COUNT);

		// When
		const addZoneLastPromise: Promise<string> = zoneService.addLastZone();

		// Then
		addZoneLastPromise.then((result: string) => {

			expect(result).toBeNull();
			done();

		}, (error: string) => {

			expect(error).not.toBeNull();
			expect(error).toEqual("You can't add more than " + MAX_ZONE_COUNT + " zones...");
			expect(zoneService.currentZones.length).toBe(MAX_ZONE_COUNT);

			done();
		});
	});

	it('should remove a last zone', (done: Function) => {

		// Given
		const expectedZonesLength = 9;
		const expectedZoneIdRemoved = 10;

		// When
		const removeZoneLastPromise: Promise<string> = zoneService.removeLastZone();

		// Then
		removeZoneLastPromise.then((result: string) => {

			expect(result).not.toBeNull();
			expect(result).toEqual("Zone <" + expectedZoneIdRemoved + "> has been removed.");
			expect(zoneService.currentZones.length).toBe(expectedZonesLength);

			const lastZone = _.last(zoneService.currentZones);
			expect(lastZone.from).toBe(80);
			expect(lastZone.to).toBe(90);

			done();
		});
	});

	it('should not remove last zone if MIN zone count reached', (done: Function) => {

		// Given
		const MIN_ZONE_COUNT = 10;
		spyOn(zoneService, 'getMinZoneCount').and.returnValue(MIN_ZONE_COUNT);


		// When
		const removeZoneLastPromise: Promise<string> = zoneService.removeLastZone();

		// Then
		removeZoneLastPromise.then((result: string) => {

			expect(result).toBeNull();
			done();

		}, (error: string) => {

			expect(error).not.toBeNull();
			expect(error).toEqual("You can't remove more than " + MIN_ZONE_COUNT + " zones...");
			expect(zoneService.currentZones.length).toBe(MIN_ZONE_COUNT);

			done();
		});
	});

	it('should remove zone at index', (done: Function) => {

		// Given
		const removeIndex = 4;
		const expectedZonesLength = 9;

		// When
		const removeZoneAtIndexPromise: Promise<string> = zoneService.removeZoneAtIndex(removeIndex);

		// Then
		removeZoneAtIndexPromise.then((result: string) => {

			expect(result).not.toBeNull();
			expect(result).toEqual("Zone <" + (removeIndex + 1) + "> has been removed.");
			expect(zoneService.currentZones.length).toBe(expectedZonesLength);

			const previousZone: IZone = zoneService.currentZones[removeIndex - 1];
			const newNextZone: IZone = zoneService.currentZones[removeIndex]; // Is actually same index than the removed
			expect(newNextZone.from).toBe(previousZone.to);

			done();
		});
	});

	it('should not remove zone at index if MIN zone count reached', (done: Function) => {

		// Given
		const MIN_ZONE_COUNT = 10;
		const removeIndex = 6;
		spyOn(zoneService, 'getMinZoneCount').and.returnValue(MIN_ZONE_COUNT);


		// When
		const removeZoneAtIndexPromise: Promise<string> = zoneService.removeZoneAtIndex(removeIndex);

		// Then
		removeZoneAtIndexPromise.then((result: string) => {

			expect(result).toBeNull();
			done();

		}, (error: string) => {

			expect(error).not.toBeNull();
			expect(error).toEqual("You can't remove more than " + MIN_ZONE_COUNT + " zones...");
			expect(zoneService.currentZones.length).toBe(MIN_ZONE_COUNT);

			done();
		});
	});

	it('should notify the previous Zone ("TO") when his own "FROM" has been changed', (done: Function) => {
		// TODO
		// Given
		// When
		// Then
		throw new Error("Not implemented")
	});

	it('should not notify the previous Zone if "FROM" has changed & zone edited is the first', (done: Function) => {
		// TODO
		// Given
		// When
		// Then
		throw new Error("Not implemented")
	});

	it('should notify the next Zone ("FROM") when his own "TO" has been changed', (done: Function) => {
		// TODO
		// Given
		// When
		// Then
		throw new Error("Not implemented")
	});

	it('should not notify the next Zone if "TO" has changed & zone edited is the latest', (done: Function) => {
		// TODO
		// Given
		// When
		// Then
		throw new Error("Not implemented")
	});

});
