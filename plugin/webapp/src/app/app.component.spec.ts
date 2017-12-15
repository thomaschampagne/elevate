import { async, TestBed } from "@angular/core/testing";
import { AppComponent } from "./app.component";
import { CoreModule } from "./core/core.module";
import { SharedModule } from "./shared/shared.module";

describe("AppComponent", () => {
	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [
				AppComponent,
			],
			imports: [
				CoreModule,
				SharedModule
			],
			providers: []
		}).compileComponents();
	}));

	it("should create the app", async(() => {
		const fixture = TestBed.createComponent(AppComponent);
		const app = fixture.debugElement.componentInstance;
		expect(app).toBeTruthy();
	}));

	it("should have main menu items", async(() => {
		const fixture = TestBed.createComponent(AppComponent);
		const app = fixture.debugElement.componentInstance;
		expect(app.mainMenuItems.length).toEqual(5);

	}));

	it("should update tool bar title (1)", (done) => {

		// Given
		const expected = "Common Settings";
		const routerUrl = "/commonSettings";

		// Then
		const actual = AppComponent.updateToolBarTitle(routerUrl);

		// When
		expect(actual).toBe(expected);
		done();

	});

	it("should update tool bar title (2)", (done) => {

		// Given
		const expected = "Say Hello To World";
		const routerUrl = "/sayHelloToWorld/ohMyGod";

		// Then
		const actual = AppComponent.updateToolBarTitle(routerUrl);

		// When
		expect(actual).toBe(expected);
		done();

	});

	it("should not update tool bar title", (done) => {

		// Given
		const expected = null;
		const routerUrl = null;

		// Then
		const actual = AppComponent.updateToolBarTitle(routerUrl);

		// When
		expect(actual).toBeNull(expected);
		done();

	});

	/*	it("should render title in a h1 tag", async(() => {
            const fixture = TestBed.createComponent(AppComponent);
            fixture.detectChanges();
            const compiled = fixture.debugElement.nativeElement;
            expect(compiled.querySelector("h1").textContent).toContain("Welcome to app!");
        }));*/
});
