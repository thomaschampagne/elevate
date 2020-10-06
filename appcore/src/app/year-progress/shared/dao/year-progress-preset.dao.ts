import { Injectable } from "@angular/core";
import { YearToDateProgressPresetModel } from "../models/year-to-date-progress-preset.model";
import { BaseDao } from "../../../shared/dao/base.dao";
import { CollectionDef } from "../../../shared/data-store/collection-def";

@Injectable()
export class YearProgressPresetDao extends BaseDao<YearToDateProgressPresetModel> {
  public static readonly COLLECTION_DEF: CollectionDef<YearToDateProgressPresetModel> = new CollectionDef(
    "yearProgressPresets",
    {
      unique: ["id"],
    }
  );

  public getCollectionDef(): CollectionDef<YearToDateProgressPresetModel> {
    return YearProgressPresetDao.COLLECTION_DEF;
  }

  public getDefaultStorageValue(): YearToDateProgressPresetModel[] {
    return [];
  }
}
