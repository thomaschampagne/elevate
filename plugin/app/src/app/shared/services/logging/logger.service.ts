export abstract class LoggerService {

	public static LEVEL_DEBUG = 0;
	public static LEVEL_INFO = 1;
	public static LEVEL_WARN = 2;
	public static LEVEL_ERROR = 3;

	public debug: Function;
	public info: Function;
	public warn: Function;
	public error: Function;
}
