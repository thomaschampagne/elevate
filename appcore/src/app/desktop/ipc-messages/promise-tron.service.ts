import { Inject, Injectable } from "@angular/core";
import { ElectronService } from "../../shared/services/electron/electron.service";
import { IpcRequest, PromiseTron, PromiseTronReply } from "promise-tron";
import { IPromiseTron } from "./promise-tron.interface";

@Injectable()
export class PromiseTronService implements IPromiseTron {
  public promiseTron: PromiseTron;

  constructor(@Inject(ElectronService) private readonly electronService: ElectronService) {
    this.promiseTron = new PromiseTron(this.electronService.electron.ipcRenderer);
  }

  public on(onRequest: (request: IpcRequest, replyWith: (promiseTronReply: PromiseTronReply) => void) => void): void {
    this.promiseTron.on(onRequest);
  }

  public send<T>(data: any): Promise<T> {
    return this.promiseTron.send(data) as Promise<T>;
  }
}
