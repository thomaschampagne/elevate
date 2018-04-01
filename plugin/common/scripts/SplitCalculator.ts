import * as _ from "lodash";

export class SplitCalculator {

	public scale: number[];
	public data: number[];
	public start: number;

	constructor(scale: number[], data: number[]) {
		this.scale = scale;
		this.data = data;
		this.start = performance.now();
		this.normalize();
	}

	public normalize(): void {

		const normalizedScale: number[] = [];
		const interpolatedData: number[] = [];

		_.forEach(this.scale, (scaleValue: number, index: number, scale: number[]) => {

			interpolatedData.push(_.isNumber(this.data[index]) ? this.data[index] : 0);
			normalizedScale.push(scaleValue);
			const nextScaleValue = scale[index + 1];

			if (_.isNumber(nextScaleValue)) {

				// Is next scale not linear normalized (+1) with current scale?
				if (nextScaleValue !== (scaleValue + 1)) {

					const interpolize = this.getLinearFunction(this.data[index + 1], this.data[index], nextScaleValue, scaleValue);
					let missingScaleValue = scaleValue + 1;

					while (missingScaleValue < nextScaleValue) {
						interpolatedData.push(interpolize(missingScaleValue));
						normalizedScale.push(missingScaleValue);
						missingScaleValue++;
					}

				}
			}
		});

		this.scale = normalizedScale;
		this.data = interpolatedData;
	}

	public getBestSplit(scaleRange: number, showProcessTime?: boolean): number {

		if (scaleRange > this.scale.length) {
			throw new Error("Requested scaleRange of " + scaleRange + " is greater than scale range length of " + this.scale.length + ".");
		}
		let currentMaxAverage: number = null;

		if (scaleRange > 1) {

			const seekToMaxRange = this.scale.length - scaleRange;

			for (let i: number = 0; i <= seekToMaxRange; i++) {

				const averageInRange = _.mean(this.data.slice(i, scaleRange + i));

				if (!currentMaxAverage || currentMaxAverage < averageInRange) {
					currentMaxAverage = averageInRange;
				}
			}

		} else {
			currentMaxAverage = _.max(this.data);
		}

		if (showProcessTime) {
			const processTime = performance.now() - this.start;
			console.log("Processed split in " + _.floor(processTime, 4) + " ms.");
		}

		return currentMaxAverage;
	}

	public getBestSplitRanges(ranges: number[], showProcessTime?: boolean): { range: number, result: number }[] {

		const results: { range: number, result: number }[] = [];

		_.forEach(ranges, (range: number) => {
			results.push({
				range: range,
				result: this.getBestSplit(range)
			});
		});

		if (showProcessTime) {
			const processTime = performance.now() - this.start;
			console.log("Processed split in " + _.floor(processTime, 4) + " ms.");
		}

		return results;
	}

	public getLinearFunction(y1: number, y0: number, x1: number, x0: number): (value: number) => number {
		const a: number = (y1 - y0) / (x1 - x0);
		const b: number = y0 - a * x0;
		return (value: number) => {
			return _.floor(a * value + b, 4);
		};
	}
}
