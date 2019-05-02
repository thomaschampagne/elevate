import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { StravaConnectorComponent } from "./strava-connector.component";

describe("StravaConnectorComponent", () => {
	let component: StravaConnectorComponent;
	let fixture: ComponentFixture<StravaConnectorComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [StravaConnectorComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(StravaConnectorComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
