export interface IAthleteUpdate {
    stravaId: number;
    version: string;
    name: string;
    status: number;
    lastSeen?: Date;
    country?: string;
    hrMin?: number;
    hrMax?: number;
    __v?: number; // Mongoose version doc
}
