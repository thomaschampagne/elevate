import * as _ from "lodash";

export class SplitCalculator {

	public scale: number[];
	public data: number[];
	public maxScaleGapThreshold: number;
	public start: number;

	constructor(scale: number[], data: number[], maxScaleGapThreshold?: number) {
		this.scale = scale;
		this.data = data;
		this.maxScaleGapThreshold = maxScaleGapThreshold;
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

				if (_.isNumber(this.maxScaleGapThreshold) && nextScaleDiff > this.maxScaleGapThreshold) {
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

	public getBestSplit(scaleRange: number): number {

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

		return (maxSumFound / scaleRange);
	}

	public getBestSplitRanges(ranges: number[]): { range: number, result: number }[] {

		const results: { range: number, result: number }[] = [];

		_.forEach(ranges, (range: number) => {
			results.push({
				range: range,
				result: this.getBestSplit(range)
			});
		});

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
