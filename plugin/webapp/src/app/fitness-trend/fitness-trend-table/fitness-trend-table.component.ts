import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";
import { FitnessService } from "../shared/service/fitness.service";
import { IUserSettings } from "../../../../../common/scripts/interfaces/IUserSettings";
import { DayFitnessTrendModel } from "../shared/models/day-fitness-trend.model";
import { MatPaginator, MatSort, MatTableDataSource } from "@angular/material";
import * as _ from "lodash";
import { FitnessTrendComponent } from "../fitness-trend.component";

@Component({
	selector: 'app-fitness-trend-table',
	templateUrl: './fitness-trend-table.component.html',
	styleUrls: ['./fitness-trend-table.component.scss']
})
export class FitnessTrendTableComponent implements OnInit, AfterViewInit {

	public readonly isSwimEnabled: boolean = true;
	public readonly isPowerMeterEnabled: boolean = true;

	@ViewChild(MatPaginator)
	public matPaginator: MatPaginator;

	@ViewChild(MatSort)
	public matSort: MatSort;

	public cyclingFtp: number = null;
	public swimFtp: number = null;
	public displayedColumns: string[];
	public dataSource: MatTableDataSource<DayFitnessTrendModel>;

	constructor(private userSettingsService: UserSettingsService,
				private fitnessService: FitnessService) {
	}

	public ngOnInit(): void {

		this.dataSource = new MatTableDataSource<DayFitnessTrendModel>();

		this.dataSource.sortingDataAccessor = (dayFitnessTrendModel: DayFitnessTrendModel, sortHeaderId: string) => {
			switch (sortHeaderId) {
				case 'date':
					return dayFitnessTrendModel.timestamp;

				case 'type':
					return dayFitnessTrendModel.printTypes();

				case 'activities':
					return dayFitnessTrendModel.printActivities();

				case 'trimpScore':
					return dayFitnessTrendModel.trimpScore;

				case 'powerStressScore':
					return dayFitnessTrendModel.powerStressScore;

				case 'swimStressScore':
					return dayFitnessTrendModel.swimStressScore;

				case 'finalStressScore':
					return dayFitnessTrendModel.finalStressScore;

				case 'ctl':
					return dayFitnessTrendModel.ctl;

				case 'atl':
					return dayFitnessTrendModel.atl;

				case 'tsb':
					return dayFitnessTrendModel.tsb;

				default:
					throw new Error("sortHeaderId '" + sortHeaderId + "' is not listed");
			}
		};

		this.displayedColumns = ['date', 'type', 'activities', 'trimpScore', 'powerStressScore', 'swimStressScore', 'finalStressScore', 'ctl', 'atl', 'tsb'];

		this.userSettingsService.fetch().then((userSettings: IUserSettings) => {

			this.cyclingFtp = userSettings.userFTP;
			this.swimFtp = userSettings.userSwimFTP;

			return this.fitnessService.computeTrend(this.isPowerMeterEnabled, this.cyclingFtp, this.isSwimEnabled, this.swimFtp);

		}).then((fitnessTrendModels: DayFitnessTrendModel[]) => {

			// Remove preview days
			fitnessTrendModels = _.filter(fitnessTrendModels, {
				previewDay: false,
			});

			// Sort by
			fitnessTrendModels = _.sortBy(fitnessTrendModels, (dayFitnessTrendModel: DayFitnessTrendModel) => {
				return dayFitnessTrendModel.timestamp * -1;
			});

			this.dataSource.data = fitnessTrendModels;

		}, error => {

			console.error(error);

		});
	}

	public applyFilter(filterValue: string): void {
		filterValue = filterValue.trim(); // Remove whitespace
		filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
		this.dataSource.filter = filterValue;
	}

	public ngAfterViewInit(): void {
		this.dataSource.paginator = this.matPaginator;
		this.dataSource.sort = this.matSort;
	}

	public onOpenActivities(ids: number[]): void {
		FitnessTrendComponent.openActivities(ids);
	}

}
