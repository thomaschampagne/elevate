import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { AppComponent } from "./app.component";
import { CoreModule } from "./core/core.module";
import { SharedModule } from "./shared/shared.module";
import { AthleteProfileModel } from "../../../common/scripts/models/AthleteProfile";
import { TEST_SYNCED_ACTIVITIES } from "../shared-fixtures/activities-2015.fixture";
import { RemoteAthleteMismatchComponent } from "./remote-athlete-mismatch/remote-athlete-mismatch.component";
import { userSettings } from "../../../common/scripts/UserSettings";

describe("AppComponent", () => {

	let component: AppComponent = null;
	let fixture: ComponentFixture<AppComponent> = null;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			declarations: [
				AppComponent,
				RemoteAthleteMismatchComponent
			],
			imports: [
				CoreModule,
				SharedModule
			]
		}).compileComponents();

		done();
	});

	beforeEach(() => {

		fixture = TestBed.createComponent(AppComponent);
		component = fixture.componentInstance;

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

		spyOn(component.athleteHistoryService, "getProfile").and.returnValue(Promise.resolve(expectedAthleteProfileModel));
		spyOn(component.athleteHistoryService, "getLastSyncDateTime").and.returnValue(Promise.resolve(Date.now()));
		spyOn(component.athleteHistoryService.activityDao, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));
		spyOn(component.athleteHistoryService.userSettingsService, "fetch").and.returnValue(Promise.resolve(userSettings));

		fixture.detectChanges();
	});

	it("should create the app", async(() => {
		const app = fixture.debugElement.componentInstance;
		expect(app).toBeTruthy();
	}));


	it("should have main menu items", async(() => {
		const app = fixture.debugElement.componentInstance;
		expect(app.mainMenuItems.length).toEqual(6);

	}));

	it("should update tool bar title (1)", (done) => {

		// Given
		const expected = "Common Settings";
		const route = "/commonSettings";

		// When
		const actual = AppComponent.convertRouteToTitle(route);

		// Then
		expect(actual).toBe(expected);
		done();

	});

	it("should update tool bar title (2)", (done) => {

		// Given
		const expected = "Say Hello To World";
		const route = "/sayHelloToWorld/ohMyGod";

		// When
		const actual = AppComponent.convertRouteToTitle(route);

		// Then
		expect(actual).toBe(expected);
		done();

	});

	it("should update tool bar title (3)", (done) => {

		// Given
		const expected = "Oh My God";
		const route = "ohMyGod";

		// When
		const actual = AppComponent.convertRouteToTitle(route);

		// Then
		expect(actual).toBe(expected);
		done();

	});

	it("should update tool bar title (4)", (done) => {

		// Given
		const expected = "Common Settings";
		const route = "/commonSettings?viewOptionHelperId=displayAdvancedHrData";

		// When
		const actual = AppComponent.convertRouteToTitle(route);

		// Then
		expect(actual).toBe(expected);
		done();

	});

	it("should not update tool bar title", (done) => {

		// Given
		const expected = null;
		const route = null;

		// When
		const actual = AppComponent.convertRouteToTitle(route);

		// Then
		expect(actual).toBeNull(expected);
		done();

	});

});
