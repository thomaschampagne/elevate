import {Component, Inject, OnDestroy, OnInit} from "@angular/core";
import _ from "lodash";
import {Subscription} from "rxjs";
import {LoggerService} from "../shared/services/logging/logger.service";
import leaflet from "leaflet";
import "leaflet-providers";
import "leaflet.fullscreen";

import {AppService} from "../shared/services/app-service/app.service";
import {ProcessStreamMode} from "@elevate/shared/sync/compute/stream-processor";
import {Streams} from "@elevate/shared/models/activity-data/streams.model";
import {ActivityService} from "../shared/services/activity/activity.service";
import {DesktopActivityService} from "../shared/services/activity/impl/desktop-activity.service";
import {StreamsService} from "../shared/services/streams/streams.service";
import {ElevateSport} from "@elevate/shared/enums/elevate-sport.enum";
import {Theme} from "../shared/enums/theme.enum";

@Component({
  selector: "app-heat-map",
  templateUrl: "./heat-map.component.html",
  styleUrls: ["./heat-map.scss"]
})
export class HeatMapComponent implements OnInit, OnDestroy {
  private options: any;
  private map: any;
  private mapTiles: any;
  public isLoading: boolean = false;
  public availableActivityTypes: ElevateSport[];
  public activityTypes: any[];
  constructor(
    @Inject(LoggerService) private readonly logger: LoggerService,
    @Inject(AppService) private readonly appService: AppService,
    @Inject(ActivityService) protected readonly activityService: DesktopActivityService,
    @Inject(StreamsService) protected readonly streamsService: StreamsService
  ) {}

  public historyChangesSub: Subscription;

  public async ngOnInit(): Promise<void> {
    this.logger.debug("HeatMap component initialized");

    // Listen for sync done to reload component
    this.historyChangesSub = this.appService.historyChanges$.subscribe(() => {
      this.ngOnDestroy();
      this.ngOnInit();
    });

    // Initialze Activity Type selector
    const activityCountByTypeModels = this.activityService.countByType();
    this.availableActivityTypes = _.map(activityCountByTypeModels, "type");
    this.activityTypes = this.availableActivityTypes;

    // The map is different depending on the theme
    if (this.appService.currentTheme === Theme.LIGHT) {
      this.options = {
        theme: "CartoDB.Positron",
        lineOptions: {
          color: "#e8340c",
          weight: 1,
          opacity: 0.5,
          smoothFactor: 1,
          overrideExisting: true,
          detectColors: true
        }
      }
    } else {
      this.options = {
        theme: "CartoDB.DarkMatter",
        lineOptions: {
          color: "#0CB1E8",
          weight: 1,
          opacity: 0.5,
          smoothFactor: 1,
          overrideExisting: true,
          detectColors: true
        }
      }
    }

    this.map = leaflet.map("background-map", {
      center: await this.findCenter(),
      zoom: 8,
      preferCanvas: true,
    });

    this.mapTiles = leaflet.tileLayer.provider(this.options.theme);
    this.mapTiles.addTo(this.map, { detectRetina: true });

    // Create a fullscreen button and add it to the map
    leaflet.control.fullscreen({
      position: 'topright',
      title: 'Enter fullscreen mode',
      titleCancel: 'Exit fullscreen mode',
      forceSeparateButton: true,
      content: '<div style="padding-top: 3px"><i class="material-icons">fullscreen</i></div>',
     }).addTo(this.map);
  }

  public ngOnDestroy(): void {
    this.historyChangesSub.unsubscribe();
  }

  public async plotActivities(): Promise<void> {
    // Plot all activities
    // TODO: Solve the problem of freezing UI when loading all activities
    this.isLoading = true;
    if (this.activityTypes.length > 0) {
      const activities = await this.activityService.findSorted();
      for (const activity of activities) {
        try {
          if(_.includes(this.activityTypes, activity.type)) {
            const streams: Streams = await this.streamsService.getProcessedById(ProcessStreamMode.DISPLAY, activity.id, {
              type: activity.type,
              hasPowerMeter: activity.hasPowerMeter,
              isSwimPool: activity.isSwimPool,
              athleteSnapshot: activity.athleteSnapshot
            });
            leaflet.polyline(streams?.latlng, this.options.lineOptions).addTo(this.map);
          }
        } catch (err) {
          this.logger.error("Impossible to load this activity !", err);
        }
      }
    }
    this.isLoading = false;
  }

  public async findCenter() : Promise<[number, number]> {
    const coordinates = [];
    if (this.activityTypes.length > 0) {
      const activities = await this.activityService.findSorted();
      for (let i = 0; i < activities.length; i++) {
        try {
          const activity = activities[i];

          // We select only a few activities to find the center
          if(_.includes(this.activityTypes, activity.type) && i%20==0) {
            const streams: Streams = await this.streamsService.getProcessedById(ProcessStreamMode.DISPLAY, activity.id, {
              type: activity.type,
              hasPowerMeter: activity.hasPowerMeter,
              isSwimPool: activity.isSwimPool,
              athleteSnapshot: activity.athleteSnapshot
            });
            coordinates.push(streams?.latlng?.[0]);
          }
        } catch (err) {
          this.logger.error("Impossible to load this activity !", err);
        }
      }

      const averageLat = coordinates.reduce( ( p, c ) => p + c[0], 0 ) / coordinates.length;
      const averageLong = coordinates.reduce( ( p, c ) => p + c[1], 0 ) / coordinates.length;
      return [averageLat, averageLong];
    }
  }

  public async onTickAllActivityTypes(): Promise<void> {
    this.activityTypes = this.availableActivityTypes;
  }

  public async onUnTickAllActivityTypes(): Promise<void> {
    this.activityTypes = [_.first(this.availableActivityTypes)];
  }

  public startCase(sport: string): string {
    return _.startCase(sport);
  }
}
