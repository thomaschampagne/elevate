export abstract class LoggerService {
  public static LEVEL_DEBUG = 0;
  public static LEVEL_INFO = 1;
  public static LEVEL_WARN = 2;
  public static LEVEL_ERROR = 3;

  public debug: (message?: any, ...optionalParams: any[]) => void;
  public info: (message?: any, ...optionalParams: any[]) => void;
  public warn: (message?: any, ...optionalParams: any[]) => void;
  public error: (message?: any, ...optionalParams: any[]) => void;
}
