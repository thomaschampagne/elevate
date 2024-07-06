import _ from "lodash";
import moment from "moment";
import { saveAs } from "file-saver";
import { Component, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivityService } from "../shared/services/activity/activity.service";
import { MatDialog } from "@angular/material/dialog";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatSort, Sort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { ActivityColumns } from "./activity-columns.namespace";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { GotItDialogComponent } from "../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "../shared/dialogs/got-it-dialog/got-it-dialog-data.model";
import { LoggerService } from "../shared/services/logging/logger.service";
import { SyncService } from "../shared/services/sync/sync.service";
import { AppError } from "../shared/models/app-error.model";
import { ConfirmDialogDataModel } from "../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { Subject, Subscription, timer } from "rxjs";
import { debounce } from "rxjs/operators";
import { OPEN_RESOURCE_RESOLVER, OpenResourceResolver } from "../shared/services/links-opener/open-resource-resolver";
import { AppService } from "../shared/services/app-service/app.service";
import { ActivatedRoute, Router } from "@angular/router";
import { AppRoutes } from "../shared/models/app-routes";
import { environment } from "../../environments/environment";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import NumberColumn = ActivityColumns.NumberColumn;
import BaseUserSettings = UserSettings.BaseUserSettings;
import { FieldInfo, Parser as Json2CsvParser } from "json2csv";

class Preferences {
  constructor(
    public fromDate: string = null,
    public toDate: string = null,
    public activityName: string = "",
    public sports: ElevateSport[] = [],
    public sort: Sort = { active: null, direction: null },
    public pageIndex: number = 0,
    public pageSize: number = 10
  ) {}
}

@Component({
  selector: "app-activities",
  templateUrl: "./activities.component.html",
  styleUrls: ["./activities.component.scss"]
})
export class ActivitiesComponent implements OnInit, OnDestroy {
  private static readonly LS_SELECTED_COLUMNS: string = "activitiesTable.selectedColumns";
  private static readonly DEGRADED_PERFORMANCE_COLUMNS_COUNT: number = 35;
  private static readonly ACTIVITY_SEARCH_DEBOUNCE_TIME: number = 500;

  public readonly ColumnType = ActivityColumns.ColumnType;

  @ViewChild(MatPaginator, { static: true })
  public matPaginator: MatPaginator;

  @ViewChild(MatSort, { static: true })
  public matSort: MatSort;

  public dataSource: MatTableDataSource<Activity>;
  public columns: ActivityColumns.Column[];
  public selectedColumns: ActivityColumns.Column[];
  public columnsCategories: ActivityColumns.Category[];
  public displayedColumns: string[];
  public isImperial: boolean;
  public hasActivities: boolean; // Can be null: don't know yet true/false status on load
  public hasEmptyResults: boolean; // Can be null: don't know yet true/false status on load
  public initialized: boolean;
  public isPerformanceDegraded: boolean;
  public historyChangesSub: Subscription;

  public athleteSports: ElevateSport[];
  public activityNameSearch$: Subject<string>;
  public preferences: Preferences;
  public today: Date;

