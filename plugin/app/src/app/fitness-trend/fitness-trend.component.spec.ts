import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FitnessTrendComponent } from "./fitness-trend.component";
import { SharedModule } from "../shared/shared.module";
import { CoreModule } from "../core/core.module";
import { ActivityDao } from "../shared/dao/activity/activity.dao";
import { UserSettingsDao } from "../shared/dao/user-settings/user-settings.dao";
import { userSettings } from "../../../../common/scripts/UserSettings";
import { TEST_SYNCED_ACTIVITIES } from "../../shared-fixtures/activities-2015.fixture";
import { AthleteHistoryState } from "../shared/services/athlete-history/athlete-history-state.enum";
import { AthleteProfileModel } from "../../../../common/scripts/models/AthleteProfile";
import { AthleteHistoryService } from "../shared/services/athlete-history/athlete-history.service";
import { FitnessTrendGraphComponent } from "./fitness-trend-graph/fitness-trend-graph.component";
import { By } from "@angular/platform-browser";

describe("FitnessTrendComponent", () => {

	let activityDao: ActivityDao;
	let userSettingsDao: UserSettingsDao;
	let athleteHistoryService: AthleteHistoryService;
	let component: FitnessTrendComponent;
	let fixture: ComponentFixture<FitnessTrendComponent>;
	let trendGraphComponent: FitnessTrendGraphComponent;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			]
		}).compileComponents();

		// Retrieve injected service
		activityDao = TestBed.get(ActivityDao);
		userSettingsDao = TestBed.get(UserSettingsDao);
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

		done();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(FitnessTrendComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();

		// Do not try to draw the graph
		const trendGraphComponentElement = fixture.debugElement.query(By.directive(FitnessTrendGraphComponent));
		trendGraphComponent = trendGraphComponentElement.componentInstance;
		spyOn(trendGraphComponent, "updateGraph").and.stub();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
