import * as _ from "lodash";

export class AppError {

	// List of errors that must to be registered in below method
	public static readonly FT_NO_MINIMUM_REQUIRED_ACTIVITIES: string = "FT_1";
	public static readonly FT_PSS_USED_WITH_TRIMP_CALC_METHOD: string = "FT_2";
	public static readonly FT_SSS_USED_WITH_TRIMP_CALC_METHOD: string = "FT_3";

	public registerCodes(): void {
		this._codes.push(AppError.FT_NO_MINIMUM_REQUIRED_ACTIVITIES);
		this._codes.push(AppError.FT_PSS_USED_WITH_TRIMP_CALC_METHOD);
		this._codes.push(AppError.FT_SSS_USED_WITH_TRIMP_CALC_METHOD);
	}

	public code: string;
	public message: string;
	public _codes: string[] = [];

	constructor(code: string, message: string) {
		this.registerCodes();
		this.checkRegistrationOf(code);
		this.checkForDuplicatesErrors();
		this.code = code;
		this.message = message;
	}

	public checkForDuplicatesErrors(): void {
		const duplicates = _.transform(_.countBy(this._codes), (result: string[], count: number, value: string) => {
			if (count > 1) result.push(value);
		}, []);

		if (duplicates.length > 0) {
			throw new Error(duplicates.join(";") + " error codes are duplicated");
		}
	}

	public checkRegistrationOf(code: string): void {
		if (this._codes.indexOf(code) === -1) {
			throw new Error(code + " error is not registered");
		}
	}

}
