import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AthleteSettingsConsistencyRibbonComponent } from "./athlete-settings-consistency-ribbon.component";
import { CoreModule } from "../core/core.module";
import { SharedModule } from "../shared/shared.module";

describe("AthleteSettingsConsistencyRibbonComponent", () => {
	let component: AthleteSettingsConsistencyRibbonComponent;
	let fixture: ComponentFixture<AthleteSettingsConsistencyRibbonComponent>;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			declarations: [
				AthleteSettingsConsistencyRibbonComponent
			],
			imports: [
				CoreModule,
				SharedModule,
			],
		}).compileComponents();

		done();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(AthleteSettingsConsistencyRibbonComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
