import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { AppComponent } from "./app.component";
import { CoreModule } from "./core/core.module";
import { SharedModule } from "./shared/shared.module";

describe("AppComponent", () => {

	let component: AppComponent = null;
	let fixture: ComponentFixture<AppComponent> = null;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [
				AppComponent,
			],
			imports: [
				CoreModule,
				SharedModule
			]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(AppComponent);
		component = fixture.componentInstance;
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
