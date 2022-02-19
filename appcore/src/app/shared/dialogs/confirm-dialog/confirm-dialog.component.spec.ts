import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ConfirmDialogComponent } from "./confirm-dialog.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import { ConfirmDialogDataModel } from "./confirm-dialog-data.model";
import { TargetModule } from "../../modules/target/desktop-target.module";

describe("ConfirmDialogComponent", () => {
  const dialogTitle = "Hello World";
  const dialogContent = "Oh my god !";

  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let confirmDialogDataModel;

  beforeEach(done => {
    confirmDialogDataModel = new ConfirmDialogDataModel(dialogTitle, dialogContent);

    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      declarations: [],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: confirmDialogDataModel
        },
        {
          provide: MatDialogRef,
          useValue: {}
        }
      ]
    }).compileComponents();

    done();
  });

  beforeEach(done => {
    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    done();
  });

  it("should create", done => {
    expect(component).toBeTruthy();
    done();
  });

  it("should render the confirm dialog", done => {
    // Given
    const compiled = fixture.debugElement.nativeElement;

    // When
    fixture.detectChanges();

    // Then
    expect(component.dialogData.title).toEqual(confirmDialogDataModel.title);
    expect(component.dialogData.content).toEqual(confirmDialogDataModel.content);
    expect(compiled.querySelector("h2").textContent).toContain(dialogTitle);
    expect(compiled.querySelector("mat-dialog-content").textContent).toContain(dialogContent);
    done();
  });
});
