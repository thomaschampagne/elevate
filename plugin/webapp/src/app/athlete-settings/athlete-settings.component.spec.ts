import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AthleteSettingsComponent } from './athlete-settings.component';

xdescribe('AthleteSettingsComponent', () => {
	let component: AthleteSettingsComponent;
	let fixture: ComponentFixture<AthleteSettingsComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [AthleteSettingsComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(AthleteSettingsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
