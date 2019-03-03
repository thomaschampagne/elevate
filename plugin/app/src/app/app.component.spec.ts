import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AppComponent } from "./app.component";
import { TEST_SYNCED_ACTIVITIES } from "../shared-fixtures/activities-2015.fixture";
import { ChromeEventsService } from "./shared/services/external-updates/impl/chrome-events.service";
import { AppModule } from "./app.module";

describe("AppComponent", () => {

	const pluginId = "c061d18abea0";
	let component: AppComponent = null;
	let fixture: ComponentFixture<AppComponent> = null;

	beforeEach((done: Function) => {

		TestBed.configureTestingModule({
			imports: [
				AppModule
			]
		}).compileComponents();

		done();
	});

	beforeEach((done: Function) => {

		spyOn(ChromeEventsService, "getBrowserExternalMessages").and.returnValue({
			addListener: (request: any, sender: chrome.runtime.MessageSender) => {
			}
		});

		spyOn(ChromeEventsService, "getBrowserPluginId").and.returnValue(pluginId);

		fixture = TestBed.createComponent(AppComponent);
		component = fixture.componentInstance;

		spyOn(component.syncService, "getLastSyncDateTime").and.returnValue(Promise.resolve(Date.now()));
		spyOn(component.syncService.activityDao, "fetch").and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));

		fixture.detectChanges();

		done();
	});

	it("should create the app", (done: Function) => {
		const app = fixture.debugElement.componentInstance;
		expect(app).toBeTruthy();
		done();
	});

	it("should have main menu items", (done: Function) => {
		const app = fixture.debugElement.componentInstance;
		expect(app.mainMenuItems.length).toEqual(6);
		done();
	});

	it("should update tool bar title (1)", (done: Function) => {

		// Given
		const expected = "Global Settings";
		const route = "/globalSettings";

		// When
		const actual = AppComponent.convertRouteToTitle(route);

		// Then
		expect(actual).toBe(expected);
		done();

	});

	it("should update tool bar title (2)", (done: Function) => {

		// Given
		const expected = "Say Hello To World";
		const route = "/sayHelloToWorld/ohMyGod";

		// When
		const actual = AppComponent.convertRouteToTitle(route);

		// Then
		expect(actual).toBe(expected);
		done();

	});

	it("should update tool bar title (3)", (done: Function) => {

		// Given
		const expected = "Oh My God";
		const route = "ohMyGod";

		// When
		const actual = AppComponent.convertRouteToTitle(route);

		// Then
		expect(actual).toBe(expected);
		done();

	});

	it("should update tool bar title (4)", (done: Function) => {

		// Given
		const expected = "Global Settings";
		const route = "/globalSettings?viewOptionHelperId=displayAdvancedHrData";

		// When
		const actual = AppComponent.convertRouteToTitle(route);

		// Then
		expect(actual).toBe(expected);
		done();

	});

	it("should not update tool bar title", (done: Function) => {

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
