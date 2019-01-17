import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ActivitiesComponent } from "./activities.component";

describe("ActivitiesComponent", () => {
	let component: ActivitiesComponent;
	let fixture: ComponentFixture<ActivitiesComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ActivitiesComponent]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ActivitiesComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
