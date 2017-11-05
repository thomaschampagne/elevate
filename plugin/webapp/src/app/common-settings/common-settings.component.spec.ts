import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonSettingsComponent } from './common-settings.component';

describe('CommonSettingsComponent', () => {
	let component: CommonSettingsComponent;
	let fixture: ComponentFixture<CommonSettingsComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [CommonSettingsComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(CommonSettingsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
