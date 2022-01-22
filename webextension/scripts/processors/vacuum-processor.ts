import _ from "lodash";
import { ExtensionEnv } from "../../config/extension-env";
import { BikeGearModel } from "../models/gear/bike-gear.model";
import { GearType } from "../models/gear/gear-type.enum";
import { ShoesGearModel } from "../models/gear/shoes-gear.model";
import { GearModel } from "../models/gear/gear.model";
import { Helper } from "../helper";
import LZString from "lz-string";
import { ActivityEssentials } from "@elevate/shared/models/activity-data/activity-essentials.model";
import { AthleteSnapshotResolver } from "@elevate/shared/resolvers/athlete-snapshot.resolver";
import { Gender } from "@elevate/shared/models/athlete/gender.enum";
import { ActivityInfoModel } from "@elevate/shared/models/activity-data/activity-info.model";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";

export class VacuumProcessor {
  public static cachePrefix = "elevate_stream_";

  constructor(private readonly athleteModelResolver: AthleteSnapshotResolver) {}

  /**
   *  Get the strava athlete id connected
   *  @returns the strava athlete id
   */
  public getAthleteId(): number {
    let athleteId: number = null;
    try {
      if (!_.isUndefined(window.currentAthlete) && !_.isUndefined(window.currentAthlete.id)) {
        athleteId = window.currentAthlete.id;
      }
    } catch (err) {
      if (ExtensionEnv.debugMode) {
        console.warn(err);
      }
    }

    return athleteId;
  }

  /**
   *  Get the strava athlete name connected
   *  @returns the strava athlete id
   */
  public getAthleteName(): string {
    let athleteName: string = null;
    try {
      if (!_.isUndefined(window.currentAthlete) && !_.isUndefined(window.currentAthlete.get("display_name"))) {
        athleteName = window.currentAthlete.get("display_name");
      }
    } catch (err) {
      if (ExtensionEnv.debugMode) {
        console.warn(err);
      }
    }
    return athleteName;
  }

  /**
   *  Get the strava athlete id connected
   *  @returns the strava athlete id
   */
  public getActivityAthleteId(): number {
    if (_.isUndefined(window.pageView)) {
      return null;
    }

    if (!window.pageView.activityAthlete()) {
      return null;
    }

    if (_.isUndefined(window.pageView.activityAthlete().get("id"))) {
      return null;
    }

    return window.pageView.activityAthlete().get("id");
  }

  /**
   *  Get the strava athlete premium status
   *  @returns premium status
   */

  public getPremiumStatus(): boolean {
    let premiumStatus: boolean = null;
    try {
      if (!_.isUndefined(window.currentAthlete)) {
        premiumStatus = window.currentAthlete.attributes.premium;
      }
    } catch (err) {
      if (ExtensionEnv.debugMode) {
        console.warn(err);
      }
    }

    return premiumStatus;
  }

  public getCurrentAthlete() {
    return window.currentAthlete;
  }

  /**
   *  Get the strava athlete pro status
   *  @returns the strava pro athlete id
   */
  public getProStatus(): boolean {
    let proStatus = false;
    const currentAthlete: any = this.getCurrentAthlete();

    try {
      if (currentAthlete && currentAthlete.attributes && currentAthlete.attributes.pro) {
        proStatus = currentAthlete.attributes.pro;
      }
    } catch (err) {
      if (ExtensionEnv.debugMode) {
        console.warn(err);
      }
    }

    return proStatus;
  }

  public getActivityId(): number {
    return _.isUndefined(window.pageView) ? null : window.pageView.activity().id;
  }

