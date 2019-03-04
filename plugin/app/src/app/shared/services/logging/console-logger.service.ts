import { LoggerService } from "./logger.service";
import { Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";

@Injectable()
export class ConsoleLoggerService implements LoggerService {

	private noop = () => undefined;

	get debug() {
		return (environment.logLevel <= LoggerService.LEVEL_DEBUG) ? console.debug.bind(console) : this.noop;
	}

	get info() {
		return (environment.logLevel <= LoggerService.LEVEL_INFO) ? console.info.bind(console) : this.noop;
	}

	get warn() {
		return (environment.logLevel <= LoggerService.LEVEL_WARN) ? console.warn.bind(console) : this.noop;
	}

	get error() {
		return console.error.bind(console);
	}
}
