import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YearProgressComponent } from './year-progress.component';
import { CoreModule } from "../core/core.module";
import { SharedModule } from "../shared/shared.module";

describe('YearProgressComponent', () => {
	let component: YearProgressComponent;
	let fixture: ComponentFixture<YearProgressComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(YearProgressComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it("should _method_name_ return _describe_data_", (done: Function) => {

		// Given

		// When

		// Then

		done();
	});
});
