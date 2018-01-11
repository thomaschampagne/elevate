import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YearProgressHelperDialogComponent } from './year-progress-helper-dialog.component';

describe('YearProgressHelperDialogComponent', () => {
	let component: YearProgressHelperDialogComponent;
	let fixture: ComponentFixture<YearProgressHelperDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [YearProgressHelperDialogComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(YearProgressHelperDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
