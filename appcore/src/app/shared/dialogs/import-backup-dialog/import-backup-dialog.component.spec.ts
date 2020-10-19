import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportBackupDialogComponent } from "./import-backup-dialog.component";
import { CoreModule } from "../../../core/core.module";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { SharedModule } from "../../shared.module";
import { TargetModule } from "../../modules/target/desktop-target.module";

describe("ImportBackupDialogComponent", () => {
  let component: ImportBackupDialogComponent;
  let fixture: ComponentFixture<ImportBackupDialogComponent>;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      declarations: [],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {}
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
    fixture = TestBed.createComponent(ImportBackupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    done();
  });

  it("should create", done => {
    expect(component).toBeTruthy();
    done();
  });
});
