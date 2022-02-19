import { TestBed } from "@angular/core/testing";
import { CoreModule } from "../../../../core/core.module";
import { SharedModule } from "../../../shared.module";
import { DataStore } from "../../../data-store/data-store";
import { TestingDataStore } from "../../../data-store/testing-datastore.service";
import { DesktopVersionsProvider } from "./desktop-versions-provider.service";
import { TargetModule } from "../../../modules/target/desktop-target.module";
import { IPC_TUNNEL_SERVICE } from "../../../../desktop/ipc/ipc-tunnel-service.token";
import { IpcRendererTunnelServiceMock } from "../../../../desktop/ipc/ipc-renderer-tunnel-service.mock";

describe("DesktopVersionsProvider", () => {
  let service: DesktopVersionsProvider;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [
        DesktopVersionsProvider,
        { provide: DataStore, useClass: TestingDataStore },
        { provide: IPC_TUNNEL_SERVICE, useClass: IpcRendererTunnelServiceMock }
      ]
    });

    // Retrieve injected preferencesService
    service = TestBed.inject(DesktopVersionsProvider);

    done();
  });

  it("should provide the existing version", done => {
    // Given
    const expectedVersion = "5.5.5";
    const getVersionSpy = spyOn(service.ipcStorageService, "get").and.returnValue(Promise.resolve(expectedVersion));

    // When
    const promise = service.getExistingVersion();

    // Then
    promise.then(
      existingVersion => {
        expect(existingVersion).toEqual(expectedVersion);
        expect(getVersionSpy).toHaveBeenCalledTimes(1);
        done();
      },
      () => {
        throw new Error("Should not be here");
      }
    );
  });
});
