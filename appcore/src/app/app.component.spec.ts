import { AppComponent } from "./app.component";

describe("AppComponent", () => {

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
