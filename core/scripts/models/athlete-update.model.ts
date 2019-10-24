export class AthleteUpdateModel {
	public stravaId: number;
	public version: string;
	public name: string;
	public status: number;
	public lastSeen?: Date;
	public locale?: string;
	public hrMin?: number;
	public hrMax?: number;
	public __v?: number; // Mongoose version doc
}
