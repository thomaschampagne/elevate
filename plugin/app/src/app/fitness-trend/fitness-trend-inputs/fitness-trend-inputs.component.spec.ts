import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FitnessTrendInputsComponent } from "./fitness-trend-inputs.component";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { FitnessTrendModule } from "../fitness-trend.module";

describe("FitnessTrendInputsComponent", () => {

	let component: FitnessTrendInputsComponent;
	let fixture: ComponentFixture<FitnessTrendInputsComponent>;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				FitnessTrendModule
			]
		}).compileComponents();

		done();
	});

	beforeEach((done: Function) => {

		fixture = TestBed.createComponent(FitnessTrendInputsComponent);
		component = fixture.componentInstance;

		component.periodViewed = {
			from: new Date(),
			to: new Date()
		};

		fixture.detectChanges();
		done();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
