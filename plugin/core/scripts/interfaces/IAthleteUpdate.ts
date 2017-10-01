export interface IAthleteUpdate {
    stravaId: number;
    version: string;
    name: string;
    status: number;
    lastSeen?: Date;
    locale?: string;
    hrMin?: number;
    hrMax?: number;
    __v?: number; // Mongoose version doc
}
