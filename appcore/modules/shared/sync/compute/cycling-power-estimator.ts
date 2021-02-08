/**
 * Calculator inspired from
 * https://www.gribble.org/cycling/power_v_speed.html
 */
export namespace CyclingPower {
  export class Estimator {
    public static readonly DEFAULT_PARAMS: Params = {
      riderWeightKg: 75,
      bikeWeightKg: 8,
      frontalAreaSquareMeters: 0.509,
      cdDragFactor: 0.63,
      driveTrainLoss: 2,
      crrRollingResistanceFactor: 0.005,
      rhoAirDensity: 1.22601,
      headWindSpeed: 0,
      gradePercentage: 0
    };

    /**
     * Get power estimation from speed and CyclingPower.Params
     */
    public static calc(velocity: number, params: Partial<CyclingPower.Params>): number {
      params = Object.assign(Estimator.DEFAULT_PARAMS, params);

      // Calculate the forces on the rider.
      const forces = this.estimateForces(velocity, params);
      const totalForce = forces.FGravity + forces.FRolling + forces.FDrag;

      // Calculate necessary wheelPower.
      const wheelPower = totalForce * ((velocity * 1000.0) / 3600.0);

      // Calculate necessary legPower. Note: if wheelPower is negative,
      // i.e., braking is needed instead of pedaling, then there is
      // no drive train loss.
      let driveTrainFrac = 1.0;
      if (wheelPower > 0.0) {
        driveTrainFrac = driveTrainFrac - params.driveTrainLoss / 100.0;
      }

      const legPower = wheelPower / driveTrainFrac;

      return legPower > 0.0 ? Math.round(legPower * 100) / 100 : 0;
    }

    private static estimateForces(velocity, params) {
      // Calculate FGravity
      const FGravity =
        9.8067 * (params.riderWeightKg + params.bikeWeightKg) * Math.sin(Math.atan(params.gradePercentage / 100.0));

      // Calculate FRolling
      let FRolling =
        9.8067 *
        (params.riderWeightKg + params.bikeWeightKg) *
        Math.cos(Math.atan(params.gradePercentage / 100.0)) *
        params.crrRollingResistanceFactor;
      if (velocity < 0) {
        FRolling *= -1.0;
      }

      // Calculate FDrag
      let FDrag =
        0.5 *
        params.frontalAreaSquareMeters *
        params.cdDragFactor *
        params.rhoAirDensity *
        (((velocity + params.headWindSpeed) * 1000.0) / 3600.0) *
        (((velocity + params.headWindSpeed) * 1000.0) / 3600.0);
      if (velocity + params.headWindSpeed < 0) {
        FDrag *= -1.0;
      }

      return {
        FGravity: FGravity,
        FRolling: FRolling,
        FDrag: FDrag
      };
    }
  }

  export class Params {
    public headWindSpeed: number; // Kph
    public driveTrainLoss: number; // %
    public frontalAreaSquareMeters: number; // m2
    public rhoAirDensity: number; // kg/m3
    public riderWeightKg: number; // Kg
    public bikeWeightKg: number; // Kg
    public cdDragFactor: number;
    public gradePercentage: number; // %
    public crrRollingResistanceFactor: number;
  }
}
