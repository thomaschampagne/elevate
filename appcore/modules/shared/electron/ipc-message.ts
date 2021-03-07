import { Channel } from "./channels.enum";

export class IpcMessage {
  public readonly channel: Channel;
  public readonly payload: unknown[];

  constructor(channel: Channel, ...payload: any[]) {
    this.channel = channel;
    this.payload = payload;
  }
}
