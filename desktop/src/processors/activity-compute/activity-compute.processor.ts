import _ from "lodash";
import { Hash } from "../../tools/hash";
import { ActivityComputer } from "@elevate/shared/sync/compute/activity-computer";
import { Activity, ActivityStats } from "@elevate/shared/models/sync/activity.model";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { ActivityEssentials } from "@elevate/shared/models/activity-data/activity-essentials.model";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";

export class ActivityComputeProcessor {
  public static hash(activity: Partial<Activity>): string {
    const activityUnit = {
      type: activity.type,
      startTime: activity.startTime,
      endTime: activity.endTime,
      hasPowerMeter: activity.hasPowerMeter,
      trainer: activity.trainer,
      latLngCenter:
        activity.latLngCenter?.length > 1
          ? [_.floor(activity.latLngCenter[0], 2), _.floor(activity.latLngCenter[1], 2)]
          : null,
      distance: _.floor(activity.srcStats?.distance) || null
    };

    return Hash.asObjectId(JSON.stringify(activityUnit));
  }

  public static geoBaryCenter(streams: Partial<Streams>): number[] {
    if (!streams) {
      return null;
    }

    const latLngStream: number[][] = streams.latlng;
    if (!latLngStream || !Array.isArray(latLngStream) || latLngStream.length === 0) {
      return null;
    }

    const lat = latLngStream.map(latLng => latLng[0]);
    const lng = latLngStream.map(latLng => latLng[1]);
    const cLat = (Math.min(...lat) + Math.max(...lat)) / 2;
    const cLng = (Math.min(...lng) + Math.max(...lng)) / 2;
    return [cLat, cLng];
  }

  public static compute(
    activity: Partial<Activity>,
    athleteSnapshot: AthleteSnapshot,
    userSettings: UserSettings.BaseUserSettings,
    streams: Streams,
    deflateStreams: boolean,
    returnPeaks: boolean = true,
    returnZones: boolean = false,
    bounds: number[] = null,
    isOwner: boolean = true,
    activityEssentials: ActivityEssentials = null
  ): Promise<{ computedActivity: Activity; deflatedStreams: string | null }> {
    try {
      // Compute activity stats
      const stats = ActivityComputer.compute(
        activity,
        athleteSnapshot,
        userSettings,
        streams,
        returnPeaks,
        returnZones,
        bounds,
        isOwner,
        activityEssentials
      );

      // Assign source stats and stats to activity
      Activity.applySourceStats(activity as Activity, activity.srcStats as ActivityStats, stats);

      // Update activity with athlete snapshot used for computation
      activity.athleteSnapshot = athleteSnapshot;

      // Compute bary center from lat/lng stream
      activity.latLngCenter = this.geoBaryCenter(streams);

      // Check if user missed some athlete settings. Goal: avoid missing stress scores because of missing settings.
      activity.settingsLack = ActivityComputer.hasAthleteSettingsLacks(
        activity.stats.distance,
        activity.stats.movingTime,
        activity.stats.elapsedTime,
        activity.type,
        activity.stats,
        activity.athleteSnapshot.athleteSettings,
        streams
      );

      // Compute activity hash
      activity.hash = this.hash(activity);

      // Deflate streams if required by client
      const deflatedStreams = deflateStreams && streams ? Streams.deflate(streams) : null;

      return Promise.resolve({ computedActivity: activity as Activity, deflatedStreams: deflatedStreams });
    } catch (err) {
      return Promise.reject(err);
    }
  }
}
