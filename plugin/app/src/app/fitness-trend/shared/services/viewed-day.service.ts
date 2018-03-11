import { Injectable } from "@angular/core";
import { DayFitnessTrendModel } from "../models/day-fitness-trend.model";
import { Subject } from "rxjs/Subject";

@Injectable()
export class ViewedDayService {

	public changes: Subject<DayFitnessTrendModel>;

	constructor() {
		this.changes = new Subject<DayFitnessTrendModel>();
	}

	public onChange(dayFitnessTrendModel: DayFitnessTrendModel): void {
		this.changes.next(dayFitnessTrendModel);
	}
}