  constructor(
    @Inject(AppService) private readonly appService: AppService,
    @Inject(ActivatedRoute) private readonly route: ActivatedRoute,
    @Inject(Router) private readonly router: Router,
    @Inject(SyncService) private readonly syncService: SyncService<any>,
    @Inject(ActivityService) private readonly activityService: ActivityService,
    @Inject(UserSettingsService) private readonly userSettingsService: UserSettingsService,
    @Inject(OPEN_RESOURCE_RESOLVER) private readonly openResourceResolver: OpenResourceResolver,
    @Inject(MatSnackBar) private readonly snackBar: MatSnackBar,
    @Inject(MatDialog) private readonly dialog: MatDialog,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {
    this.hasActivities = null; // Can be null: don't know yet true/false status
    this.hasEmptyResults = null; // Can be null: don't know yet true/false status
    this.initialized = false;
    this.isPerformanceDegraded = false;

    this.activityNameSearch$ = new Subject();
    this.preferences = new Preferences();
    this.today = new Date();

    this.resetPageIndexPreference();

    // Setup a list of the most practiced sport by the athlete for the sport filter
    this.athleteSports = _.map(this.activityService.countByType(), "type");
  }

  public static printAthleteSettings(activity: Activity, isImperial: boolean): string {
    if (!activity.athleteSnapshot) {
      return null;
    }

    let inlineSettings = "";

    if (_.isNumber(activity.stats?.scores?.stress?.hrss) || _.isNumber(activity.stats?.scores?.stress?.trimp)) {
      inlineSettings += "MaxHr " + activity.athleteSnapshot.athleteSettings.maxHr + "bpm. ";
      inlineSettings += "RestHr " + activity.athleteSnapshot.athleteSettings.restHr + "bpm. ";

      if (
        activity.athleteSnapshot.athleteSettings.lthr.default ||
        activity.athleteSnapshot.athleteSettings.lthr.cycling ||
        activity.athleteSnapshot.athleteSettings.lthr.running
      ) {
        let lthrStr = "Lthr ";

        lthrStr += activity.athleteSnapshot.athleteSettings.lthr.default
          ? "D:" + activity.athleteSnapshot.athleteSettings.lthr.default + "bpm, "
          : "";
        lthrStr += activity.athleteSnapshot.athleteSettings.lthr.cycling
          ? "C:" + activity.athleteSnapshot.athleteSettings.lthr.cycling + "bpm, "
          : "";
        lthrStr += activity.athleteSnapshot.athleteSettings.lthr.running
          ? "R:" + activity.athleteSnapshot.athleteSettings.lthr.running + "bpm, "
          : "";
        lthrStr = lthrStr.slice(0, -2);

        inlineSettings += lthrStr + ". ";
      }
    }

    if (_.isNumber(activity.stats?.scores?.stress?.pss) && activity.athleteSnapshot.athleteSettings.cyclingFtp) {
      inlineSettings += "Cycling Ftp " + activity.athleteSnapshot.athleteSettings.cyclingFtp + "w. ";
    }

    if (_.isNumber(activity.stats?.scores?.stress?.rss) && activity.athleteSnapshot.athleteSettings.runningFtp) {
      inlineSettings +=
        "Run Ftp " + activity.athleteSnapshot.athleteSettings.runningFtp + "s/" + (isImperial ? "mi" : "km") + ".";
    }

    if (activity.type === "Swim" && activity.athleteSnapshot.athleteSettings.swimFtp) {
      inlineSettings += "Swim Ftp " + activity.athleteSnapshot.athleteSettings.swimFtp + "m/min. ";
    }

    inlineSettings += "Weight " + activity.athleteSnapshot.athleteSettings.weight + "kg.";

    return inlineSettings;
  }

  public ngOnInit(): void {
    // Listen for activity name search changes and re-fetch data from.
    this.activityNameSearch$
      .pipe(debounce(() => timer(ActivitiesComponent.ACTIVITY_SEARCH_DEBOUNCE_TIME)))
      .subscribe(() => this.onActivityPrefNameChange());

    this.activityService
      .count()
      .then((count: number) => {
        this.hasActivities = count > 0;
        return this.hasActivities
          ? this.userSettingsService.fetch()
          : Promise.reject(new AppError(AppError.SYNC_NOT_SYNCED, "No activities available"));
      })
      .then((userSettings: BaseUserSettings) => {
        this.isImperial = userSettings.systemUnit === MeasureSystem.IMPERIAL;
      })
      .then(() => {
        // Filter displayed columns
        this.columnsSetup();

        // Data source setup
        this.dataSourceSetup();

        // Check if preferences have been provided from url then apply if exists
        if (this.route.snapshot.queryParams.preferences) {
          try {
            this.preferences = JSON.parse(this.route.snapshot.queryParams.preferences);
            this.logger.debug("Applying found preferences: ", this.preferences);
          } catch (e) {
            this.logger.error("Failed to parse url preferences provided");
            this.preferences = new Preferences();
          }
        }

        // Get and apply data
        this.findAndDisplayActivities();
      })
      .catch(error => {
        if (error instanceof AppError && error.code === AppError.SYNC_NOT_SYNCED) {
          this.initialized = true;
        } else {
          throw error;
        }
      });

    // Listen for syncFinished update then table if necessary.
    this.historyChangesSub = this.appService.historyChanges$.subscribe(() => {
      this.initialized = false;
      this.ngOnDestroy();
      this.ngOnInit();
    });
  }

  public columnsSetup(): void {
    const existingSelectedColumns = this.getSelectedColumns();

    this.selectedColumns = existingSelectedColumns ? existingSelectedColumns : this.getDefaultsColumns();

    // Filter column along selection
    this.filterDisplayedColumns();

    // Check if user selected too much columns. Display warning if so
    this.verifyTablePerformance();

    // Creates category of columns
    this.columnsCategories = this.createColumnsCategories(ActivityColumns.Definition.ALL);
  }

  public dataSourceSetup(): void {
    this.dataSource = new MatTableDataSource();
    this.dataSource.paginator = this.matPaginator;
    this.dataSource.sort = this.matSort;

    this.dataSource.sortingDataAccessor = (activity: Activity, sortHeaderId: string) => {
      const column = _.find(ActivityColumns.Definition.ALL, { id: sortHeaderId });

      let value;

      if (column && column.id) {
        const valueAtPath = _.at(activity as any, column.id)[0];
        value = valueAtPath ? valueAtPath : 0;
      } else {
        this.logger.warn("Column path missing", JSON.stringify(column));
        value = 0;
      }

      return value;
    };
  }

  public findAndDisplayActivities(): void {
    // Build the query
    // Apply default activity name regex search
    let nameRegexPattern = _.escapeRegExp(this.preferences.activityName.trim());
    nameRegexPattern = _.replace(nameRegexPattern, " ", ".*");
    nameRegexPattern = `.*${nameRegexPattern}.*`;

    const query: LokiQuery<Activity & LokiObj> = {
      name: { $regex: [nameRegexPattern, "i"] }
    };

    // Apply sports preferences if provided
    if (this.preferences.sports.length) {
      query.type = { $in: this.preferences.sports };
    }

    if (this.preferences.fromDate) {
      query.startTime = {
        $gte: _.isDate(this.preferences.fromDate) ? this.preferences.fromDate.toISOString() : this.preferences.fromDate
      };
    }

    if (this.preferences.toDate) {
      query.endTime = {
        $lte: moment(this.preferences.toDate).endOf("day").toISOString()
      };
    }

    // Setup default sort on descending start time
    const sort: { propName: keyof Activity; options: Partial<SimplesortOptions> } = {
      propName: "startTime",
      options: { desc: true }
    };

    this.activityService
      .find(query, sort)
      .then((activities: Activity[]) => {
        this.hasEmptyResults = activities.length === 0;

        // Apply paging
        this.dataSource.paginator.pageIndex = this.preferences.pageIndex;
        this.dataSource.paginator.pageSize = this.preferences.pageSize;

        // Apply sort
        if (this.preferences.sort.active) {
          this.dataSource.sort.active = this.preferences.sort.active;
        }

        // ...and sort direction
        if (this.preferences.sort.direction) {
          this.dataSource.sort.direction = this.preferences.sort.direction;
        }

        // Apply data
        this.dataSource.data = activities;
      })
      .catch(error => {
        const message = error.toString();
        this.snackBar.open(message, "Close");
        this.logger.error(message);
      })
      .finally(() => {
        this.initialized = true;
      });
  }

  public filterDisplayedColumns(): void {
    this.columns = _.filter(ActivityColumns.Definition.ALL, (column: ActivityColumns.Column) => {
      if (column.buildTarget !== undefined && column.buildTarget !== environment.buildTarget) {
        return false;
      }

      return !_.isEmpty(_.find(this.selectedColumns, { id: column.id }));
    });

    this.displayedColumns = this.columns.map(column => column.id);
  }

  public verifyTablePerformance(): void {
    this.isPerformanceDegraded = this.selectedColumns.length >= ActivitiesComponent.DEGRADED_PERFORMANCE_COLUMNS_COUNT;
  }

  public onSelectedColumns(): void {
    this.verifyTablePerformance();
    this.filterDisplayedColumns();
    this.saveSelectedColumns();
  }

  public getSelectedColumns(): ActivityColumns.Column[] {
    const savedColumns: string[] = JSON.parse(localStorage.getItem(ActivitiesComponent.LS_SELECTED_COLUMNS));

    let selectedColumns: ActivityColumns.Column[] = null;

    if (savedColumns) {
      selectedColumns = _.filter(ActivityColumns.Definition.ALL, (column: ActivityColumns.Column) => {
        return _.indexOf(savedColumns, column.id) !== -1;
      });
    }

    return selectedColumns;
  }

  public getDefaultsColumns(): ActivityColumns.Column[] {
    return _.filter(ActivityColumns.Definition.ALL, (column: ActivityColumns.Column) => {
      return column.isDefault;
    });
  }

  public saveSelectedColumns(): void {
    const columnsToBeSaved: string[] = _.map(this.selectedColumns, (column: ActivityColumns.Column) => {
      return column.id;
    });
    localStorage.setItem(ActivitiesComponent.LS_SELECTED_COLUMNS, JSON.stringify(columnsToBeSaved));
  }

  public createColumnsCategories(columns: ActivityColumns.Column[]): ActivityColumns.Category[] {
    return _.map(_.groupBy(columns, "category"), (columnsGroup: ActivityColumns.Column[], categoryLabel: string) => {
      return new ActivityColumns.Category(categoryLabel, columnsGroup);
    });
  }

  public activityPrefNameUpdate(activityNamePattern: string): void {
    this.activityNameSearch$.next(activityNamePattern);
  }

  public onActivityPrefNameChange(): void {
    this.resetPageIndexPreference();
    this.persistPreferencesInUrl();
    this.findAndDisplayActivities();
  }

  public onActivityPrefSportsChange(): void {
    this.resetPageIndexPreference();
    this.persistPreferencesInUrl();
    this.findAndDisplayActivities();
  }

  public onDateToDateChange(): void {
    this.persistPreferencesInUrl();
    this.findAndDisplayActivities();
  }

  public onResetPreferences(): void {
    this.preferences = new Preferences();
    this.persistPreferencesInUrl();
    this.findAndDisplayActivities();
  }

  private resetPageIndexPreference(): void {
    this.preferences.pageIndex = 0;
  }

  private persistPreferencesInUrl(): void {
    this.router.navigate([AppRoutes.activities], {
      queryParams: { preferences: JSON.stringify(this.preferences) },
      queryParamsHandling: "merge"
    });
  }

  public openActivity(id: number | string) {
    this.openResourceResolver.openActivity(id);
  }

  public onViewAthleteSettings(activity: Activity): void {
    this.dialog.open(GotItDialogComponent, {
      minWidth: GotItDialogComponent.MIN_WIDTH,
      maxWidth: GotItDialogComponent.MAX_WIDTH,
      data: new GotItDialogDataModel(
        "Calculated with athlete settings",
        ActivitiesComponent.printAthleteSettings(activity, this.isImperial)
      )
    });
  }

  public onDeleteActivity(activity: Activity): void {
    const data: ConfirmDialogDataModel = {
      title: 'Deleting activity "' + activity.name + '"',
      content: `Are you sure? You can fetch back this activity through a "Sync all activities"`,
      confirmText: "Delete"
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: ConfirmDialogComponent.MIN_WIDTH,
      maxWidth: ConfirmDialogComponent.MAX_WIDTH,
      data: data
    });

    const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {
      if (confirm) {
        this.activityService.removeById(activity.id).then(
          () => {
            this.findAndDisplayActivities();
          },
          error => {
            this.snackBar.open(error, "Close");
          }
        );
      }
      afterClosedSubscription.unsubscribe();
    });
  }

  public resetColumns(): void {
    this.selectedColumns = this.getDefaultsColumns();
    this.onSelectedColumns();
  }

  public tickAll(): void {
    const data: ConfirmDialogDataModel = {
      title: "Feature performance warning",
      content:
        "<div>Ticking all the columns will strongly impact the performance and user experience.</div><br/><div><i>Note: You can reset columns to default values afterward.</i></div><br/>",
      confirmText: "Continue"
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: ConfirmDialogComponent.MIN_WIDTH,
      maxWidth: ConfirmDialogComponent.MAX_WIDTH,
      data: data
    });

    const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {
      if (confirm) {
        this.selectedColumns = _.clone(ActivityColumns.Definition.ALL);
        this.onSelectedColumns();
      }
      afterClosedSubscription.unsubscribe();
    });
  }

  public unTickAll(): void {
    this.selectedColumns = [
      _.find(ActivityColumns.Definition.ALL, { id: "startTime" }),
      _.find(ActivityColumns.Definition.ALL, { id: "name" }),
      _.find(ActivityColumns.Definition.ALL, { id: "type" }),
      _.find(ActivityColumns.Definition.ALL, { id: "deleteActivity" })
    ];

    this.onSelectedColumns();
  }

  public onPageEvent(pageEvent: PageEvent): void {
    this.preferences.pageIndex = pageEvent.pageIndex;
    this.preferences.pageSize = pageEvent.pageSize;
    this.persistPreferencesInUrl();
  }

  public onSortEvent(sort: Sort): void {
    this.preferences.sort = sort;
    this.persistPreferencesInUrl();
  }

  public onSpreadSheetExport(): void {
    try {
      const fields: FieldInfo<Activity>[] = _.map(this.selectedColumns, (column: ActivityColumns.Column) => {
        let columnLabel = column.header;

        if (ActivityColumns.ColumnType.NUMBER) {
          const numberColumn = column as NumberColumn;

          if (numberColumn.units) {
            let unitsColumn = numberColumn.units;

            if (unitsColumn instanceof ActivityColumns.SystemUnits) {
              unitsColumn = this.isImperial ? unitsColumn.imperial : unitsColumn.metric;
            }

            if (unitsColumn instanceof ActivityColumns.CadenceUnits) {
              unitsColumn = unitsColumn.cycling + " or " + unitsColumn.running;
            }

            columnLabel += unitsColumn ? " (" + unitsColumn + ")" : "";
          }
        }

        return {
          label: columnLabel,
          default: "",
          value: (activity: Activity) => {
            let cellValue;

            switch (column.type) {
              case ActivityColumns.ColumnType.DATE:
                cellValue = moment(activity.startTime).toISOString();
                break;

              case ActivityColumns.ColumnType.TEXT:
                cellValue = column.print(activity, column.path);
                break;

              case ActivityColumns.ColumnType.ACTIVITY_LINK:
                cellValue = column.print(activity, column.path);
                break;

              case ActivityColumns.ColumnType.NUMBER:
                const numberColumn = column as NumberColumn;
                cellValue = numberColumn.print(
                  activity,
                  null,
                  numberColumn.precision,
                  numberColumn.factor,
                  this.isImperial,
                  numberColumn.imperialFactor,
                  numberColumn.path
                );
                break;

              case ActivityColumns.ColumnType.ATHLETE_SETTINGS:
                cellValue = ActivitiesComponent.printAthleteSettings(activity, this.isImperial);
                break;

              default:
                cellValue = "";
                break;
            }

            return cellValue;
          }
        };
      });

      const parser = new Json2CsvParser({ fields: fields });
      const csvData = parser.parse(this.dataSource.filteredData);
      const blob = new Blob([csvData], { type: "application/csv; charset=utf-16" });
      const filename = "elevate_activities_export." + moment().format("Y.M.D-H.mm.ss") + ".csv";
      saveAs(blob, filename);
    } catch (err) {
      this.logger.error(err);
    }
  }

  public startCase(sport: string): string {
    return _.startCase(sport);
  }

  public ngOnDestroy(): void {
    this.historyChangesSub.unsubscribe();
  }
}
