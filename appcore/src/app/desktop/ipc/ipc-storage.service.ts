import { Inject, Injectable } from "@angular/core";
import { ElectronService } from "../electron/electron.service";
import { Channel } from "@elevate/shared/electron/channels.enum";

@Injectable()
export class IpcStorageService {
  constructor(@Inject(ElectronService) private readonly electronService: ElectronService) {}

  public get<T>(key: string | Array<string>): Promise<T> {
    return this.electronService.api.invoke(Channel.ipcStorage, ["get", key]);
  }

  public set<T>(key: string | Array<string>, value: T): Promise<void> {
    return this.electronService.api.invoke(Channel.ipcStorage, ["set", key, value]);
  }

  public rm<T>(key: string | Array<string>): Promise<void> {
    return this.electronService.api.invoke(Channel.ipcStorage, ["rm", key]);
  }
}
