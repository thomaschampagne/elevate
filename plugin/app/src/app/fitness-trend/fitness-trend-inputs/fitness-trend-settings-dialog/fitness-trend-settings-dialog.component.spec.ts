import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FitnessTrendSettingsDialogComponent } from './fitness-trend-settings-dialog.component';

describe('FitnessTrendSettingsDialogComponent', () => {
	let component: FitnessTrendSettingsDialogComponent;
	let fixture: ComponentFixture<FitnessTrendSettingsDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [FitnessTrendSettingsDialogComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(FitnessTrendSettingsDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
