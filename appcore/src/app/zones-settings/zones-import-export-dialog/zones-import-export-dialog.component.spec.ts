import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ZonesImportExportDialogComponent } from "./zones-import-export-dialog.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { SharedModule } from "../../shared/shared.module";
import { CoreModule } from "../../core/core.module";
import { ZoneImportExportDataModel } from "./zone-import-export-data.model";
import { ZoneDefinitionModel } from "../../shared/models/zone-definition.model";
import { Mode } from "./mode.enum";
import { DataStore } from "../../shared/data-store/data-store";
import { TestingDataStore } from "../../shared/data-store/testing-datastore.service";
import { TargetModule } from "../../shared/modules/target/desktop-target.module";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { ZoneType } from "@elevate/shared/enums/zone-type.enum";
import { UserZonesModel } from "@elevate/shared/models/user-settings/user-zones.model";
import DesktopUserSettings = UserSettings.DesktopUserSettings;

describe("ZonesImportExportDialogComponent", () => {
  const zoneSpeedDefinition: ZoneDefinitionModel = {
    name: "Cycling Speed",
    value: ZoneType.SPEED,
    units: "KPH",
    step: 0.1,
    min: 0,
    max: 9999,
    customDisplay: null
  };

  let component: ZonesImportExportDialogComponent;
  let fixture: ComponentFixture<ZonesImportExportDialogComponent>;
  let zoneImportExportDataModelAsExport: ZoneImportExportDataModel;

  beforeEach(done => {
    zoneImportExportDataModelAsExport = new ZoneImportExportDataModel(
      zoneSpeedDefinition,
      UserZonesModel.deserialize(DesktopUserSettings.DEFAULT_MODEL.zones.speed),
      Mode.EXPORT
    );

    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      declarations: [],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: zoneImportExportDataModelAsExport
        },
        {
          provide: MatDialogRef,
          useValue: {}
        },
        {
          provide: DataStore,
          useClass: TestingDataStore
        }
      ]
    }).compileComponents();

    done();
  });

  beforeEach(done => {
    fixture = TestBed.createComponent(ZonesImportExportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    done();
  });

  it("should create", done => {
    expect(component).toBeTruthy();
    done();
  });

  it("should render the 'Export' zones dialog", done => {
    // Given
    const compiled = fixture.debugElement.nativeElement;
    const expected = JSON.stringify(UserZonesModel.deserialize(DesktopUserSettings.DEFAULT_MODEL.zones.speed));

    // When
    fixture.detectChanges();

    // Then
    expect(component.zonesJsonData).toEqual(expected);
    expect(compiled.querySelector("h2").textContent).toContain("Export <Cycling Speed> zones");
    done();
  });
});
