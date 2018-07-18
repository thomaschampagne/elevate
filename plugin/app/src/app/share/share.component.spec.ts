import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ShareComponent } from "./share.component";
import { SharedModule } from "../shared/shared.module";
import { CoreModule } from "../core/core.module";

describe("ShareComponent", () => {
	let component: ShareComponent;
	let fixture: ComponentFixture<ShareComponent>;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			]
		}).compileComponents();

		done();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ShareComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
