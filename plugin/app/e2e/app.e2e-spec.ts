import { AppPage } from "./app.po";

describe("App", () => {
	let page: AppPage;

	beforeEach(() => {
		page = new AppPage();
	});

	it("should display welcome message", (done: Function) => {
		page.navigateTo();
		expect(page.getParagraphText()).toEqual("Welcome to app!");
		done();
	});
});
