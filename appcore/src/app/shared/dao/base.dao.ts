import { Inject, Injectable } from "@angular/core";
import { CollectionDef } from "../data-store/collection-def";
import { DataStore } from "../data-store/data-store";
import { ElevateException, NotImplementedException } from "@elevate/shared/exceptions";

@Injectable()
export abstract class BaseDao<T> {
  public defaultStorage: T | T[];

  public collectionDef: CollectionDef<T> = null;

  private collection: Collection<T & {}>;

  constructor(@Inject(DataStore) public dataStore: DataStore<T>) {
    this.init();
    this.collection = this.dataStore.resolveCollection(this.collectionDef);
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

  public insert(doc: T, persistImmediately: boolean = false): Promise<T> {
    return this.dataStore.insert(this.collectionDef, doc, persistImmediately);
  }

  public insertMany(docs: T[], persistImmediately: boolean = false): Promise<void> {
    return this.dataStore.insertMany(this.collectionDef, docs, persistImmediately);
  }

  public update(doc: T, persistImmediately: boolean = false): Promise<T> {
    return this.dataStore.update(this.collectionDef, doc, persistImmediately);
  }

  public updateMany(docs: T[], persistImmediately: boolean = false): Promise<void> {
    return this.dataStore.updateMany(this.collectionDef, docs, persistImmediately);
  }

  public put(doc: T, persistImmediately: boolean = false): Promise<T> {
    return this.dataStore.put(this.collectionDef, doc, persistImmediately);
  }

  public remove(doc: T, persistImmediately: boolean = false): Promise<void> {
    return this.dataStore.remove(this.collectionDef, doc, persistImmediately);
  }

  public removeMany(docs: T[], persistImmediately: boolean = false): Promise<void> {
    throw new NotImplementedException("BaseDao::removeMany"); // TODO !!
  }

  public removeById(id: number | string, persistImmediately: boolean = false): Promise<void> {
    return this.dataStore.removeById(this.collectionDef, id, persistImmediately);
  }

  public removeByManyIds(ids: (number | string)[], persistImmediately: boolean = false): Promise<void> {
    return this.dataStore.removeByManyIds(this.collectionDef, ids, persistImmediately);
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
  public clear(persistImmediately: boolean = false): Promise<void> {
    return this.dataStore.clear(this.collectionDef, persistImmediately);
  }

  public saveDataStore(): Promise<void> {
    return this.dataStore.saveDataStore();
  }

  public chain(): Resultset<T & LokiObj> {
    return this.collection.chain();
  }
}
