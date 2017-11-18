import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ZonesSettingsComponent } from './zones-settings.component';

describe('ZonesSettingsComponent', () => {
	let component: ZonesSettingsComponent;
	let fixture: ComponentFixture<ZonesSettingsComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ZonesSettingsComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ZonesSettingsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
