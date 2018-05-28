export class LowPassFilter {

	private _bufferMaxSize: number;
	private _buffer: number[];
	private _smoothing: number;

	constructor(smoothing?: number) {
		this._smoothing = smoothing || 0.5; // must be smaller than 1
		this._buffer = []; // FIFO queue
		this._bufferMaxSize = 10;
	}

	/**
	 * Init buffer with array of values
	 * @param {number[]} values
	 * @returns {number[]}
	 */
	public init(values: number[]): number[] {
		for (let i = 0; i < values.length; i++) {
			this.__push(values[i]);
		}
		return this._buffer;
	}

	/**
	 * Add new value to buffer (FIFO queue)
	 * @param {number} value
	 * @returns {number}
	 * @private
	 */
	public __push(value: number): number {
		const removed = (this._buffer.length === this._bufferMaxSize) ? this._buffer.shift() : 0;
		this._buffer.push(value);
		return removed;
	}

	/**
	 * Smooth value from stream
	 * @param {number} nextValue
	 * @returns {number}
	 */
	public next(nextValue: number): number {
		const self = this;
		// push new value to the end, and remove oldest one
		const removed = this.__push(nextValue);
		// smooth value using all values from buffer
		const result = this._buffer.reduce((last, current) => {
			return self._smoothing * current + (1 - self._smoothing) * last;
		}, removed);
		// replace smoothed value
		this._buffer[this._buffer.length - 1] = result;
		return result;
	}

	/**
	 * Smooth array of values
	 * @param {number[]} values
	 * @returns {number[]}
	 */
	public smoothArray(values: number[]): number[] {
		let value = values[0];
		for (let i = 1; i < values.length; i++) {
			const currentValue = values[i];
			value += (currentValue - value) * this._smoothing;
			values[i] = Math.round(value);
		}
		return values;
	}

	public adaptiveSmoothArray(values: number[], scale: number[],
							   positiveVariationTrigger?: number, negativeVariationTrigger?: number): number[] {

		let value = values[0];

		for (let i = 1; i < values.length; i++) {

			const deltaValue = (values[i] - values[i - 1]);
			const deltaScale = (scale[i] - scale[i - 1]);
			const variation = deltaValue / deltaScale;

			if (positiveVariationTrigger && variation >= 0 && Math.abs(variation) >= positiveVariationTrigger) {

				value += (values[i] - value) * this._smoothing;

			} else if (negativeVariationTrigger && variation < 0 && Math.abs(variation) >= negativeVariationTrigger) {

				value += (values[i] - value) * this._smoothing;

			} else {
				value = values[i];
			}

			values[i] = Math.round(value);
		}

		return values;
	}

	get bufferMaxSize(): number {
		return this._bufferMaxSize;
	}

	set bufferMaxSize(value: number) {
		this._bufferMaxSize = value;
	}

	get buffer(): number[] {
		return this._buffer;
	}

	set buffer(value: number[]) {
		this._buffer = value;
	}

	get smoothing(): number {
		return this._smoothing;
	}

	set smoothing(value: number) {
		this._smoothing = value;
	}
}
