import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { GotItDialog } from "./got-it-dialog.component";

xdescribe("GotItDialogComponent", () => {
	let component: GotItDialog;
	let fixture: ComponentFixture<GotItDialog>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
		declarations: [GotItDialog]
    })
    .compileComponents();
  }));

  beforeEach(() => {
	  fixture = TestBed.createComponent(GotItDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
