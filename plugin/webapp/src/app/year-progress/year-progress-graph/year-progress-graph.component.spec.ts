import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YearProgressGraphComponent } from './year-progress-graph.component';

describe('YearProgressGraphComponent', () => {
	let component: YearProgressGraphComponent;
	let fixture: ComponentFixture<YearProgressGraphComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [YearProgressGraphComponent]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(YearProgressGraphComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
