import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FaqComponent } from "./faq.component";
import { CoreModule } from "../core/core.module";
import { SharedModule } from "../shared/shared.module";

describe("FaqComponent", () => {
	let component: FaqComponent;
	let fixture: ComponentFixture<FaqComponent>;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			]
		}).compileComponents();
		done();
	});

	beforeEach((done: Function) => {
		fixture = TestBed.createComponent(FaqComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		done();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
