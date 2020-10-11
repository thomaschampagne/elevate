export class KalmanFilter {
  private R: number;
  private Q: number;
  private x: number;
  private cov: number;
  private readonly B: number;
  private readonly C: number;
  private readonly A: number;

  /**
   * Create 1-dimensional kalman filter
   * @param options.R Process noise
   * @param options.Q Measurement noise
   * @param options.A State vector
   * @param options.B Control vector
   * @param options.C Measurement vector
   * @return KalmanFilter
   */
  constructor({ R = 1, Q = 1, A = 1, B = 0, C = 1 } = {}) {
    this.R = R; // noise power desirable
    this.Q = Q; // noise power estimated

    this.A = A;
    this.C = C;
    this.B = B;
    this.cov = NaN;
    this.x = NaN; // estimated signal without noise
  }

  /**
   * Filter a new value
   * @param z Measurement
   * @param u Control
   */
  public filter(z, u = 0): number {
    if (isNaN(this.x)) {
      this.x = (1 / this.C) * z;
      this.cov = (1 / this.C) * this.Q * (1 / this.C);
    } else {
      // Compute prediction
      const predX = this.predict(u);
      const predCov = this.uncertainty();

      // Kalman gain
      const K = predCov * this.C * (1 / (this.C * predCov * this.C + this.Q));

      // Correction
      this.x = predX + K * (z - this.C * predX);
      this.cov = predCov - K * this.C * predCov;
    }

    return this.x;
  }

  /**
   * Predict next value
   * @param [u] Control
   */
  public predict(u = 0): number {
    return this.A * this.x + this.B * u;
  }

  /**
   * Return uncertainty of filter
   */
  public uncertainty(): number {
    return this.A * this.cov * this.A + this.R;
  }

  /**
   * Return the last filtered measurement
   */
  public lastMeasurement(): number {
    return this.x;
  }

  /**
   * Set measurement noise Q
   */
  public setMeasurementNoise(noise: number): void {
    this.Q = noise;
  }

  /**
   * Set the process noise R
   */
  public setProcessNoise(noise: number): void {
    this.R = noise;
  }
}
