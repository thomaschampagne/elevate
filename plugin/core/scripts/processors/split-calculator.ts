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

	// As getBestSplitRanges but ensure result is monotically decreasing
	// So we don't end up with a N + 1 range with best split greater than N
	public getBestSplitRangesMonotonicDecrease(ranges: number[], showProcessTime?: boolean): { range: number, result: number }[] {

		// Create empty array of results ordered by range
		const results = ranges.map(r => ({ range: r, result: 0 })).sort((a, b) => a.range - b.range);

		// Go through results in reverse order
		// Keeping track of the best result in the range above
		let bestAbove = 0;
		for (let i = results.length - 1; i >= 0; --i) {
			// Find the best split for the exact range defined first
			results[i].result = this.getBestSplit(results[i].range);

			// But if the result for the range above was greater, then replace with this
			// This is because we can end up with a N + 1 range with a > average data than N
			// e.g. for data = [900, 0, 900], averaging exact range = 2 gives [450,450], but 3 gives 600
			if (bestAbove > results[i].result) {
				results[i].result = bestAbove;
			} else {
				bestAbove = results[i].result;
			}
		}

		if (showProcessTime) {
			const processTime = performance.now() - this.start;
			console.debug("Processed splits for ranges in " + _.floor(processTime, 4) + " ms.");
		}

		return results;
	}

	// Get best split ranges algorithm that looks at all possible sub-segments to ensure we have the most accurate bests
	public getBestSplitRangesGreedy(ranges: number[], showProcessTime?: boolean): { range: number, result: number }[] {

		// Create empty array of results ordered by range
		const results = ranges.map(r => ({ range: r, result: 0 })).sort((a, b) => a.range - b.range);

		const nDataPoints = this.data.length;
		for (let i = 0; i < nDataPoints; ++i) {
			// Loop through all sub segments start from index i
			let cumulativeData = 0;
			for (let j = i; j < nDataPoints; ++j) {

				cumulativeData += this.data[j];
				const range = j - i + 1;
				const averageData = cumulativeData / range;

				let k = results.length;
				while (k--) {
					// If our current range is more than or equal to our result range
					// It can be a candidate for improvement
					if (range >= results[k].range) {
						const currentBest = results[k].result;
						if (currentBest < averageData) {
							results[k].result = averageData;
						} else {
							break;
						}
					}
				}
			}
		}

		if (showProcessTime) {
			const processTime = performance.now() - this.start;
			console.debug("Processed split greedy search in " + _.floor(processTime, 4) + " ms.");
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
