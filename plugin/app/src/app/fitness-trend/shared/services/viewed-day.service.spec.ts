import { TestBed } from "@angular/core/testing";

import { ViewedDayService } from "./viewed-day.service";
import { DayFitnessTrendModel } from "../models/day-fitness-trend.model";
import { DayStressModel } from "../models/day-stress.model";

describe("ViewedDayService", () => {

	let service: ViewedDayService;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			providers: [ViewedDayService]
		});

		service = TestBed.get(ViewedDayService);
		done();
	});

	it("should be created", (done: Function) => {
		expect(service).toBeTruthy();
		done();
	});

	it("should notify subscribers when ViewedDay change", (done: Function) => {

		// Given
		const expectedCallCount = 1;
		const spy = spyOn(service.changes, "next");
		const dayStressModel = new DayStressModel(new Date(), false);
		const dayFitnessTrendModel: DayFitnessTrendModel = new DayFitnessTrendModel(dayStressModel, 10, 10, 10);

		// When
		service.onChange(dayFitnessTrendModel);

		// Then
		expect(spy).toHaveBeenCalledTimes(expectedCallCount);
		expect(spy).toHaveBeenCalledWith(dayFitnessTrendModel);
		done();
	});

});
