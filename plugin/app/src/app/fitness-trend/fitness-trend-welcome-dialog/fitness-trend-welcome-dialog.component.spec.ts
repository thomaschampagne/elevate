import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FitnessTrendWelcomeDialogComponent } from './fitness-trend-welcome-dialog.component';

describe('FitnessTrendWelcomeDialogComponent', () => {
	let component: FitnessTrendWelcomeDialogComponent;
	let fixture: ComponentFixture<FitnessTrendWelcomeDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [FitnessTrendWelcomeDialogComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(FitnessTrendWelcomeDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
