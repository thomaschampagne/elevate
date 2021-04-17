import { Inject, Injectable } from "@angular/core";
import { CollectionDef } from "../data-store/collection-def";
import { DataStore } from "../data-store/data-store";
import { ElevateException, NotImplementedException } from "@elevate/shared/exceptions";

@Injectable()
export abstract class BaseDao<T> {
  public defaultStorage: T | T[];

  public collectionDef: CollectionDef<T> = null;

  constructor(@Inject(DataStore) public dataStore: DataStore<T>) {
    this.init();
  }

  public abstract getCollectionDef(): CollectionDef<T>;

  public abstract getDefaultStorageValue(): T | T[];

  public init(): void {
    this.collectionDef = this.getCollectionDef();

    if (!this.collectionDef) {
      throw new ElevateException(
        `CollectionDef not set in '${this.constructor.name}'. Please override init method to assign a CollectionDef.`
      );
    }

    this.defaultStorage = this.getDefaultStorageValue();
  }

  public find(
    query?: LokiQuery<T & LokiObj>,
    sort?: { propName: keyof T; options: Partial<SimplesortOptions> }
  ): Promise<T[]> {
    return this.dataStore.find(this.collectionDef, this.defaultStorage as T[], query, sort);
  }

  public findOne(query?: LokiQuery<T & LokiObj>): Promise<T> {
    return this.dataStore.findOne(this.collectionDef, this.defaultStorage as T, query);
  }

  public getById(id: number | string): Promise<T> {
    return this.dataStore.getById(this.collectionDef, id);
  }

  public insert(doc: T, waitSaveDrained: boolean = false): Promise<T> {
    return this.dataStore.insert(this.collectionDef, doc, waitSaveDrained);
  }

  public insertMany(docs: T[], waitSaveDrained: boolean = false): Promise<void> {
    return this.dataStore.insertMany(this.collectionDef, docs, waitSaveDrained);
  }

  public update(doc: T, waitSaveDrained: boolean = false): Promise<T> {
    return this.dataStore.update(this.collectionDef, doc, waitSaveDrained);
  }

  public updateMany(docs: T[], waitSaveDrained: boolean = false): Promise<void> {
    return this.dataStore.updateMany(this.collectionDef, docs, waitSaveDrained);
  }

  public put(doc: T, waitSaveDrained: boolean = false): Promise<T> {
    return this.dataStore.put(this.collectionDef, doc, waitSaveDrained);
  }

  public remove(doc: T, waitSaveDrained: boolean = false): Promise<void> {
    return this.dataStore.remove(this.collectionDef, doc, waitSaveDrained);
  }

  public removeMany(docs: T[], waitSaveDrained: boolean = false): Promise<void> {
    throw new NotImplementedException("BaseDao::removeMany"); // TODO !!
  }

  public removeById(id: number | string, waitSaveDrained: boolean = false): Promise<void> {
    return this.dataStore.removeById(this.collectionDef, id, waitSaveDrained);
  }

  public removeByManyIds(ids: (number | string)[], waitSaveDrained: boolean = false): Promise<void> {
    return this.dataStore.removeByManyIds(this.collectionDef, ids, waitSaveDrained);
  }

  /**
   * Count elements in datastore
   */
  public count(query?: LokiQuery<T & LokiObj>): Promise<number> {
    return this.dataStore.count(this.collectionDef, query);
  }

  /**
   * Clear all data
   */
  public clear(waitSaveDrained: boolean = false): Promise<void> {
    return this.dataStore.clear(this.collectionDef, waitSaveDrained);
  }

  public persist(waitSaveDrained: boolean = false): Promise<void> {
    return this.dataStore.persist(waitSaveDrained);
  }

  public chain(): Resultset<T & LokiObj> {
    return this.dataStore.resolveCollection(this.collectionDef).chain();
  }
}
