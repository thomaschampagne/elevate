import * as _ from "lodash";
import { GradeCalculator } from "./grade-calculator";
import * as strava_3025376963 from "./fixtures/strava_3025376963.json";
import * as strava_3025855594 from "./fixtures/strava_3025855594.json";

describe("GradeCalculator", () => {

	const averageDeltaBetweenStreams = (actualStream: number[], expectedStream: number[]) => {
		let deltaSum = 0;
		actualStream.forEach((value, index) => {
			deltaSum += Math.abs(value - expectedStream[index]);
		});
		return deltaSum / actualStream.length;
	};

	describe("Grade computing", () => {

		it("should compute grade", (done: Function) => {

			// Given
			const previousDistance = 10;
			const currentDistance = 15;
			const previousAltitude = 200;
			const currentAltitude = 201;

			// When
			const gradePercentage = GradeCalculator.computeGrade(previousDistance, currentDistance, previousAltitude, currentAltitude);

			// Then
			expect(gradePercentage).toEqual(20);
			done();
		});

		it("should calculate grade stream from activity strava_3025376963", (done: Function) => {

			// Given
			const distanceStream = _.clone(strava_3025376963.distance);
			const altitudeStream = _.clone(strava_3025376963.altitude);

			// When
			const gradeStream: number[] = GradeCalculator.computeGradeStream(distanceStream, altitudeStream);

			// Then
			expect(gradeStream.length).toEqual(distanceStream.length);
			expect(gradeStream.length).toEqual(altitudeStream.length);

			const deltaBetweenStreams = averageDeltaBetweenStreams(gradeStream, strava_3025376963.grade_smooth);
			expect(deltaBetweenStreams).toBeLessThan(1.5);

			done();
		});

		it("should calculate grade stream from activity strava_3025855594", (done: Function) => {

			// Given
			const distanceStream = _.clone(strava_3025855594.distance);
			const altitudeStream = _.clone(strava_3025855594.altitude);

			// When
			const gradeStream: number[] = GradeCalculator.computeGradeStream(distanceStream, altitudeStream);

			// Then
			expect(gradeStream.length).toEqual(distanceStream.length);
			expect(gradeStream.length).toEqual(altitudeStream.length);

			const deltaBetweenStreams = averageDeltaBetweenStreams(gradeStream, strava_3025855594.grade_smooth);
			expect(deltaBetweenStreams).toBeLessThan(1.5);

			done();
		});

	});

	describe("Grade adjusted speed", () => {

		it("should model grade adjusted pace at grade of -32", () => {

			// Given
			const speedMeterSeconds = 10;
			const grade = -30;

			// When
			const gradeAdjustedSpeed = GradeCalculator.estimateAdjustedSpeed(speedMeterSeconds, grade);

			// Then
			expect(_.floor(gradeAdjustedSpeed, 1)).toEqual(14.9);
		});

		it("should model grade adjusted pace at grade of 0", () => {

			// Given
			const speedMeterSeconds = 10;
			const grade = 0;

			// When
			const gradeAdjustedSpeed = GradeCalculator.estimateAdjustedSpeed(speedMeterSeconds, grade);

			// Then
			expect(_.floor(gradeAdjustedSpeed, 1)).toEqual(9.9);
		});

		it("should model grade adjusted pace at grade of 6", () => {

			// Given
			const speedMeterSeconds = 10;
			const grade = 6;

			// When
			const gradeAdjustedSpeed = GradeCalculator.estimateAdjustedSpeed(speedMeterSeconds, grade);

			// Then
			expect(_.floor(gradeAdjustedSpeed, 1)).toEqual(12.3);
		});

		it("should model grade adjusted pace at grade of 28", () => {

			// Given
			const speedMeterSeconds = 10;
			const grade = 28;

			// When
			const gradeAdjustedSpeed = GradeCalculator.estimateAdjustedSpeed(speedMeterSeconds, grade);

			// Then
			expect(_.floor(gradeAdjustedSpeed, 1)).toEqual(29.6);
		});

	});

});
