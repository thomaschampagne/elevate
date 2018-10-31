import { ZoneModel } from "../../../shared/models/zone.model";
import { UserZonesModel } from "../../../shared/models/user-settings/user-zones.model";

describe("UserZonesModel", () => {

	it("should serialize ZoneModel[] to number[]", (done: Function) => {

		// Given
		const zones: ZoneModel[] = [
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
		const expected = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

		// When
		const zonesSerialized = UserZonesModel.serialize(zones);

		// Then
		expect(zonesSerialized).not.toBeNull();
		expect(zonesSerialized).toEqual(expected);

		done();
	});

	it("should deserialize number[] to ZoneModel[]", (done: Function) => {

		// Given
		const zonesSerialized = [-20, -10, 0, 10, 20, 30, 40, 50, 60];
		const expected: ZoneModel[] = [
			{from: -20, to: -10},
			{from: -10, to: 0},
			{from: 0, to: 10},
			{from: 10, to: 20},
			{from: 20, to: 30},
			{from: 30, to: 40},
			{from: 40, to: 50},
			{from: 50, to: 60},
		];

		// When
		const zonesDeserialized = UserZonesModel.deserialize(zonesSerialized);

		// Then
		expect(zonesDeserialized).not.toBeNull();
		expect(zonesDeserialized).toEqual(expected);

		done();
	});
});
