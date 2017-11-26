import { Component, OnInit } from '@angular/core';
import { FitnessService, IDayFitnessTrend } from "../services/fitness/fitness.service";
import * as _ from "lodash";
import * as moment from "moment";

interface GraphPoint {
	date: string;
	value: number
}

// interface GraphLine {
//
// }


@Component({
	selector: 'app-fitness-trend',
	templateUrl: './fitness-trend.component.html',
	styleUrls: ['./fitness-trend.component.scss']
})
export class FitnessTrendComponent implements OnInit {

	constructor(private fitnessService: FitnessService) {
	}

	public ngOnInit() {


		// Generate graph data
		this.fitnessService.computeTrend(null,
			null,
			null,
			null).then((fitnessTrend: IDayFitnessTrend[]) => {


			fitnessTrend = _.filter(fitnessTrend, (activity) => {
				const activityDate = moment(activity.timestamp);
				const a = moment("20170601", "YYYYMMDD");
				const b = moment("20171215", "YYYYMMDD");
				return activityDate.isBetween(a, b);
			});

			console.warn(fitnessTrend);

			let fatigueLine: GraphPoint[] = [];
			let fitnessLine: GraphPoint[] = [];
			let formLine: GraphPoint[] = [];
			let fitnessTrendLines: GraphPoint[][] = [];

			_.forEach(fitnessTrend, (dayFitnessTrend: IDayFitnessTrend) => {

				fatigueLine.push({
					date: dayFitnessTrend.date,
					value: dayFitnessTrend.atl
				});

				fitnessLine.push({
					date: dayFitnessTrend.date,
					value: dayFitnessTrend.ctl
				});

				formLine.push({
					date: dayFitnessTrend.date,
					value: dayFitnessTrend.tsb
				});
			});

			fitnessTrendLines.push(MG.convert.date(fatigueLine, 'date'));
			fitnessTrendLines.push(MG.convert.date(fitnessLine, 'date'));
			fitnessTrendLines.push(MG.convert.date(formLine, 'date'));


			// console.debug(fitnessTrendLines);

			/*for (var i = 0; i < data.length; i++) {
				data[i] = MG.convert.date(data[i], 'date');
			}
			*/

			setTimeout(() => {
				// data = MG.convert.date(data, 'date');
				MG.data_graphic({
					data: fitnessTrendLines,
					full_width: true,
					height: 500,
					right: 40,
					baselines: [{value: 0}],
					target: '#fitnessTrendGraph',
					x_accessor: 'date',
					y_accessor: 'value',
					legend: ['Line 1', 'Line 2', 'Line 3'],
					legend_target: '.legend'
				});

			});
		});


	}

}
