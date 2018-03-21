import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvancedMenuComponent } from './advanced-menu.component';

describe('AdvancedMenuComponent', () => {
	let component: AdvancedMenuComponent;
	let fixture: ComponentFixture<AdvancedMenuComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [AdvancedMenuComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(AdvancedMenuComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
