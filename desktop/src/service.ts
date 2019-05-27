import { IpcMainMessagesService } from "./listeners/ipc-main-messages-service";

export class Service {

	private static _instance: Service = null;

	public static instance(): Service {
		if (!Service._instance) {
			Service._instance = new Service();
		}
		return Service._instance;
	}

	private _ipcMainMessages: IpcMainMessagesService;
	private _httpProxy: string;

	get ipcMainMessages(): IpcMainMessagesService {
		return this._ipcMainMessages;
	}

	set ipcMainMessages(value: IpcMainMessagesService) {
		this._ipcMainMessages = value;
	}

	get httpProxy(): string {
		return this._httpProxy;
	}

	set httpProxy(value: string) {
		this._httpProxy = value;
	}
}
