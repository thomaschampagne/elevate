export class AthleteProfileModel {
	public userGender: string;
	public userMaxHr: number;
	public userRestHr: number;
	public userFTP: number;

    // Detect swim ftp changes cloud/local is not required to perform new full sync.
    // Related computation with this param is currently not stored locally.
    // Swim stress score computed on the fly inside fitness data computer
	// public userSwimFTP: number;

	public userWeight: number;

	constructor(userGender: string, userMaxHr: number, userRestHr: number, userFTP: number, userWeight: number) {
		this.userGender = userGender;
		this.userMaxHr = userMaxHr;
		this.userRestHr = userRestHr;
		this.userFTP = userFTP;
		this.userWeight = userWeight;
	}
}