  public getActivityStream(
    activityInfo: ActivityInfoModel,
    callback: (
      activityEssentials: ActivityEssentials,
      streams: Streams,
      athleteWeight: number,
      athleteGender: Gender,
      hasPowerMeter: boolean
    ) => void
  ): void {
    if (_.isNumber(activityInfo.id)) {
      let cache: any = localStorage.getItem(VacuumProcessor.cachePrefix + activityInfo.id);

      if (cache) {
        try {
          cache = JSON.parse(LZString.decompressFromBase64(cache));
          callback(
            cache.activityEssentials,
            cache.stream,
            cache.athleteWeight,
            cache.athleteGender,
            cache.hasPowerMeter
          );
          console.log("Using stream cache for activity '" + activityInfo.name + "' (id:" + activityInfo.id + ")");
          return;
        } catch (e) {
          console.error("Unable to parse existing stream cache");
        }
      }
    }

    let hasPowerMeter = true;

    let streams: Streams;

    const hasLocalStreamData =
      window.pageView &&
      window.pageView.streamsRequest &&
      window.pageView.streamsRequest.streams &&
      window.pageView.streamsRequest.streams.streamData &&
      window.pageView.streamsRequest.streams.streamData.data;

    const localStreamData: Streams = hasLocalStreamData ? window.pageView.streamsRequest.streams.streamData.data : {};

    let streamUrl: string = "/activities/" + this.getActivityId() + "/streams?";
    let missingStream = false;

    if (_.isEmpty(localStreamData.time)) {
      streamUrl += "stream_types[]=time&";
      missingStream = true;
    }

    if (_.isEmpty(localStreamData.distance)) {
      streamUrl += "stream_types[]=distance&";
      missingStream = true;
    }

    if (_.isEmpty(localStreamData.velocity_smooth)) {
      streamUrl += "stream_types[]=velocity_smooth&";
      missingStream = true;
    }

    if (_.isEmpty(localStreamData.altitude)) {
      streamUrl += "stream_types[]=altitude&";
      missingStream = true;
    }

    if (_.isEmpty(localStreamData.cadence)) {
      streamUrl += "stream_types[]=cadence&";
      missingStream = true;
    }

    if (_.isEmpty(localStreamData.heartrate)) {
      streamUrl += "stream_types[]=heartrate&";
      missingStream = true;
    }

    if (_.isEmpty(localStreamData.watts)) {
      streamUrl += "stream_types[]=watts&";
      missingStream = true;

      if (_.isEmpty(localStreamData.watts_calc)) {
        streamUrl += "stream_types[]=watts_calc&";
        missingStream = true;
      }
    }

    if (_.isEmpty(localStreamData.latlng) && activityInfo && !activityInfo.isTrainer) {
      streamUrl += "stream_types[]=latlng&";
      missingStream = true;
    }

    if (_.isEmpty(localStreamData.grade_smooth)) {
      streamUrl += "stream_types[]=grade_smooth&";
      missingStream = true;
    }

    if (
      _.isEmpty(localStreamData.grade_adjusted_speed) &&
      activityInfo &&
      (activityInfo.type === "Run" || activityInfo.type === "VirtualRun")
    ) {
      streamUrl += "stream_types[]=grade_adjusted_speed&";
      missingStream = true;
    }

    let streamsPromise: Promise<Streams>;

    if (missingStream) {
      streamsPromise = new Promise(resolve => {
        $.ajax(streamUrl).done((streamsData: Streams) => {
          resolve(streamsData);
        });
      });
    } else {
      streamsPromise = Promise.resolve(localStreamData);
    }

    // We have a complete stream for all sensors
    streamsPromise.then(
      (completeStream: Streams) => {
        streams = new Streams();

        streams.time = localStreamData.time ? localStreamData.time : completeStream.time;
        streams.distance = localStreamData.distance ? localStreamData.distance : completeStream.distance;
        streams.velocity_smooth = localStreamData.velocity_smooth
          ? localStreamData.velocity_smooth
          : completeStream.velocity_smooth;
        streams.altitude = localStreamData.altitude ? localStreamData.altitude : completeStream.altitude;
        streams.cadence = localStreamData.cadence ? localStreamData.cadence : completeStream.cadence;
        streams.heartrate = localStreamData.heartrate ? localStreamData.heartrate : completeStream.heartrate;
        streams.watts = localStreamData.watts ? localStreamData.watts : completeStream.watts;
        streams.watts_calc = localStreamData.watts_calc ? localStreamData.watts_calc : completeStream.watts_calc;
        streams.latlng = localStreamData.latlng ? localStreamData.latlng : completeStream.latlng;
        streams.grade_smooth = localStreamData.grade_smooth
          ? localStreamData.grade_smooth
          : completeStream.grade_smooth;
        streams.grade_adjusted_speed = localStreamData.grade_adjusted_speed
          ? localStreamData.grade_adjusted_speed
          : completeStream.grade_adjusted_speed;

        if (_.isEmpty(streams.watts)) {
          streams.watts = streams.watts_calc;
          hasPowerMeter = false;
        }

        // Save result to cache
        try {
          const cache = {
            activityEssentials: this.getActivityEssentials(),
            stream: streams,
            athleteWeight: this.getAthleteWeight(),
            hasPowerMeter
          };

          localStorage.setItem(
            VacuumProcessor.cachePrefix + this.getActivityId(),
            LZString.compressToBase64(JSON.stringify(cache))
          );
        } catch (err) {
          console.warn(err);
          localStorage.clear();
        }

        callback(
          this.getActivityEssentials(),
          streams,
          this.getAthleteWeight(),
          this.getActivityAthleteGender(),
          hasPowerMeter
        );
      },
      error => {
        console.error(error);
        callback(
          this.getActivityEssentials(),
          new Streams(),
          this.getAthleteWeight(),
          this.getActivityAthleteGender(),
          hasPowerMeter
        );
      }
    );
  }

