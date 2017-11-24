import { inject, TestBed } from '@angular/core/testing';
import { IZoneChange, IZoneChangeInstruction, ZonesService } from './zones.service';
import * as _ from "lodash";
import { IZone } from "../../../../common/scripts/interfaces/IActivityData";
import { ChromeStorageService } from "./chrome-storage.service";
import { IZoneDefinition, ZONE_DEFINITIONS } from "../zones-settings/zone-definitions";

describe('ZonesService', () => {

	let zoneService: ZonesService;

	beforeEach(() => {

		TestBed.configureTestingModule({
			providers: [ZonesService, ChromeStorageService]
		});

		// Retrieve injected service
		zoneService = TestBed.get(ZonesService);

		// Set 10 fake zones
		zoneService.currentZones = [
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

	it('should remove zone at index of first zone', (done: Function) => {

		// Given
		const removeIndex = 0; // First zone
		const expectedZonesLength = 9;
		const oldNextZone: IZone = _.clone(zoneService.currentZones[removeIndex + 1]);

		// When
		const removeZoneAtIndexPromise: Promise<string> = zoneService.removeZoneAtIndex(removeIndex);

		// Then
		removeZoneAtIndexPromise.then((result: string) => {

			expect(result).not.toBeNull();
			expect(result).toEqual("Zone <" + (removeIndex + 1) + "> has been removed.");
			expect(zoneService.currentZones.length).toBe(expectedZonesLength);

			const newFirstZone: IZone = zoneService.currentZones[removeIndex]; // Is actually the new first zone
			expect(newFirstZone.from).toBe(oldNextZone.from);
			expect(newFirstZone.to).toBe(oldNextZone.to);

			done();
		});

	});

	it('should remove zone at index of last zone', (done: Function) => {

		// Given
		const removeIndex = 9; // Last zone
		const expectedZonesLength = 9;
		const oldPreviousZone: IZone = _.clone(zoneService.currentZones[removeIndex - 1]);

		// When
		const removeZoneAtIndexPromise: Promise<string> = zoneService.removeZoneAtIndex(removeIndex);

		// Then
		removeZoneAtIndexPromise.then((result: string) => {

			expect(result).not.toBeNull();
			expect(result).toEqual("Zone <" + (removeIndex + 1) + "> has been removed.");
			expect(zoneService.currentZones.length).toBe(expectedZonesLength);

			const newLastZone: IZone = _.last(zoneService.currentZones); // Is actually the new last zone
			expect(newLastZone.from).toBe(oldPreviousZone.from);
			expect(newLastZone.to).toBe(oldPreviousZone.to);

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

		// Given, increment +1 from of third sourceZone.
		const index = 2;
		const updatedFromValue: number = zoneService.currentZones[index].from + 1; // Apply the change

		const zoneChange: IZoneChange = {
			sourceId: index,
			from: true,
			to: false,
			value: updatedFromValue
		};

		// When, Then
		zoneService.instructionListener.subscribe((instruction: IZoneChangeInstruction) => {

			expect(_.isEmpty(instruction)).toBeFalsy();
			expect(instruction.sourceId).toEqual(index);
			expect(instruction.destinationId).toEqual(index - 1); // Must be the previous index

			expect(instruction.to).toBeTruthy();
			expect(instruction.from).toBeFalsy();
			expect(instruction.value).toEqual(updatedFromValue);

			done();

		}, error => {

			expect(error).toBeNull();
			done();
		});

		zoneService.notifyChange(zoneChange);

	});

	it('should not notify the previous Zone if "FROM" has changed & zone edited is the first', (done: Function) => {

		// Given, increment +1 from of first source zone
		const index = 0; // First zone
		const updatedFromValue: number = zoneService.currentZones[index].from + 1; // Apply the change

		const zoneChange: IZoneChange = {
			sourceId: index,
			from: true,
			to: false,
			value: updatedFromValue
		};


		// When, Then
		zoneService.instructionListener.subscribe((instruction: IZoneChangeInstruction) => {
			expect(instruction).toBeNull();
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

		zoneService.notifyChange(zoneChange);
	});

	it('should notify the next Zone ("FROM") when his own "TO" has been changed', (done: Function) => {

		// Given, decrement -1 a "to" zone.
		const index = 7;
		const updatedToValue: number = zoneService.currentZones[index].to - 1; // Apply the change

		const zoneChange: IZoneChange = {
			sourceId: index,
			from: false,
			to: true,
			value: updatedToValue
		};

		// When, Then
		zoneService.instructionListener.subscribe((instruction: IZoneChangeInstruction) => {

			expect(_.isEmpty(instruction)).toBeFalsy();
			expect(instruction.sourceId).toEqual(index);
			expect(instruction.destinationId).toEqual(index + 1); // Must be the previous index

			expect(instruction.from).toBeTruthy();
			expect(instruction.to).toBeFalsy();
			expect(instruction.value).toEqual(updatedToValue);

			done();

		}, error => {

			expect(error).toBeNull();
			done();
		});

		zoneService.notifyChange(zoneChange);

	});

	it('should notify the next Zone ("FROM") when his own "TO" has been changed & zone edited is the first', (done: Function) => {

		// Given
		const index = 0; // First zone
		const updatedToValue: number = zoneService.currentZones[index].to + 4; // Apply the change

		const zoneChange: IZoneChange = {
			sourceId: index,
			from: false,
			to: true,
			value: updatedToValue
		};

		// When, Then
		zoneService.instructionListener.subscribe((instruction: IZoneChangeInstruction) => {

			expect(_.isEmpty(instruction)).toBeFalsy();
			expect(instruction.sourceId).toEqual(index);
			expect(instruction.destinationId).toEqual(index + 1); // Must be the previous index

			expect(instruction.from).toBeTruthy();
			expect(instruction.to).toBeFalsy();
			expect(instruction.value).toEqual(updatedToValue);

			done();

		}, error => {

			expect(error).toBeNull();
			done();
		});

		zoneService.notifyChange(zoneChange);

	});

	it('should not notify the next Zone if "TO" has changed & zone edited is the latest', (done: Function) => {

		// Given, increment +1 from of last source zone
		const index = 9; // Last zone
		const updatedToValue: number = zoneService.currentZones[index].to + 1; // Apply the change

		const zoneChange: IZoneChange = {
			sourceId: index,
			from: false,
			to: true,
			value: updatedToValue
		};

		// When, Then
		zoneService.instructionListener.subscribe((instruction: IZoneChangeInstruction) => {
			expect(instruction).toBeNull();
			done();

		}, error => {
			expect(error).toBeNull();
			done();
		});

		zoneService.notifyChange(zoneChange);

	});

	it('should fail when "from" & "to" change are equals', (done: Function) => {

		// Given
		const zoneChange: IZoneChange = {
			sourceId: 5,
			from: true,
			to: true,
			value: 99
		};

		// When, Then
		zoneService.instructionListener.subscribe((instruction: IZoneChangeInstruction) => {
			expect(instruction).toBeNull();
			done();

		}, error => {
			expect(error).not.toBeNull();
			expect(error).toBe("Impossible to notify both 'from' & 'to' changes at the same time");
			done();
		});

		zoneService.notifyChange(zoneChange);
	});

	it('should fail when value is not a number', (done: Function) => {

		// Given
		const zoneChange: IZoneChange = {
			sourceId: 3,
			from: true,
			to: false,
			value: null
		};

		// When, Then
		zoneService.instructionListener.subscribe((instruction: IZoneChangeInstruction) => {
			expect(instruction).toBeNull();
			done();

		}, error => {
			expect(error).not.toBeNull();
			expect(error).toBe("Value provided is not a number");
			done();
		});

		zoneService.notifyChange(zoneChange);
	});

	it('should return compliant zones', (done: Function) => {

		// Given
		zoneService.currentZones;

		// When
		const isCompliant: boolean = zoneService.isCurrentZonesCompliant();

		// Then
		expect(isCompliant).toBeTruthy();

		done();
	});


	it('should return not compliant zones with error on a "from"', (done: Function) => {

		// Given
		const MOCKED_ZONES = [ // Set 10 fake zones
			{from: 0, to: 10},
			{from: 10, to: 20},
			{from: 20, to: 30},
			{from: 99, to: 40}, // Mistake here (from: 99)!
			{from: 40, to: 50},
			{from: 50, to: 60},
			{from: 60, to: 70},
			{from: 70, to: 80},
			{from: 80, to: 90},
			{from: 90, to: 100}
		];
		spyOnProperty(zoneService, 'currentZones', 'get').and.returnValue(MOCKED_ZONES);

		// When
		const isCompliant: boolean = zoneService.isCurrentZonesCompliant();

		// Then
		expect(isCompliant).toBeFalsy();

		done();
	});

	it('should return not compliant zones with error on a "to"', (done: Function) => {

		// Given
		const MOCKED_ZONES = [ // Set 10 fake zones
			{from: 0, to: 10},
			{from: 10, to: 20},
			{from: 20, to: 30},
			{from: 30, to: 40},
			{from: 40, to: 50},
			{from: 50, to: 61}, // Mistake here (to: 61)!
			{from: 60, to: 70},
			{from: 70, to: 80},
			{from: 80, to: 90},
			{from: 90, to: 100}
		];
		spyOnProperty(zoneService, 'currentZones', 'get').and.returnValue(MOCKED_ZONES);

		// When
		const isCompliant: boolean = zoneService.isCurrentZonesCompliant();

		// Then
		expect(isCompliant).toBeFalsy();

		done();

	});

	it('should return not compliant zones with max zone count reached', (done: Function) => {

		// Given
		const MAX_ZONE_COUNT = 10;

		const MOCKED_ZONES = [ // Set 10 fake zones
			{from: 0, to: 10},
			{from: 10, to: 20},
			{from: 20, to: 30},
			{from: 30, to: 40},
			{from: 40, to: 50},
			{from: 50, to: 61},
			{from: 60, to: 70},
			{from: 70, to: 80},
			{from: 80, to: 90},
			{from: 90, to: 100},
			{from: 100, to: 110}, // Add a 11th zone
		];

		spyOn(zoneService, 'getMaxZoneCount').and.returnValue(MAX_ZONE_COUNT);

		spyOnProperty(zoneService, 'currentZones', 'get').and.returnValue(MOCKED_ZONES);

		// When
		const isCompliant: boolean = zoneService.isCurrentZonesCompliant();

		// Then
		expect(isCompliant).toBeFalsy();

		done();

	});

	it('should return not compliant zones with min zone count reached', (done: Function) => {

		// Given
		const MIN_ZONE_COUNT = 5;

		const MOCKED_ZONES = [ // Set 4 fake zones
			{from: 0, to: 10},
			{from: 10, to: 20},
			{from: 20, to: 30},
			{from: 30, to: 40}
		];

		spyOn(zoneService, 'getMinZoneCount').and.returnValue(MIN_ZONE_COUNT);

		spyOnProperty(zoneService, 'currentZones', 'get').and.returnValue(MOCKED_ZONES);

		// When
		const isCompliant: boolean = zoneService.isCurrentZonesCompliant();

		// Then
		expect(isCompliant).toBeFalsy();
		expect(zoneService.currentZones.length).toEqual(MOCKED_ZONES.length);

		done();

	});

	it('should return not compliant zones is zone empty', (done: Function) => {

		// Given
		spyOnProperty(zoneService, 'currentZones', 'get').and.returnValue(null);

		// When
		const isCompliant: boolean = zoneService.isCurrentZonesCompliant();

		// Then
		expect(isCompliant).toBeFalsy();

		done();

	});

	it('should reset zones to default', (done: Function) => {

		// Given
		const EXISTING_ZONES = [ // Set 10 fake zones
			{from: 0, to: 110},
			{from: 110, to: 210},
			{from: 210, to: 310},
			{from: 310, to: 410},
			{from: 410, to: 510},
			{from: 510, to: 611},
			{from: 610, to: 710},
			{from: 710, to: 810},
			{from: 810, to: 910},
			{from: 910, to: 1100},
		];

		const DEFAULT_SPEED_ZONES_MOCKED: IZone[] = [
			{from: 0, to: 10},
			{from: 10, to: 20},
			{from: 20, to: 30},
			{from: 30, to: 40},
			{from: 40, to: 50}
		];

		const DEFAULT_USER_SETTINGS_MOCKED = {
			zones: {
				speed: DEFAULT_SPEED_ZONES_MOCKED
			}
		};

		const SPEED_ZONE_DEFINITION_MOCKED: IZoneDefinition = _.find(ZONE_DEFINITIONS,
			{
				value: "speed"
			}
		);

		zoneService.currentZones = EXISTING_ZONES;

		const fetchUserSettingsSpy = spyOn(zoneService.chromeStorageService, 'fetchUserSettings').and.returnValue(Promise.resolve(DEFAULT_USER_SETTINGS_MOCKED));
		const zoneDefinitionSpy = spyOnProperty(zoneService, 'zoneDefinition', 'get').and.returnValue(SPEED_ZONE_DEFINITION_MOCKED);
		const zonesCompliantSpy = spyOn(zoneService, 'isCurrentZonesCompliant');

		// When
		const promiseReset: Promise<boolean> = zoneService.resetZonesToDefault();

		// Then
		promiseReset.then(() => {

			expect(fetchUserSettingsSpy).toHaveBeenCalledTimes(1);
			expect(zoneDefinitionSpy).toHaveBeenCalledTimes(1);
			expect(zonesCompliantSpy).toHaveBeenCalledTimes(1);

			expect(zoneService.currentZones.length).toEqual(DEFAULT_SPEED_ZONES_MOCKED.length);
			expect(zoneService.currentZones.length).not.toEqual(EXISTING_ZONES.length);
			expect(_.last(zoneService.currentZones)).toEqual(_.last(DEFAULT_SPEED_ZONES_MOCKED));

			done();

		}, error => {

			expect(error).toBeNull();
			done();
		});

	});

	it('should save zone', (done: Function) => {

		// Given

		// When
		zoneService.saveZones();

		// Then

		done();
	});

});
