import { NgModule } from '@angular/core';
import {
	MatButtonModule,
	MatCardModule,
	MatCheckboxModule,
	MatDialogModule,
	MatGridListModule,
	MatIconModule,
	MatInputModule,
	MatListModule,
	MatMenuModule,
	MatSidenavModule,
	MatSnackBarModule,
	MatTableModule,
	MatToolbarModule
} from '@angular/material';
import { CdkTableModule } from "@angular/cdk/table";

@NgModule({
	imports: [
		MatButtonModule,
		MatSnackBarModule,
		MatCheckboxModule,
		MatInputModule,
		MatMenuModule,
		MatIconModule,
		MatToolbarModule,
		MatSidenavModule,
		MatDialogModule,
		MatCardModule,
		MatListModule,
		MatTableModule,
		CdkTableModule,
		MatGridListModule
	],
	exports: [
		MatButtonModule,
		MatSnackBarModule,
		MatCheckboxModule,
		MatInputModule,
		MatMenuModule,
		MatIconModule,
		MatToolbarModule,
		MatSidenavModule,
		MatDialogModule,
		MatCardModule,
		MatListModule,
		MatTableModule,
		CdkTableModule,
		MatGridListModule
	],
	declarations: []
})

export class MaterialModule {
}
