import { inject, TestBed } from "@angular/core/testing";
import { ZonesService } from "./zones.service";
import _ from "lodash";
import { ZONE_DEFINITIONS } from "../zone-definitions";
import { ZoneChangeWhisperModel } from "./zone-change-whisper.model";
import { ZoneChangeOrderModel } from "./zone-change-order.model";
import { ZoneDefinitionModel } from "../../shared/models/zone-definition.model";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { DataStore } from "../../shared/data-store/data-store";
import { TestingDataStore } from "../../shared/data-store/testing-datastore.service";
import { TargetModule } from "../../shared/modules/target/desktop-target.module";
import { IpcRendererTunnelServiceMock } from "../../desktop/ipc/ipc-renderer-tunnel-service.mock";
import { IPC_TUNNEL_SERVICE } from "../../desktop/ipc/ipc-tunnel-service.token";
import { ZoneModel } from "@elevate/shared/models/zone.model";
import { UserZonesModel } from "@elevate/shared/models/user-settings/user-zones.model";
import { ZoneType } from "@elevate/shared/enums/zone-type.enum";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import DesktopUserSettings = UserSettings.DesktopUserSettings;

describe("ZonesService", () => {
  let zonesService: ZonesService;
  let updateZonesSpy: jasmine.Spy;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [
        { provide: DataStore, useClass: TestingDataStore },
        { provide: IPC_TUNNEL_SERVICE, useClass: IpcRendererTunnelServiceMock }
      ]
    });

    // Retrieve injected service
    zonesService = TestBed.inject(ZonesService);
    updateZonesSpy = spyOn(zonesService.userSettingsService, "updateZones");
    updateZonesSpy.and.returnValue(Promise.resolve());

    // Set 10 fake zones
    zonesService.currentZones = [
      { from: 0, to: 10 },
      { from: 10, to: 20 },
      { from: 20, to: 30 },
      { from: 30, to: 40 },
      { from: 40, to: 50 },
      { from: 50, to: 60 },
      { from: 60, to: 70 },
      { from: 70, to: 80 },
      { from: 80, to: 90 },
      { from: 90, to: 100 }
    ];

    done();
  });

  it("should be created", inject([ZonesService], (zoneService: ZonesService) => {
    expect(zoneService).toBeTruthy();
  }));

  it("should add a last zone", done => {
    // Given
    const expectedZonesLength = 11;
    const expectedZoneIdAdded = 11;

    // When
    const addZoneLastPromise: Promise<string> = zonesService.addLastZone();

    // Then
    addZoneLastPromise.then((result: string) => {
      const lastAddedZone = _.last(zonesService.currentZones);

      expect(result).not.toBeNull();

      expect(result).toEqual("Zone " + expectedZoneIdAdded + " has been added.");

      expect(zonesService.currentZones.length).toBe(expectedZonesLength);
      expect(lastAddedZone.from).toBe(95);
      expect(lastAddedZone.to).toBe(100);

      done();
    });
  });

  it("should not add last zone if MAX zone count reached", done => {
    // Given
    const MAX_ZONE_COUNT = 10;
    spyOn(zonesService, "getMaxZoneCount").and.returnValue(MAX_ZONE_COUNT);

    // When
    const addZoneLastPromise: Promise<string> = zonesService.addLastZone();

    // Then
    addZoneLastPromise.then(
      (result: string) => {
        expect(result).toBeNull();
        done();
      },
      (error: string) => {
        expect(error).not.toBeNull();
        expect(error).toEqual("You can't add more than " + MAX_ZONE_COUNT + " zones...");
        expect(zonesService.currentZones.length).toBe(MAX_ZONE_COUNT);

        done();
      }
    );
  });

  it("should remove a last zone", done => {
    // Given
    const expectedZonesLength = 9;
    const expectedZoneIdRemoved = 10;

    // When
    const removeZoneLastPromise: Promise<string> = zonesService.removeLastZone();

    // Then
    removeZoneLastPromise.then((result: string) => {
      expect(result).not.toBeNull();
      expect(result).toEqual("Zone " + expectedZoneIdRemoved + " has been removed.");
      expect(zonesService.currentZones.length).toBe(expectedZonesLength);

      const lastZone = _.last(zonesService.currentZones);
      expect(lastZone.from).toBe(80);
      expect(lastZone.to).toBe(90);

      done();
    });
  });

  it("should not remove last zone if MIN zone count reached", done => {
    // Given
    const MIN_ZONE_COUNT = 10;
    spyOn(zonesService, "getMinZoneCount").and.returnValue(MIN_ZONE_COUNT);

    // When
    const removeZoneLastPromise: Promise<string> = zonesService.removeLastZone();

    // Then
    removeZoneLastPromise.then(
      (result: string) => {
        expect(result).toBeNull();
        done();
      },
      (error: string) => {
        expect(error).not.toBeNull();
        expect(error).toEqual("You can't remove more than " + MIN_ZONE_COUNT + " zones...");
        expect(zonesService.currentZones.length).toBe(MIN_ZONE_COUNT);

        done();
      }
    );
  });

  it("should remove zone at index", done => {
    // Given
    const removeIndex = 4;
    const expectedZonesLength = 9;

    // When
    const removeZoneAtIndexPromise: Promise<string> = zonesService.removeZoneAtIndex(removeIndex);

    // Then
    removeZoneAtIndexPromise.then((result: string) => {
      expect(result).not.toBeNull();
      expect(result).toEqual("Zone <" + (removeIndex + 1) + "> has been removed.");
      expect(zonesService.currentZones.length).toBe(expectedZonesLength);

      const previousZone: ZoneModel = zonesService.currentZones[removeIndex - 1];
      const newNextZone: ZoneModel = zonesService.currentZones[removeIndex]; // Is actually same index than the removed
      expect(newNextZone.from).toBe(previousZone.to);

      done();
    });
  });

  it("should remove zone at index of first zone", done => {
    // Given
    const removeIndex = 0; // First zone
    const expectedZonesLength = 9;
    const oldNextZone: ZoneModel = _.clone(zonesService.currentZones[removeIndex + 1]);

    // When
    const removeZoneAtIndexPromise: Promise<string> = zonesService.removeZoneAtIndex(removeIndex);

    // Then
    removeZoneAtIndexPromise.then((result: string) => {
      expect(result).not.toBeNull();
      expect(result).toEqual("Zone <" + (removeIndex + 1) + "> has been removed.");
      expect(zonesService.currentZones.length).toBe(expectedZonesLength);

      const newFirstZone: ZoneModel = zonesService.currentZones[removeIndex]; // Is actually the new first zone
      expect(newFirstZone.from).toBe(oldNextZone.from);
      expect(newFirstZone.to).toBe(oldNextZone.to);

      done();
    });
  });

  it("should remove zone at index of last zone", done => {
    // Given
    const removeIndex = 9; // Last zone
    const expectedZonesLength = 9;
    const oldPreviousZone: ZoneModel = _.clone(zonesService.currentZones[removeIndex - 1]);

    // When
    const removeZoneAtIndexPromise: Promise<string> = zonesService.removeZoneAtIndex(removeIndex);

    // Then
    removeZoneAtIndexPromise.then((result: string) => {
      expect(result).not.toBeNull();
      expect(result).toEqual("Zone <" + (removeIndex + 1) + "> has been removed.");
      expect(zonesService.currentZones.length).toBe(expectedZonesLength);

      const newLastZone: ZoneModel = _.last(zonesService.currentZones); // Is actually the new last zone
      expect(newLastZone.from).toBe(oldPreviousZone.from);
      expect(newLastZone.to).toBe(oldPreviousZone.to);

      done();
    });
  });

  it("should not remove zone at index if MIN zone count reached", done => {
    // Given
    const MIN_ZONE_COUNT = 10;
    const removeIndex = 6;
    spyOn(zonesService, "getMinZoneCount").and.returnValue(MIN_ZONE_COUNT);

    // When
    const removeZoneAtIndexPromise: Promise<string> = zonesService.removeZoneAtIndex(removeIndex);

    // Then
    removeZoneAtIndexPromise.then(
      (result: string) => {
        expect(result).toBeNull();
        done();
      },
      (error: string) => {
        expect(error).not.toBeNull();
        expect(error).toEqual("You can't remove more than " + MIN_ZONE_COUNT + " zones...");
        expect(zonesService.currentZones.length).toBe(MIN_ZONE_COUNT);

        done();
      }
    );
  });

  it('should notify the previous Zone "TO" when his own "FROM" has been changed', done => {
    // Given, increment +1 from of third sourceZone.
    const index = 2;
    const updatedFromValue: number = zonesService.currentZones[index].from + 1; // Apply the change

    const zoneChange: ZoneChangeWhisperModel = {
      sourceId: index,
      from: true,
      to: false,
      value: updatedFromValue
    };

    // When, Then
    zonesService.zoneChangeOrderUpdates.subscribe(
      (change: ZoneChangeOrderModel) => {
        expect(_.isEmpty(change)).toBeFalsy();
        expect(change.sourceId).toEqual(index);
        expect(change.destinationId).toEqual(index - 1); // Must be the previous index

        expect(change.to).toBeTruthy();
        expect(change.from).toBeFalsy();
        expect(change.value).toEqual(updatedFromValue);

        done();
      },
      error => {
        expect(error).toBeNull();
        done();
      }
    );

    zonesService.whisperZoneChange(zoneChange);
  });

  it('should not notify the previous Zone if "FROM" has changed & zone edited is the first', done => {
    // Given, increment +1 from of first source zone
    const index = 0; // First zone
    const updatedFromValue: number = zonesService.currentZones[index].from + 1; // Apply the change

    const zoneChange: ZoneChangeWhisperModel = {
      sourceId: index,
      from: true,
      to: false,
      value: updatedFromValue
    };

    // When, Then
    zonesService.zoneChangeOrderUpdates.subscribe(
      (change: ZoneChangeOrderModel) => {
        expect(change).toBeNull();
        done();
      },
      error => {
        expect(error).toBeNull();
        done();
      }
    );

    zonesService.whisperZoneChange(zoneChange);
  });

  it('should notify the next Zone "FROM" when his own "TO" has been changed', done => {
    // Given, decrement -1 a "TO" zone.
    const index = 7;
    const updatedToValue: number = zonesService.currentZones[index].to - 1; // Apply the change

    const zoneChange: ZoneChangeWhisperModel = {
      sourceId: index,
      from: false,
      to: true,
      value: updatedToValue
    };

    // When, Then
    zonesService.zoneChangeOrderUpdates.subscribe(
      (change: ZoneChangeOrderModel) => {
        expect(_.isEmpty(change)).toBeFalsy();
        expect(change.sourceId).toEqual(index);
        expect(change.destinationId).toEqual(index + 1); // Must be the previous index

        expect(change.from).toBeTruthy();
        expect(change.to).toBeFalsy();
        expect(change.value).toEqual(updatedToValue);

        done();
      },
      error => {
        expect(error).toBeNull();
        done();
      }
    );

    zonesService.whisperZoneChange(zoneChange);
  });

  it('should notify the next Zone "FROM" when his own "TO" has been changed & zone edited is the first', done => {
    // Given
    const index = 0; // First zone
    const updatedToValue: number = zonesService.currentZones[index].to + 4; // Apply the change

    const zoneChange: ZoneChangeWhisperModel = {
      sourceId: index,
      from: false,
      to: true,
      value: updatedToValue
    };

    // When, Then
    zonesService.zoneChangeOrderUpdates.subscribe(
      (change: ZoneChangeOrderModel) => {
        expect(_.isEmpty(change)).toBeFalsy();
        expect(change.sourceId).toEqual(index);
        expect(change.destinationId).toEqual(index + 1); // Must be the previous index

        expect(change.from).toBeTruthy();
        expect(change.to).toBeFalsy();
        expect(change.value).toEqual(updatedToValue);

        done();
      },
      error => {
        expect(error).toBeNull();
        done();
      }
    );

    zonesService.whisperZoneChange(zoneChange);
  });

  it('should not notify the next Zone if "TO" has changed & zone edited is the latest', done => {
    // Given, increment +1 from of last source zone
    const index = 9; // Last zone
    const updatedToValue: number = zonesService.currentZones[index].to + 1; // Apply the change

    const zoneChange: ZoneChangeWhisperModel = {
      sourceId: index,
      from: false,
      to: true,
      value: updatedToValue
    };

    // When, Then
    zonesService.zoneChangeOrderUpdates.subscribe(
      (change: ZoneChangeOrderModel) => {
        expect(change).toBeNull();
        done();
      },
      error => {
        expect(error).toBeNull();
        done();
      }
    );

    zonesService.whisperZoneChange(zoneChange);
  });

  it("should return compliant zones", done => {
    // Given
    const currentZones = zonesService.currentZones;

    // When
    const error: string = zonesService.isZonesCompliant(currentZones);

    // Then
    expect(error).toBeNull();

    done();
  });

  it('should return not compliant zones with error on a "FROM"', done => {
    // Given
    const FAKE_WRONG_ZONES = [
      // Set 10 fake zones
      { from: 0, to: 10 },
      { from: 10, to: 20 },
      { from: 20, to: 30 },
      { from: 99, to: 40 }, // Mistake here (from: 99)!
      { from: 40, to: 50 },
      { from: 50, to: 60 },
      { from: 60, to: 70 },
      { from: 70, to: 80 },
      { from: 80, to: 90 },
      { from: 90, to: 100 }
    ];

    // When
    const error: string = zonesService.isZonesCompliant(FAKE_WRONG_ZONES);

    // Then
    expect(error).not.toBeNull();
    expect(error).toEqual("Not compliant zones provided: pattern is not respected.");

    done();
  });

  it('should return not compliant zones with error on a "TO"', done => {
    // Given
    const FAKE_WRONG_ZONES = [
      // Set 10 fake zones
      { from: 0, to: 10 },
      { from: 10, to: 20 },
      { from: 20, to: 30 },
      { from: 30, to: 40 },
      { from: 40, to: 50 },
      { from: 50, to: 61 }, // Mistake here (to: 61)!
      { from: 60, to: 70 },
      { from: 70, to: 80 },
      { from: 80, to: 90 },
      { from: 90, to: 100 }
    ];

    // When
    const error: string = zonesService.isZonesCompliant(FAKE_WRONG_ZONES);

    // Then
    expect(error).not.toBeNull();
    expect(error).toEqual("Not compliant zones provided: pattern is not respected.");

    done();
  });

  it("should return not compliant zones with MAX zone count reached", done => {
    // Given
    const MAX_ZONE_COUNT = 10;

    const FAKE_WRONG_ZONES = [
      // Set 10 fake zones
      { from: 0, to: 10 },
      { from: 10, to: 20 },
      { from: 20, to: 30 },
      { from: 30, to: 40 },
      { from: 40, to: 50 },
      { from: 50, to: 60 },
      { from: 60, to: 70 },
      { from: 70, to: 80 },
      { from: 80, to: 90 },
      { from: 90, to: 100 },
      { from: 100, to: 110 } // Add a 11th zone
    ];

    spyOn(zonesService, "getMaxZoneCount").and.returnValue(MAX_ZONE_COUNT);

    // When
    const error: string = zonesService.isZonesCompliant(FAKE_WRONG_ZONES);

    // Then
    expect(error).not.toBeNull();
    expect(error).toEqual("Not compliant zones provided: expected at max " + zonesService.getMaxZoneCount() + " zones");

    done();
  });

  it("should return not compliant zones with MIN zone count reached", done => {
    // Given
    const MIN_ZONE_COUNT = 5;

    const FAKE_WRONG_ZONES = [
      // Set 4 fake zones
      { from: 0, to: 10 },
      { from: 10, to: 20 },
      { from: 20, to: 30 },
      { from: 30, to: 40 }
    ];

    spyOn(zonesService, "getMinZoneCount").and.returnValue(MIN_ZONE_COUNT);

    // When
    const error: string = zonesService.isZonesCompliant(FAKE_WRONG_ZONES);

    // Then
    expect(error).not.toBeNull();
    expect(error).toEqual(
      "Not compliant zones provided: expected at least " + zonesService.getMinZoneCount() + " zones"
    );

    done();
  });

  it("should return not compliant zones is zone empty", done => {
    // Given
    const zones = null;

    // When
    const error: string = zonesService.isZonesCompliant(zones);

    // Then
    expect(error).not.toBeNull();

    done();
  });

  it("should reset zones to default", done => {
    // Given
    const FAKE_EXISTING_ZONES = [
      // Set 10 fake zones
      { from: 0, to: 110 },
      { from: 110, to: 210 },
      { from: 210, to: 310 },
      { from: 310, to: 410 },
      { from: 410, to: 510 },
      { from: 510, to: 611 },
      { from: 610, to: 710 },
      { from: 710, to: 810 },
      { from: 810, to: 910 },
      { from: 910, to: 1100 }
    ];

    const SPEED_ZONE_DEFINITION_MOCKED: ZoneDefinitionModel = _.find(ZONE_DEFINITIONS, {
      value: ZoneType.SPEED
    });

    const expectedResetZones = UserZonesModel.deserialize(DesktopUserSettings.DEFAULT_MODEL.zones.speed);

    zonesService.currentZones = FAKE_EXISTING_ZONES;
    zonesService.zoneDefinition = SPEED_ZONE_DEFINITION_MOCKED;

    const zonesUpdatesSpy = spyOn(zonesService.zonesUpdates, "next");

    // When
    const promiseReset: Promise<void> = zonesService.resetZonesToDefault();

    // Then
    promiseReset.then(
      () => {
        expect(updateZonesSpy).toHaveBeenCalledTimes(1);
        expect(zonesUpdatesSpy).toHaveBeenCalledTimes(1);

        expect(zonesService.currentZones.length).toEqual(expectedResetZones.length);
        expect(zonesService.currentZones.length).not.toEqual(FAKE_EXISTING_ZONES.length);
        expect(zonesService.currentZones).toEqual(expectedResetZones);

        done();
      },
      error => {
        expect(error).toBeNull();
        done();
      }
    );
  });

  it("should save zones", done => {
    // Given
    const zonesCompliantSpy = spyOn(zonesService, "isZonesCompliant").and.returnValue(null);
    const zoneModels: ZoneModel[] = [
      { from: 0, to: 110 },
      { from: 110, to: 210 }
    ];
    updateZonesSpy.and.returnValue(Promise.resolve(zoneModels));

    // When
    const promiseSave: Promise<void> = zonesService.updateZones();

    // Then
    promiseSave.then(
      () => {
        expect(zonesCompliantSpy).toHaveBeenCalledTimes(1);
        expect(updateZonesSpy).toHaveBeenCalledTimes(1);

        done();
      },
      error => {
        expect(error).toBeNull();
        done();
      }
    );
  });

  it("should not save zones that are not compliant", done => {
    // Given
    const fakeError = "FakeError";
    const zonesCompliantSpy = spyOn(zonesService, "isZonesCompliant").and.returnValue(fakeError);
    updateZonesSpy.and.returnValue(Promise.resolve(true));

    // When
    const promiseSave: Promise<void> = zonesService.updateZones();

    // Then
    promiseSave.then(
      () => {
        throw new Error("Test should no go there");
      },
      error => {
        expect(error).toBe(fakeError);
        expect(zonesCompliantSpy).toHaveBeenCalledTimes(1);
        expect(updateZonesSpy).toHaveBeenCalledTimes(0);

        done();
      }
    );
  });

  it("should not save zones on saveZones rejection", done => {
    // Given
    const fakeError = "UpdateZones Error!";
    const zonesCompliantSpy = spyOn(zonesService, "isZonesCompliant").and.returnValue(null);
    updateZonesSpy.and.returnValue(Promise.reject(fakeError));

    // When
    const promiseSave: Promise<void> = zonesService.updateZones();

    // Then
    promiseSave.then(
      () => {
        throw new Error("Test should no go there");
      },
      error => {
        expect(error).not.toBeNull();
        expect(error).toBe(fakeError);
        expect(zonesCompliantSpy).toHaveBeenCalledTimes(1);
        expect(updateZonesSpy).toHaveBeenCalledTimes(1);
        done();
      }
    );
  });

  it("should notify step changes", done => {
    // Given
    const step = 0.25;
    const stepUpdatesSpy = spyOn(zonesService.stepUpdates, "next");

    // When
    zonesService.notifyStepChange(step);

    // Then
    expect(stepUpdatesSpy).toHaveBeenCalledTimes(1);
    expect(stepUpdatesSpy).toHaveBeenCalledWith(step);

    done();
  });

  it("should import zones", done => {
    // Given
    const jsonInput = '[{"from":120,"to":140},{"from":140,"to":150},{"from":150,"to":160}]';
    const zonesToImport: ZoneModel[] = JSON.parse(jsonInput) as ZoneModel[];

    updateZonesSpy = spyOn(zonesService, "updateZones").and.returnValue(Promise.resolve());
    const zonesUpdatesSpy = spyOn(zonesService.zonesUpdates, "next");

    // When
    const promiseImport = zonesService.importZones(jsonInput);

    // Then
    promiseImport.then(
      () => {
        expect(updateZonesSpy).toHaveBeenCalledTimes(1);
        expect(zonesUpdatesSpy).toHaveBeenCalledTimes(1);

        expect(zonesService.currentZones).toEqual(zonesToImport);
        expect(zonesService.currentZones.length).toEqual(zonesToImport.length);

        done();
      },
      (error: Error) => {
        expect(error).toBeNull();
        done();
      }
    );
  });

  it("should not import zones with wrong JSON data", done => {
    // Given
    const wrongJsonInput = '[{"from":120,"to":140},{"from":140,"to":150},{"from":150,"to":160}]'.replace(",", "");

    updateZonesSpy = spyOn(zonesService, "updateZones").and.returnValue(Promise.resolve());
    const zonesUpdatesSpy = spyOn(zonesService.zonesUpdates, "next");

    // When
    const promiseImport = zonesService.importZones(wrongJsonInput);

    // Then
    promiseImport.then(
      () => {
        throw new Error("Test should no go there");
      },
      (error: string) => {
        expect(updateZonesSpy).toHaveBeenCalledTimes(0);
        expect(zonesUpdatesSpy).toHaveBeenCalledTimes(0);

        expect(error).not.toBeNull();
        expect(error).toBe("Provided zones do not respect expected format");

        done();
      }
    );
  });

  it("should not import zones with not compliant zones but valid JSON", done => {
    // Given
    const expectedError = "149";
    const jsonInput = '[{"from":120,"to":140},{"from":140,"to":150},{"from":' + expectedError + ',"to":160}]';
    const zonesUpdatesSpy = spyOn(zonesService.zonesUpdates, "next");

    // When
    const promiseImport = zonesService.importZones(jsonInput);

    // Then
    promiseImport.then(
      () => {
        throw new Error("Test should no go there");
      },
      (error: string) => {
        expect(error).not.toBeNull();
        expect(error).toEqual("Not compliant zones provided: pattern is not respected.");
        expect(zonesUpdatesSpy).toHaveBeenCalledTimes(0);

        done();
      }
    );
  });
});
