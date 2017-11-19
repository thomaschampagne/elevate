import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoneToolBarComponent } from './zone-tool-bar.component';

describe('ZoneToolBarComponent', () => {
	let component: ZoneToolBarComponent;
	let fixture: ComponentFixture<ZoneToolBarComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ZoneToolBarComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ZoneToolBarComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
