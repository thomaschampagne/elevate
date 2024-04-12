import { singleton } from "tsyringe";
import { MainLogger } from "electron-log";
import logger from "electron-log/main";

@singleton()
export class Logger {
  private readonly logger: MainLogger;

  constructor() {
    this.logger = logger;
  }

  /**
   * Log an error message
   */
  public error(...params: any[]): void {
    this.logger.error.apply(this, params);
  }

  /**
   * Log a warning message
   */
  public warn(...params: any[]): void {
    this.logger.warn.apply(this, params);
  }

  /**
   * Log an informational message
   */
  public info(...params: any[]): void {
    this.logger.info.apply(this, params);
  }

  /**
   * Log a verbose message
   */
  public verbose(...params: any[]): void {
    this.logger.verbose.apply(this, params);
  }

  /**
   * Log a debug message
   */
  public debug(...params: any[]): void {
    this.logger.debug.apply(this, params);
  }

  /**
   * Log a silly message
   */
  public silly(...params: any[]): void {
    this.logger.silly.apply(this, params);
  }

  /**
   * Shortcut to info
   */
  public log(...params: any[]): void {
    this.logger.log.apply(this, params);
  }

  get base(): MainLogger {
    return this.logger;
  }
}
