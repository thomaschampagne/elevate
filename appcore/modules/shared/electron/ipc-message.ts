import { Channel } from "./channels.enum";

export class IpcMessage {
  public channel: Channel;
  public payload: unknown[];

  constructor(channel: Channel, ...payload: any[]) {
    this.channel = channel;
    this.payload = payload;
  }
}
