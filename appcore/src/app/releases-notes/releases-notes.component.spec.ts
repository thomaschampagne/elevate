import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReleasesNotesComponent } from "./releases-notes.component";
import { ReleasesNotesModule } from "./releases-notes.module";
import { CoreModule } from "../core/core.module";
import { SharedModule } from "../shared/shared.module";
import { TargetModule } from "../shared/modules/target/desktop-target.module";
import { DataStore } from "../shared/data-store/data-store";
import { TestingDataStore } from "../shared/data-store/testing-datastore.service";

describe("ReleasesNotesComponent", () => {
  let component: ReleasesNotesComponent;
  let fixture: ComponentFixture<ReleasesNotesComponent>;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule, ReleasesNotesModule],
      providers: [{ provide: DataStore, useClass: TestingDataStore }]
    }).compileComponents();

    done();
  });

  beforeEach(done => {
    fixture = TestBed.createComponent(ReleasesNotesComponent);
    component = fixture.componentInstance;
    spyOn(component.versionsProvider, "getPlatform").and.returnValue(null);
    fixture.detectChanges();
    done();
  });

  it("should create", done => {
    expect(component).toBeTruthy();
    done();
  });
});
