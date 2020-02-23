import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ActivityViewComponent } from "./activity-view.component";
import { CoreModule } from "../core/core.module";
import { SharedModule } from "../shared/shared.module";

describe("ActivityViewComponent", () => {
	let component: ActivityViewComponent;
	let fixture: ComponentFixture<ActivityViewComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ActivityViewComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
