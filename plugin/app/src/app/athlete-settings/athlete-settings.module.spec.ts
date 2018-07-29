import { AthleteSettingsModule } from "./athlete-settings.module";

describe("AthleteSettingsModule", () => {
	let athleteSettingsModule: AthleteSettingsModule;

	beforeEach(() => {
		athleteSettingsModule = new AthleteSettingsModule();
	});

	it("should create an instance", () => {
		expect(athleteSettingsModule).toBeTruthy();
	});
});
