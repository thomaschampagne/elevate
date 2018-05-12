export class ReleaseNoteModel {
	version: string; // SemVer 'x.x.x' http://semver.org/
	date?: string;
	message?: string;
	hotFixes?: string[];
	features: string[];
	fixes?: string[];

	/**
	 * Say if we display again features. Eg. Fix or hotfix release. Default: false
	 */
	isPatch?: boolean;

	/**
	 * Make silent updates... no update ribbon displayed
	 */
	silent?: boolean;
}
