import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AboutDialogComponent } from "./about-dialog.component";
import { SharedModule } from "../shared/shared.module";
import { CoreModule } from "../core/core.module";
import { MatDialogRef } from "@angular/material/dialog";
import { MockedVersionsProvider } from "../shared/services/versions/impl/mock/mocked-versions-provider";
import { DataStore } from "../shared/data-store/data-store";
import { TestingDataStore } from "../shared/data-store/testing-datastore.service";
import { VersionsProvider } from "../shared/services/versions/versions-provider";

describe("AboutDialogComponent", () => {
  let component: AboutDialogComponent;
  let fixture: ComponentFixture<AboutDialogComponent>;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule],
      providers: [
        {
          provide: MatDialogRef,
          useValue: {}
        },
        { provide: DataStore, useClass: TestingDataStore },
        { provide: VersionsProvider, useClass: MockedVersionsProvider }
      ]
    }).compileComponents();
    done();
  });

  beforeEach(done => {
    fixture = TestBed.createComponent(AboutDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    done();
  });

  it("should create", done => {
    expect(component).toBeTruthy();
    done();
  });
});
