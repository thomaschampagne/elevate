import { IpcMainMessagesService } from "./listeners/ipc-main-messages-service";
import { BaseConnector } from "./connectors/base.connector";
import { HttpClient } from "typed-rest-client/HttpClient";
import * as os from "os";
import * as crypto from "crypto";

export class Service {

	constructor() {
		this._ipcMainMessages = null;
		this._httpProxy = null;
		this._currentConnector = null;
	}

	get ipcMainMessages(): IpcMainMessagesService {
		return this._ipcMainMessages;
	}

	set ipcMainMessages(value: IpcMainMessagesService) {
		this._ipcMainMessages = value;
	}

	get httpClient(): HttpClient {
		return this._httpClient;
	}

	set httpClient(value: HttpClient) {
		this._httpClient = value;
	}

	get currentConnector(): BaseConnector {
		return this._currentConnector;
	}

	set currentConnector(value: BaseConnector) {
		this._currentConnector = value; // TODO Test if currentConnector is in syncing before set anything!!
	}

	private static _instance: Service = null;

	public static readonly PLATFORM = {
		WINDOWS: "win32",
		LINUX: "linux",
		MACOS: "darwin",
	};

	private _ipcMainMessages: IpcMainMessagesService;
	private _httpProxy: string;
	private _httpClient: HttpClient;
	private _currentConnector: BaseConnector;

	public static printSystemDetails(): string {
		const cpuCount = os.cpus().length;
		const cpu = os.cpus()[0];
		const cpuInfos = `${cpu.model} ${cpuCount} threads`;
		const memorySizeGB = Math.round(((os.totalmem() / 1024) / 1024) / 1024) + "GB";
		return `Hostname ${os.hostname()}; Platform ${os.platform()} ${os.arch()}; Processor ${cpuInfos}; Memory ${memorySizeGB}`;
	}

	public static getDeviceFingerPrint(): string {
		const fingerPrint = `${os.hostname()};${os.cpus()[0].model};${os.cpus()[0].speed};${os.totalmem()};${os.homedir()};${os.platform()};${os.arch()};${os.endianness()}`;
		return crypto.createHash("sha1").update(fingerPrint).digest("hex");
	}

	public static currentPlatform(): string {
		return os.platform();
	}

	public static instance(): Service {
		if (!Service._instance) {
			Service._instance = new Service();
		}
		return Service._instance;
	}
}