  public getSegmentsFromBounds(vectorA: string, vectorB: string, callback: (segmentsUnify: any) => void): void {
    const segmentsUnify: any = {
      cycling: null,
      running: null
    };

    $.when(
      $.ajax({
        url: "/api/v3/segments/search",
        data: {
          bounds: vectorA + "," + vectorB,
          min_cat: "0",
          max_cat: "5",
          activity_type: "cycling"
        },
        type: "GET",
        crossDomain: true, // enable this
        dataType: "jsonp",
        success: (xhrResponseText: any) => {
          segmentsUnify.cycling = xhrResponseText;
        },
        error: (err: any) => {
          console.error(err);
        }
      }),

      $.ajax({
        url: "/api/v3/segments/search",
        data: {
          bounds: vectorA + "," + vectorB,
          min_cat: "0",
          max_cat: "5",
          activity_type: "running"
        },
        type: "GET",
        crossDomain: true, // enable this
        dataType: "jsonp",
        success: (xhrResponseText: any) => {
          segmentsUnify.running = xhrResponseText;
        },
        error: (err: any) => {
          console.error(err);
        }
      })
    ).then(() => {
      callback(segmentsUnify);
    });
  }

  public getSegmentStream(segmentId: number, callback: (xhrResponseText: any) => void): void {
    $.ajax({
      url: "/stream/segments/" + segmentId,
      dataType: "json",
      type: "GET",
      success: (xhrResponseText: any) => {
        callback(xhrResponseText);
      },
      error: (err: any) => {
        console.error(err);
      }
    });
  }

  /**
   * @returns Array of bikes/odo
   */
  public getAthleteGear<T extends GearModel>(athleteId: number, type: GearType): Promise<T[]> {
    const parseOdo = (odo: string) => {
      return parseInt(odo.match(/\d+/g).join(""), 10) / 10;
    };

    let gearType;

    if (type === GearType.BIKE) {
      gearType = "bikes";
    } else if (type === GearType.SHOES) {
      gearType = "shoes";
    } else {
      throw new Error("Unsupported gear type");
    }

    const url: string = "/athletes/" + athleteId + "/gear/" + gearType;

    const unitData = Helper.getSpeedUnitData(window.currentAthlete.get("measurement_preference"));

    return new Promise((resolve, reject) => {
      $.ajax({
        url,
        dataType: "json"
      }).done((results: any[], textStatus: string, jqXHR: JQuery.jqXHR) => {
        if (textStatus !== "success") {
          reject(jqXHR);
        } else {
          const gears: GearModel[] = [];
          _.forEach(results, (result: any) => {
            if (type === GearType.BIKE) {
              gears.push(
                new BikeGearModel(
                  result.id,
                  result.total_distance ? parseOdo(result.total_distance) : 0,
                  result.active,
                  result.default,
                  result.description,
                  result.display_name,
                  unitData.units
                )
              );
            } else if (type === GearType.SHOES) {
              gears.push(
                new ShoesGearModel(
                  result.id,
                  result.total_distance ? parseOdo(result.total_distance) : 0,
                  result.active,
                  result.default,
                  result.description,
                  result.display_name,
                  result.brand_name,
                  result.model_name,
                  result.name,
                  result.notification_distance,
                  unitData.units
                )
              );
            }
          });
          resolve(gears as T[]);
        }
      });
    });
  }

  public getActivityStartDate(): Date {
    if (window.pageView && window.pageView.activity) {
      const startTime = window.pageView.activity().get("startDateLocal");
      if (_.isNumber(startTime)) {
        return new Date(startTime * 1000);
      }
    }

    if (
      window.pageView &&
      window.pageView.activity &&
      _.isNumber(window.pageView.activity().get("id")) &&
      window.pageView.similarActivities &&
      window.pageView.similarActivities() &&
      window.pageView.similarActivities().efforts &&
      window.pageView.similarActivities().efforts.byActivityId
    ) {
      const activity = window.pageView.similarActivities().efforts.byActivityId[window.pageView.activity().get("id")];
      if (activity && _.isNumber(activity.get("start_date"))) {
        return new Date(activity.get("start_date") * 1000);
      }
    }

    return null;
  }

  public getActivityAthleteGender(): Gender {
    if (window.pageView && window.pageView.activityAthlete && window.pageView.activityAthlete().get("gender")) {
      return window.pageView.activityAthlete().get("gender") === "M" ? Gender.MEN : Gender.WOMEN;
    }
    return null;
  }

  public getActivityName(): string {
    const activityName: string = $(".activity-summary-container").find(".marginless.activity-name").text().trim();
    return activityName ? activityName : null;
  }

  /**
   *  ...
   *  @returns ...
   */

  protected getAthleteWeight(): number {
    const datedAthleteSettings = this.athleteModelResolver.resolve(this.getActivityStartDate());
    return datedAthleteSettings.athleteSettings.weight;
  }

  /**
   * @returns Common activity stats given by Strava throught right panel
   */
  protected getActivityEssentials(): ActivityEssentials {
    // Create activityData Map
    const movingTime = window.pageView.activity().get("moving_time");
    const elevGain = window.pageView.activity().get("elev_gain");
    const distance = window.pageView.activity().get("distance");

    return {
      movingTime: movingTime ? movingTime : null,
      elevation: elevGain ? elevGain : null,
      distance: distance ? distance : null
    };
  }
}
