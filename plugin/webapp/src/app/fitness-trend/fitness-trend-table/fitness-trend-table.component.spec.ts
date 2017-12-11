import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FitnessTrendTableComponent } from './fitness-trend-table.component';

xdescribe('FitnessTrendTableComponent', () => {
	let component: FitnessTrendTableComponent;
	let fixture: ComponentFixture<FitnessTrendTableComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [FitnessTrendTableComponent]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(FitnessTrendTableComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
