import { IpcRequest, PromiseTronReply } from "promise-tron";
import { InjectionToken } from "@angular/core";

export const PROMISE_TRON = new InjectionToken<IPromiseTron>("PROMISE_TRON");

export interface IPromiseTron {
  on(onRequest: (request: IpcRequest, replyWith: (promiseTronReply: PromiseTronReply) => void) => void): void;

  send<T>(data: any): Promise<T>;
}
