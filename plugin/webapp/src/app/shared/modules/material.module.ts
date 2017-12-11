import { NgModule } from "@angular/core";
import {
	MatButtonModule,
	MatCardModule,
	MatCheckboxModule,
	MatDatepickerModule,
	MatDialogModule,
	MatGridListModule,
	MatIconModule,
	MatInputModule,
	MatListModule,
	MatMenuModule,
	MatNativeDateModule,
	MatOptionModule,
	MatSelectModule,
	MatSidenavModule,
	MatSlideToggleModule,
	MatSnackBarModule,
	MatTableModule,
	MatTabsModule,
	MatToolbarModule,
	MatTooltipModule
} from "@angular/material";
import { CdkTableModule } from "@angular/cdk/table";

@NgModule({
	imports: [
		MatButtonModule,
		MatSnackBarModule,
		MatCheckboxModule,
		MatSelectModule,
		MatOptionModule,
		MatInputModule,
		MatMenuModule,
		MatTooltipModule,
		MatIconModule,
		MatToolbarModule,
		MatSidenavModule,
		MatDialogModule,
		MatCardModule,
		MatListModule,
		MatTableModule,
		CdkTableModule,
		MatGridListModule,
		MatSlideToggleModule,
		MatDatepickerModule,
		MatNativeDateModule,
		MatTabsModule
	],
	exports: [
		MatButtonModule,
		MatSnackBarModule,
		MatCheckboxModule,
		MatSelectModule,
		MatOptionModule,
		MatInputModule,
		MatMenuModule,
		MatTooltipModule,
		MatIconModule,
		MatToolbarModule,
		MatSidenavModule,
		MatDialogModule,
		MatCardModule,
		MatListModule,
		MatTableModule,
		CdkTableModule,
		MatGridListModule,
		MatSlideToggleModule,
		MatDatepickerModule,
		MatNativeDateModule,
		MatTabsModule
	],
	declarations: []
})

export class MaterialModule {
}
