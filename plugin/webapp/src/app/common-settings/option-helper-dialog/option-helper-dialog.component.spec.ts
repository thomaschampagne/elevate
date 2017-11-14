import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionHelperDialogComponent } from './option-helper-dialog.component';

xdescribe('OptionHelperDialogComponent', () => {
	let component: OptionHelperDialogComponent;
	let fixture: ComponentFixture<OptionHelperDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [OptionHelperDialogComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(OptionHelperDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
