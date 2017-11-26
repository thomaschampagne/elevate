import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FitnessTrendGraphComponent } from './fitness-trend-graph.component';

xdescribe('FitnessTrendComponent', () => {
	let component: FitnessTrendGraphComponent;
	let fixture: ComponentFixture<FitnessTrendGraphComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [FitnessTrendGraphComponent]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(FitnessTrendGraphComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
