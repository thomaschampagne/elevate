import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ManageYearProgressPresetsDialogComponent } from "./manage-year-progress-presets-dialog.component";
import { YearProgressModule } from "../year-progress.module";
import { YearProgressService } from "../shared/services/year-progress.service";

describe("ManageYearProgressPresetsDialogComponent", () => {
	let component: ManageYearProgressPresetsDialogComponent;
	let fixture: ComponentFixture<ManageYearProgressPresetsDialogComponent>;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				YearProgressModule
			],
			providers: [YearProgressService]
		}).compileComponents();

		done();
	});

	beforeEach((done: Function) => {
		fixture = TestBed.createComponent(ManageYearProgressPresetsDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		done();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
