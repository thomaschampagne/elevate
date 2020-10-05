import { Inject, Injectable } from "@angular/core";
import { FlaggedIpcMessage } from "@elevate/shared/electron";
import { IPromiseTron, PROMISE_TRON } from "./promise-tron.interface";

@Injectable()
export class IpcMessagesSender {
    constructor(@Inject(PROMISE_TRON) public promiseTron: IPromiseTron) {}

    public send<T>(flaggedIpcMessage: FlaggedIpcMessage): Promise<T> {
        return this.promiseTron.send(flaggedIpcMessage) as Promise<T>;
    }
}
