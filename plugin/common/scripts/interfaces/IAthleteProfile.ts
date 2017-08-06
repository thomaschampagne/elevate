export interface IAthleteProfile {
    userGender: string;
    userMaxHr: number;
    userRestHr: number;
    userFTP: number;

    // Detect swim ftp changes cloud/local is not required to perform new full sync.
    // Related computation with this param is currently not stored locally.
    // Swim stress score computed on the fly inside fitness data computer
    // userSwimFTP: number;

    userWeight: number;
}