import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdvancedMenuComponent } from "./advanced-menu.component";
import { CoreModule } from "../core/core.module";
import { SharedModule } from "../shared/shared.module";

describe("AdvancedMenuComponent", () => {
	let component: AdvancedMenuComponent;
	let fixture: ComponentFixture<AdvancedMenuComponent>;

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
		fixture = TestBed.createComponent(AdvancedMenuComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
