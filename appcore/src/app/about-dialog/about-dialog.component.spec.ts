import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AboutDialogComponent } from "./about-dialog.component";
import { SharedModule } from "../shared/shared.module";
import { CoreModule } from "../core/core.module";
import { MatDialogRef } from "@angular/material/dialog";
import { MockedVersionsProvider } from "../shared/services/versions/impl/mock/mocked-versions-provider";
import { DataStore } from "../shared/data-store/data-store";
import { TestingDataStore } from "../shared/data-store/testing-datastore.service";
import { VersionsProvider } from "../shared/services/versions/versions-provider";
import { TargetModule } from "../shared/modules/target/desktop-target.module";
import { IPC_TUNNEL_SERVICE } from "../desktop/ipc/ipc-tunnel-service.token";
import { IpcRendererTunnelServiceMock } from "../desktop/ipc/ipc-renderer-tunnel-service.mock";

describe("AboutDialogComponent", () => {
  let component: AboutDialogComponent;
  let fixture: ComponentFixture<AboutDialogComponent>;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [
        {
          provide: MatDialogRef,
          useValue: {}
        },
        { provide: DataStore, useClass: TestingDataStore },
        { provide: VersionsProvider, useClass: MockedVersionsProvider },
        { provide: IPC_TUNNEL_SERVICE, useClass: IpcRendererTunnelServiceMock }
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
