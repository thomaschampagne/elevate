import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ReleasesNotesComponent } from "./releases-notes.component";
import { ReleasesNotesModule } from "./releases-notes.module";
import { CoreModule } from "../core/core.module";
import { SharedModule } from "../shared/shared.module";

describe("ReleasesNotesComponent", () => {
	let component: ReleasesNotesComponent;
	let fixture: ComponentFixture<ReleasesNotesComponent>;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				ReleasesNotesModule
			]
		}).compileComponents();

		done();
	});

	beforeEach((done: Function) => {
		fixture = TestBed.createComponent(ReleasesNotesComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		done();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
