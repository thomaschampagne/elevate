import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { FitnessTrendGraphComponent } from "./fitness-trend-graph.component";
import { FitnessService } from "../shared/service/fitness.service";
import { ActivityService } from "../../shared/services/activity/activity.service";
import { ActivityDao } from "../../shared/dao/activity/activity.dao";
import { TEST_SYNCED_ACTIVITIES } from "../../../shared-fixtures/activities-2015.fixture";
import * as moment from "moment";
import { Moment } from "moment";
import { UserSettingsDao } from "../../shared/dao/user-settings/user-settings.dao";
import { userSettings } from "../../../../../common/scripts/UserSettings";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { AthleteProfileModel } from "../../../../../common/scripts/models/AthleteProfile";
import { AthleteHistoryService } from "../../shared/services/athlete-history/athlete-history.service";
import { AthleteHistoryState } from "../../shared/services/athlete-history/athlete-history-state.enum";

describe("FitnessTrendGraphComponent", () => {

	let activityDao: ActivityDao;
	let userSettingsDao: UserSettingsDao;
	let activityService: ActivityService;
	let fitnessService: FitnessService;
	let athleteHistoryService: AthleteHistoryService;
	let component: FitnessTrendGraphComponent;
	let fixture: ComponentFixture<FitnessTrendGraphComponent>;
	let todayMoment: Moment;

	beforeEach(async(() => {

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			]
		}).compileComponents();

		// Retrieve injected service
		activityDao = TestBed.get(ActivityDao);
		userSettingsDao = TestBed.get(UserSettingsDao);
		activityService = TestBed.get(ActivityService);
		fitnessService = TestBed.get(FitnessService);
		athleteHistoryService = TestBed.get(AthleteHistoryService);

		// Mocking chrome storage
		spyOn(activityDao, "chromeStorageLocal").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback({computedActivities: TEST_SYNCED_ACTIVITIES});
			}
		});

		spyOn(userSettingsDao, "chromeStorageSync").and.returnValue({
			get: (keys: any, callback: (item: Object) => {}) => {
				callback(userSettings);
			},
			set: (keys: any, callback: () => {}) => {
				callback();
			}
		});

		todayMoment = moment("2015-12-01 12:00", "YYYY-MM-DD hh:mm");
		spyOn(fitnessService, "getTodayMoment").and.returnValue(todayMoment);
		spyOn(fitnessService, "indexesOf").and.returnValue({start: 289, end: 345});

		// Mocking athlete history
		const gender = "men";
		const maxHr = 200;
		const restHr = 50;
		const cyclingFtp = 150;
		const weight = 75;
		const expectedAthleteProfileModel: AthleteProfileModel = new AthleteProfileModel(
			gender,
			maxHr,
			restHr,
			cyclingFtp,
			weight);

		spyOn(athleteHistoryService, "getProfile").and.returnValue(Promise.resolve(expectedAthleteProfileModel));
		spyOn(athleteHistoryService, "getLastSyncDateTime").and.returnValue(Promise.resolve(Date.now()));
		spyOn(athleteHistoryService, "getSyncState").and.returnValue(Promise.resolve(AthleteHistoryState.SYNCED));
		spyOn(athleteHistoryService.userSettingsService, "fetch").and.returnValue(Promise.resolve(userSettings));

	}));

	beforeEach(() => {

		fixture = TestBed.createComponent(FitnessTrendGraphComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();

		// Do not try to draw the graph
		spyOn(component, "updateGraph").and.stub();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});

});
