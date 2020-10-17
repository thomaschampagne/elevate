import { AthleteModel, SyncedActivityModel, UserSettings } from "@elevate/shared/models";
import { SyncDateTime } from "@elevate/shared/models/sync/sync-date-time.model";
import { YearToDateProgressPresetModel } from "../../../appcore/src/app/year-progress/shared/models/year-to-date-progress-preset.model";
import ExtensionUserSettingsModel = UserSettings.ExtensionUserSettingsModel;

interface IOldV6Database {
  athlete?: AthleteModel;
  athleteId?: number;
  bestSplitsConfiguration?: {};
  syncDateTime?: number;
  syncedActivities?: SyncedActivityModel[];
  userSettings?: ExtensionUserSettingsModel;
  yearProgressPresets?: YearToDateProgressPresetModel[];
  versionInstalled?: { on: number; version: string };
}

interface INewV7Database {
  athlete?: {
    name: "athlete";
    data: AthleteModel[] & { $loki: number; meta: {} }[];
  };
  athleteId?: {
    name: "athleteId";
    data: { athleteId: number }[] & { $loki: number; meta: {} }[];
  };
  bestSplitsConfiguration?: {
    name: "bestSplitsConfiguration";
    data: { splits: any[] }[] & { $loki: number; meta: {} }[];
  };
  syncDateTime?: {
    name: "syncDateTime";
    data: SyncDateTime[] & { $loki: number; meta: {} }[];
  };
  syncedActivities?: {
    name: "syncedActivities";
    binaryIndices: {
      name: {
        dirty: false;
        name: "name";
        values: [];
      };
      start_time: {
        dirty: false;
        name: "start_time";
        values: [];
      };
      type: {
        dirty: false;
        name: "type";
        values: [];
      };
    };
    data: SyncedActivityModel[] & { $loki: number; meta: {} }[];
    uniqueNames: ["id"];
  };
  userSettings?: {
    name: "userSettings";
    data: ExtensionUserSettingsModel[] & { $loki: number; meta: {} }[];
  };
  yearProgressPresets?: {
    name: "yearProgressPresets";
    data: YearToDateProgressPresetModel[] & { $loki: number; meta: {} }[];
  };
  versionInstalled?: {
    name: "versionInstalled";
    data: { on: number; version: string }[] & { $loki: number; meta: {} }[];
  };
}

export class Migration7x0x0x0 {
  public perform(oldDatabase: IOldV6Database): INewV7Database {
    if (oldDatabase === null || oldDatabase === undefined) {
      return null;
    }

    const newDatabase: INewV7Database = {};

    if (
      (oldDatabase.athlete && (oldDatabase.athlete as any).data) ||
      (oldDatabase.athleteId && (oldDatabase.athleteId as any).data) ||
      (oldDatabase.bestSplitsConfiguration && (oldDatabase.bestSplitsConfiguration as any).data) ||
      (oldDatabase.syncDateTime && (oldDatabase.syncDateTime as any).data) ||
      (oldDatabase.syncedActivities && (oldDatabase.syncedActivities as any).data) ||
      (oldDatabase.userSettings && (oldDatabase.userSettings as any).data) ||
      (oldDatabase.yearProgressPresets && (oldDatabase.yearProgressPresets as any).data) ||
      (oldDatabase.versionInstalled && (oldDatabase.versionInstalled as any).data)
    ) {
      throw new Error("NOT_AN_OLD_DATABASE");
    }

    // Convert athlete
    if (oldDatabase.athlete) {
      oldDatabase.athlete = this.setLokiData(oldDatabase.athlete);
      newDatabase.athlete = this.initCollection("athlete");
      newDatabase.athlete.data.push(oldDatabase.athlete);
    }

    // Convert athleteId
    if (oldDatabase.athleteId) {
      newDatabase.athleteId = this.initCollection("athleteId");
      newDatabase.athleteId.data.push(this.setLokiData({ athleteId: oldDatabase.athleteId }));
    }

    // Convert bestSplitsConfiguration
    if (oldDatabase.bestSplitsConfiguration) {
      newDatabase.bestSplitsConfiguration = this.initCollection("bestSplitsConfiguration");
      newDatabase.bestSplitsConfiguration.data.push(this.setLokiData(oldDatabase.bestSplitsConfiguration));
    }

    // Convert syncDateTime
    if (oldDatabase.syncDateTime) {
      newDatabase.syncDateTime = this.initCollection("syncDateTime");
      newDatabase.syncDateTime.data.push(this.setLokiData({ syncDateTime: oldDatabase.syncDateTime }));
    }

    // Convert syncedActivities
    if (oldDatabase.syncedActivities) {
      newDatabase.syncedActivities = this.initCollection("syncedActivities");

      oldDatabase.syncedActivities.forEach((activity, index) => {
        newDatabase.syncedActivities.data.push(this.setLokiData(activity, index + 1));
      });

      newDatabase.syncedActivities.binaryIndices = {
        name: { dirty: false, name: "name", values: [] },
        start_time: { dirty: false, name: "start_time", values: [] },
        type: { dirty: false, name: "type", values: [] }
      };

      newDatabase.syncedActivities.uniqueNames = ["id"];
    }

    // Convert userSettings
    if (oldDatabase.userSettings) {
      newDatabase.userSettings = this.initCollection("userSettings");
      newDatabase.userSettings.data.push(this.setLokiData(oldDatabase.userSettings));
    }

    // Convert yearProgressPresets
    if (oldDatabase.yearProgressPresets) {
      newDatabase.yearProgressPresets = this.initCollection("yearProgressPresets");
      oldDatabase.yearProgressPresets.forEach((preset, index) => {
        newDatabase.yearProgressPresets.data.push(this.setLokiData(preset, index + 1));
      });
    }

    if (oldDatabase.versionInstalled) {
      newDatabase.versionInstalled = this.initCollection("versionInstalled");
      newDatabase.versionInstalled.data.push(this.setLokiData(oldDatabase.versionInstalled));
    }

    return newDatabase;
  }

  private initCollection(colName: string): any {
    return {
      name: colName,
      data: []
    };
  }

  private setLokiData(doc: any, index: number = 1): any {
    const time = Date.now();
    doc.meta = {
      revision: 1,
      created: time,
      version: 0,
      updated: time
    };
    (doc as any).$loki = index;
    return doc;
  }
}
