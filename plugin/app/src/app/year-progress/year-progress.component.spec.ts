import { ComponentFixture, TestBed } from "@angular/core/testing";

import { YearProgressComponent } from "./year-progress.component";
import { SharedModule } from "../shared/shared.module";
import { ActivityCountByTypeModel } from "./shared/models/activity-count-by-type.model";
import { CoreModule } from "../core/core.module";
import { YearProgressStyleModel } from "./year-progress-graph/models/year-progress-style.model";
import { YearProgressModel } from "./shared/models/year-progress.model";
import { ActivityDao } from "../shared/dao/activity/activity.dao";
import { AthleteHistoryService } from "../shared/services/athlete-history/athlete-history.service";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { AthleteProfileModel } from "../../../../common/scripts/models/AthleteProfile";
import { AthleteHistoryState } from "../shared/services/athlete-history/athlete-history-state.enum";
import { YearProgressActivitiesFixture } from "./shared/services/year-progress-activities.fixture";
import { userSettings } from "../../../../common/scripts/UserSettings";
import { SyncedActivityModel } from "../../../../common/scripts/models/Sync";

describe("YearProgressComponent", () => {

	let component: YearProgressComponent;
	let fixture: ComponentFixture<YearProgressComponent>;

	let athleteHistoryService: AthleteHistoryService;
	let userSettingsService: UserSettingsService;
	let activityDao: ActivityDao;
	let TEST_SYNCED_ACTIVITIES: SyncedActivityModel[];

	beforeEach((done: Function) => {

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			],
			providers: []
		}).compileComponents();

		TEST_SYNCED_ACTIVITIES = YearProgressActivitiesFixture.provide();
		athleteHistoryService = TestBed.get(AthleteHistoryService);
		userSettingsService = TestBed.get(UserSettingsService);
		activityDao = TestBed.get(ActivityDao);

		// Mocking athlete history
		const gender = "men";
		const maxHr = 200;
		const restHr = 50;
		const cyclingFtp = 150;
		const weight = 75;
		const athleteProfileModel: AthleteProfileModel = new AthleteProfileModel(
			gender,
			maxHr,
			restHr,
			cyclingFtp,
			weight);

		spyOn(athleteHistoryService, "getProfile").and.returnValue(Promise.resolve(athleteProfileModel));
		spyOn(athleteHistoryService, "getLastSyncDateTime").and.returnValue(Promise.resolve(Date.now()));
		spyOn(athleteHistoryService, "getSyncState").and.returnValue(Promise.resolve(AthleteHistoryState.SYNCED));
		spyOn(userSettingsService, "fetch").and.returnValue(Promise.resolve(userSettings));
		spyOn(activityDao, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));

		done();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(YearProgressComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});

	it("should determine most performed activity type", (done: Function) => {

		// Given
		const expected = "Ride";
		const activitiesCountByTypeModels: ActivityCountByTypeModel[] = [
			{type: "AlpineSki", count: 12},
			{type: "Ride", count: 522},
			{type: "Run", count: 25},
			{type: "Walk", count: 32},
			{type: "Hike", count: 8},
			{type: "Swim", count: 5},
			{type: "VirtualRide", count: 29},
			{type: "InlineSkate", count: 3},
			{type: "Workout", count: 6}
		];

		// When
		const mostPerformedType = component.findMostPerformedActivityType(activitiesCountByTypeModels);

		// Then
		expect(mostPerformedType).toEqual(expected);
		done();
	});

	it("should give proper colors to all year lines from a color palette", (done: Function) => {

		// Given
		const colorPalette: string [] = ["red", "blue", "green", "purple", "orange"];
		const expectedGlobalColors: string [] = ["red", "blue", "green", "purple", "orange", "red", "blue"];

		const yearProgressModels: YearProgressModel[] = [
			new YearProgressModel(2011, []),
			new YearProgressModel(2012, []),
			new YearProgressModel(2013, []),
			new YearProgressModel(2014, []),
			new YearProgressModel(2015, []),
			new YearProgressModel(2016, []),
			new YearProgressModel(2017, []),
		];

		// When
		const style: YearProgressStyleModel = component.styleFromPalette(yearProgressModels, colorPalette);

		// Then
		expect(style.colors).toEqual(expectedGlobalColors);

		expect(style.yearsColorsMap.get(2011)).toEqual("red");
		expect(style.yearsColorsMap.get(2012)).toEqual("blue");
		expect(style.yearsColorsMap.get(2013)).toEqual("green");
		expect(style.yearsColorsMap.get(2014)).toEqual("purple");
		expect(style.yearsColorsMap.get(2015)).toEqual("orange");
		expect(style.yearsColorsMap.get(2016)).toEqual("red");
		expect(style.yearsColorsMap.get(2017)).toEqual("blue");
		done();
	});

});
