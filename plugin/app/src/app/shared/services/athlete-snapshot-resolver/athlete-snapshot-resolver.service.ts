import { Injectable } from "@angular/core";
import { AthleteService } from "../athlete/athlete.service";
import * as _ from "lodash";
import { AthleteModel, AthleteSnapshotModel } from "@elevate/shared/models";
import { AthleteSnapshotResolver } from "@elevate/shared/resolvers";

@Injectable()
export class AthleteSnapshotResolverService {

	public athleteSnapshotResolver: AthleteSnapshotResolver;

	constructor(public athleteService: AthleteService) {
	}

	/**
	 * Update or create AthleteSnapshotResolver
	 */
	public update(): Promise<void> {

		return this.athleteService.fetch().then((athleteModel: AthleteModel) => {

			this.athleteSnapshotResolver = new AthleteSnapshotResolver(athleteModel);

			return Promise.resolve();
		});
	}

	/**
	 * Resolve the proper AthleteSnapshotModel along activity date
	 * @param onDate Date format YYYY-MM-DD or Date object
	 * @returns {AthleteSnapshotModel}
	 */
	public resolve(onDate: string | Date): AthleteSnapshotModel {

		if (_.isEmpty(this.athleteSnapshotResolver)) {
			throw new Error("AthleteSnapshotResolver do not exists. Please update service at first with AthleteSnapshotResolverService#update()");
		}

		return this.athleteSnapshotResolver.resolve(onDate);
	}

	/**
	 * Resolve current being used AthleteSnapshotModel
	 * @returns {AthleteSnapshotModel}
	 */
	public getCurrent(): AthleteSnapshotModel {
		return this.athleteSnapshotResolver.resolve(new Date());
	}
}
