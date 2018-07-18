import * as _ from "lodash";

export class SplitCalculator {

	public static readonly GAP_THRESHOLD: number = 3000;

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

				const nextScaleDiff = nextScaleValue - scaleValue;

				if (nextScaleDiff < 0) {
					throw new Error("Scale should have gaps >= 0");
				}

				if (nextScaleDiff > SplitCalculator.GAP_THRESHOLD) {
					throw new Error("Scale has a too importants gap. Cannot normalize scale");
				}


				if (nextScaleDiff > 1) { // Is next scale not linear normalized (+1) with current scale?
					const linearFunction = this.getLinearFunction(this.data[index + 1], this.data[index], nextScaleValue, scaleValue);
					let missingScaleValue = scaleValue + 1;

					while (missingScaleValue < nextScaleValue) {
						interpolatedData.push(linearFunction(missingScaleValue));
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

		let maxSumFound: number;
		let currentMaxSum: number;

		if (scaleRange > 1) {

			let index = 0;
			currentMaxSum = _.sum(this.data.slice(index, scaleRange));
			maxSumFound = currentMaxSum;

			while (this.scale[scaleRange + index]) {
				currentMaxSum = currentMaxSum + this.data[scaleRange + index] - this.data[index];
				if (maxSumFound < currentMaxSum) {
					maxSumFound = currentMaxSum;
				}
				index++;
			}

		} else {
			maxSumFound = _.max(this.data);
		}

		const bestSplit = (maxSumFound / scaleRange);

		if (showProcessTime) {
			const processTime = performance.now() - this.start;
			console.debug("Processed split of range " + scaleRange + " in " + _.floor(processTime, 4) + " ms.");
		}

		return bestSplit;
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
			console.debug("Processed split in " + _.floor(processTime, 4) + " ms.");
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
