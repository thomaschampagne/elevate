import { IPromiseTron } from "./promise-tron.interface";
import { IpcRequest, PromiseTronReply } from "promise-tron";

export class PromiseTronServiceMock implements IPromiseTron {
    on(onRequest: (request: IpcRequest, replyWith: (promiseTronReply: PromiseTronReply) => void) => void): void {}

    send<T>(data: any): Promise<T> {
        return Promise.resolve(null);
    }
}
