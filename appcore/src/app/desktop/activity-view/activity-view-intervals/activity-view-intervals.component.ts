import { Component, Inject, Input, OnInit } from "@angular/core";
import _ from "lodash";
import { MatTableDataSource } from "@angular/material/table";
import { PaceSensor, SpeedSensor, SwimmingPaceSensor } from "../shared/models/sensors/move.sensor";
import {
  CadenceSensor,
  CyclingCadenceSensor,
  RunningCadenceSensor,
  SwimmingCadenceSensor
} from "../shared/models/sensors/cadence.sensor";
import { HeartRateSensor } from "../shared/models/sensors/heart-rate.sensor";
import { DistanceSensor, RunningDistanceSensor, SwimDistanceSensor } from "../shared/models/sensors/distance.sensor";
import { ActivityViewService } from "../shared/activity-view.service";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { Activity, Lap } from "@elevate/shared/models/sync/activity.model";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";
import { Time } from "@elevate/shared/tools/time";

@Component({
  selector: "app-activity-view-intervals",
  templateUrl: "./activity-view-intervals.component.html",
  styleUrls: ["./activity-view-intervals.component.scss"]
})
export class ActivityViewIntervalsComponent implements OnInit {
  constructor(@Inject(ActivityViewService) private readonly activityViewService: ActivityViewService) {}

  private readonly PRINT_FUNCTION_MAP = new Map<
    keyof Lap,
    (sport: ElevateSport, lap: Lap, measureSystem: MeasureSystem) => number | string
  >([
    [
      "distance",
      (sport: ElevateSport, lap: Lap, measureSystem: MeasureSystem) =>
        this.printDistance(sport, measureSystem, lap.distance)
    ],
    ["movingTime", (sport: ElevateSport, lap: Lap) => Time.secToMilitary(lap.movingTime)],
    ["elapsedTime", (sport: ElevateSport, lap: Lap) => Time.secToMilitary(lap.elapsedTime)],
    [
      "avgSpeed",
      (sport: ElevateSport, lap: Lap, measureSystem: MeasureSystem) => this.printSpeed(measureSystem, lap.avgSpeed)
    ],
    [
      "maxSpeed",
      (sport: ElevateSport, lap: Lap, measureSystem: MeasureSystem) => this.printSpeed(measureSystem, lap.maxSpeed)
    ],
    [
      "avgPace",
      (sport: ElevateSport, lap: Lap, measureSystem: MeasureSystem) => this.printPace(sport, measureSystem, lap.avgPace)
    ],
    [
      "maxPace",
      (sport: ElevateSport, lap: Lap, measureSystem: MeasureSystem) => this.printPace(sport, measureSystem, lap.maxPace)
    ],

    [
      "avgCadence",
      (sport: ElevateSport, lap: Lap, measureSystem: MeasureSystem) =>
        this.printCadence(sport, measureSystem, lap.avgCadence)
    ],
    [
      "avgHr",
      (sport: ElevateSport, lap: Lap, measureSystem: MeasureSystem) => this.printHeartRate(measureSystem, lap.avgHr)
    ],
    [
      "maxHr",
      (sport: ElevateSport, lap: Lap, measureSystem: MeasureSystem) => this.printHeartRate(measureSystem, lap.maxHr)
    ],
    ["avgWatts", (sport: ElevateSport, lap: Lap) => this.printPower(lap.avgWatts)],
    ["active", (sport: ElevateSport, lap: Lap) => (lap.active ? "Yes" : "No")]
  ]);

  private readonly DISTANCE_SENSOR_MAP = new Map<ElevateSport, DistanceSensor>([
    [ElevateSport.Ride, DistanceSensor.DEFAULT],
    [ElevateSport.Run, RunningDistanceSensor.DEFAULT],
    [ElevateSport.Swim, SwimDistanceSensor.DEFAULT]
  ]);

  private readonly CADENCE_SENSOR_MAP = new Map<ElevateSport, CadenceSensor>([
    [ElevateSport.Ride, CyclingCadenceSensor.DEFAULT],
    [ElevateSport.Run, RunningCadenceSensor.DEFAULT],
    [ElevateSport.Swim, SwimmingCadenceSensor.DEFAULT]
  ]);

  @Input()
  public readonly activity: Activity;

  @Input()
  public readonly measureSystem: MeasureSystem;

  @Input()
  public hasMapData: boolean;

  public laps: Lap[];

  public dataSource: MatTableDataSource<Lap>;

  private displayTitlesMap: Map<keyof Lap, string>;

