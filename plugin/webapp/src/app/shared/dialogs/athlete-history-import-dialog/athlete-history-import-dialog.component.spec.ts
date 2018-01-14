import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AthleteHistoryImportDialogComponent } from './athlete-history-import-dialog.component';

xdescribe('AthleteHistoryImportDialogComponent', () => {

	let component: AthleteHistoryImportDialogComponent;
	let fixture: ComponentFixture<AthleteHistoryImportDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [AthleteHistoryImportDialogComponent]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(AthleteHistoryImportDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
