import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { CollectionDef } from "../../data-store/collection-def";
import { PropertiesModel } from "@elevate/shared/models/properties.model";

@Injectable()
export class PropertiesDao extends BaseDao<PropertiesModel> {
  public static readonly COLLECTION_DEF: CollectionDef<PropertiesModel> = new CollectionDef("properties", null);

  public getCollectionDef(): CollectionDef<PropertiesModel> {
    return PropertiesDao.COLLECTION_DEF;
  }

  public getDefaultStorageValue(): PropertiesModel {
    return new PropertiesModel();
  }
}
