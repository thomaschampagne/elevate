export class UserLactateThresholdModel {

	public static readonly DEFAULT_MODEL: UserLactateThresholdModel = {
		default: null,
		cycling: null,
		running: null
	};

	public default: number;
	public cycling: number;
	public running: number;
}
