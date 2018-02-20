import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ReleasesNotesComponent } from "./releases-notes.component";
import { CoreModule } from "../core/core.module";
import { SharedModule } from "../shared/shared.module";

describe("ReleasesNotesComponent", () => {
	let component: ReleasesNotesComponent;
	let fixture: ComponentFixture<ReleasesNotesComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ReleasesNotesComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
