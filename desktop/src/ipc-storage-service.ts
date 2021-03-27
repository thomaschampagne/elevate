import { app } from "electron";
import fs from "fs";
import { singleton } from "tsyringe";
import _ from "lodash";
import { ElevateException } from "@elevate/shared/exceptions";

@singleton()
export class IpcStorageService {
  private static readonly STORAGE_FILENAME: string = "ipc.storage.json";
  private static readonly STORAGE_FILEPATH: string = `${app.getPath("userData")}/${IpcStorageService.STORAGE_FILENAME}`;

  public getStorageFilePath(): string {
    // Init file if missing
    if (!fs.existsSync(IpcStorageService.STORAGE_FILEPATH)) {
      fs.writeFileSync(IpcStorageService.STORAGE_FILEPATH, "{}");
    }
    return IpcStorageService.STORAGE_FILEPATH;
  }

  public get<T>(key: string | Array<string>): T {
    const storage = this.readStorage();
    return _.get(storage, key);
  }

  public set<T>(key: string | Array<string>, value: T): void {
    let storage = this.readStorage();
    storage = _.set(storage, key, value);
    this.saveStorage(storage);
  }

  public rm<T>(key: string | Array<string>): void {
    const storage = this.readStorage();
    const removed = _.unset(storage, key);
    if (removed) {
      this.saveStorage(storage);
    } else {
      throw new Error(`Unable to remove ipc storage key '${key}'`);
    }
  }

  private readStorage(): object {
    const storageFilePath = this.getStorageFilePath();
    try {
      const storageString = fs.readFileSync(storageFilePath, "utf-8");
      return JSON.parse(storageString);
    } catch (err) {
      throw new ElevateException(`Unreachable or corrupt storage: ${storageFilePath}.`);
    }
  }

  private saveStorage(storage: object): void {
    const storageFilePath = this.getStorageFilePath();
    fs.writeFileSync(storageFilePath, JSON.stringify(storage), { encoding: "utf-8" });
  }
}
