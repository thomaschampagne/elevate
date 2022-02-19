import { Inject, Injectable } from "@angular/core";
import { AthleteService } from "../athlete/athlete.service";
import _ from "lodash";
import { AthleteSnapshotResolver } from "@elevate/shared/resolvers/athlete-snapshot.resolver";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";

@Injectable()
export class AthleteSnapshotResolverService {
  public athleteSnapshotResolver: AthleteSnapshotResolver;

  constructor(@Inject(AthleteService) public readonly athleteService: AthleteService) {}

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
   */
  public resolve(onDate: string | Date): AthleteSnapshot {
    if (_.isEmpty(this.athleteSnapshotResolver)) {
      throw new Error(
        "AthleteSnapshotResolver do not exists. Please update service at first with AthleteSnapshotResolverService#update()"
      );
    }

    return this.athleteSnapshotResolver.resolve(onDate);
  }

  /**
   * Resolve current being used AthleteSnapshotModel
   */
  public getCurrent(): AthleteSnapshot {
    return this.athleteSnapshotResolver.resolve(new Date());
  }
}
