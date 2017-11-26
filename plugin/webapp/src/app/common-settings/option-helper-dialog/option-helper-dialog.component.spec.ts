import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionHelperDialog } from './option-helper-dialog.component';
import { MaterialModule } from "../../material.module";

xdescribe('OptionHelperDialogComponent', () => {
	let component: OptionHelperDialog;
	let fixture: ComponentFixture<OptionHelperDialog>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [MaterialModule],
			declarations: [OptionHelperDialog],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(OptionHelperDialog);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
