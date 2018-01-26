import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ShareComponent } from "./share.component";

describe("ShareComponent", () => {
	let component: ShareComponent;
	let fixture: ComponentFixture<ShareComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ShareComponent]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ShareComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
