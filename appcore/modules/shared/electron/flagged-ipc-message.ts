import { MessageFlag } from "./message-flag.enum";

export class FlaggedIpcMessage {

	public flag: MessageFlag;
	public payload: unknown[];

	constructor(flag: MessageFlag, ...payload: unknown[]) {
		this.flag = flag;
		this.payload = payload;
	}
}
