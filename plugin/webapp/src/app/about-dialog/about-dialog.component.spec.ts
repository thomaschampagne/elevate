import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutDialogComponent } from './about-dialog.component';
import { SharedModule } from "../shared/shared.module";
import { CoreModule } from "../core/core.module";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";

xdescribe('AboutDialogComponent', () => {
	let component: AboutDialogComponent;
	let fixture: ComponentFixture<AboutDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			],
			providers: [
				{
					provide: MAT_DIALOG_DATA, useValue: {},
				},
				{
					provide: MatDialogRef, useValue: {},
				},
			]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(AboutDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