  public columnDefs: (keyof Lap)[];

  public displayedColumnDefs: (keyof Lap)[];

  private readonly DISPLAY_TITLES_SPORT_MAP: (sport: ElevateSport) => Map<keyof Lap, string> = sport => {
    const map = new Map<keyof Lap, string>();
    map.set("id", "Lap Id");
    map.set("distance", "Distance");
    map.set("movingTime", "Moving Time");
    map.set("elapsedTime", "Elapsed Time");

    if (Activity.isPaced(sport)) {
      map.set("avgPace", "Avg Pace");
      map.set("maxPace", "Max Pace");
    } else {
      map.set("avgSpeed", "Avg Speed");
      map.set("maxSpeed", "Max Speed");
    }

    map.set("avgCadence", "Avg Cadence");

    if (Activity.isSwim(sport)) {
      map.set("swolf25m", "Swolf 25m");
      map.set("swolf50m", "Swolf 50m");
    }

    map.set("avgHr", "Avg HR");
    map.set("maxHr", "Max HR");
    map.set("avgWatts", "Avg Watts");
    map.set("calories", "Calories");
    map.set("active", "Active");

    if (this.hasMapData) {
      map.set("indexes", "Map View");
    }

    return map;
  };

  public ngOnInit(): void {
    this.laps = this.activity.laps;
    this.displayTitlesMap = this.DISPLAY_TITLES_SPORT_MAP(this.activity.type);
    this.columnDefs = this.findColumnDefs();
    this.displayedColumnDefs = this.getDisplayedColumnsDefs();
    this.dataSource = new MatTableDataSource();
    this.dataSource.data = this.laps;
  }

  public getDisplayedColumnsDefs(): (keyof Lap)[] {
    return Array.from(this.displayTitlesMap.keys()).filter(key => this.columnDefs.indexOf(key) !== -1);
  }

  public printColumn(columnDef: keyof Lap): string {
    return this.displayTitlesMap.get(columnDef) || columnDef;
  }

  public printValue(lap: Lap, columnDef: keyof Lap): number | number[] | boolean | string {
    const value = lap[columnDef];

    if (value === undefined || value === null) {
      return "-";
    }

    const printFunction = this.PRINT_FUNCTION_MAP.get(columnDef);
    if (printFunction) {
      return printFunction(this.activity.type, lap, this.measureSystem);
    }

    return value;
  }

  private findColumnDefs(): (keyof Lap)[] {
    let columnDefKeys = [];
    this.laps.forEach(lap => {
      columnDefKeys = _.union(columnDefKeys, _.keys(lap));
    });
    return columnDefKeys;
  }

  private printDistance(sport: ElevateSport, measureSystem: MeasureSystem, distance: number): string {
    const distanceSensor = this.DISTANCE_SENSOR_MAP.get(sport) || DistanceSensor.DEFAULT;
    return `${distanceSensor.formatFromStat(distance, measureSystem)} ${distanceSensor.getDisplayUnit(measureSystem)}`;
  }

  private printPace(sport: ElevateSport, measureSystem: MeasureSystem, pace: number): string {
    const paceSensor = Activity.isSwim(sport) ? SwimmingPaceSensor.DEFAULT : PaceSensor.DEFAULT;
    return `${paceSensor.formatFromStat(pace, measureSystem)} ${paceSensor.getDisplayUnit(measureSystem)}`;
  }

  private printSpeed(measureSystem: MeasureSystem, speed: number): string {
    const speedSensor = SpeedSensor.DEFAULT;
    return `${speedSensor.formatFromStat(speed, measureSystem)} ${speedSensor.getDisplayUnit(measureSystem)}`;
  }

  private printCadence(sport: ElevateSport, measureSystem: MeasureSystem, cadence: number): string {
    const cadenceSensor = this.CADENCE_SENSOR_MAP.get(sport) || CyclingCadenceSensor.DEFAULT;
    return `${cadenceSensor.formatFromStat(cadence, measureSystem)} ${cadenceSensor.getDisplayUnit(measureSystem)}`;
  }

  private printHeartRate(measureSystem: MeasureSystem, hr: number): string {
    const heartRateSensor = HeartRateSensor.DEFAULT;
    return `${heartRateSensor.formatFromStat(hr, measureSystem)} ${heartRateSensor.getDisplayUnit(measureSystem)}`;
  }

  private printPower(watts: number) {
    return `${watts} w`;
  }

  public onViewLapOnMap(indexes: number[]): void {
    this.activityViewService.selectedGraphBounds$.next(indexes);
  }
}
