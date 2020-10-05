import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { CollectionDef } from "../../data-store/collection-def";
import { AthleteModel } from "@elevate/shared/models";

@Injectable()
export class AthleteDao extends BaseDao<AthleteModel> {
    public static readonly COLLECTION_DEF: CollectionDef<AthleteModel> = new CollectionDef("athlete", null);

    public getDefaultStorageValue(): AthleteModel {
        return AthleteModel.DEFAULT_MODEL;
    }

    public getCollectionDef(): CollectionDef<AthleteModel> {
        return AthleteDao.COLLECTION_DEF;
    }
}
