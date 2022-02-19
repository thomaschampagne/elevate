/* eslint-disable no-console */
import { LoggerService } from "./logger.service";
import { Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";

@Injectable({
  providedIn: "root"
})
export class ConsoleLoggerService implements LoggerService {
  get debug() {
    return environment.logLevel <= LoggerService.LEVEL_DEBUG ? console.debug.bind(console) : this.noop;
  }

  get info() {
    return environment.logLevel <= LoggerService.LEVEL_INFO ? console.info.bind(console) : this.noop;
  }

  get warn() {
    return environment.logLevel <= LoggerService.LEVEL_WARN ? console.warn.bind(console) : this.noop;
  }

  get error() {
    return console.error.bind(console);
  }

  private noop = () => undefined;
}
