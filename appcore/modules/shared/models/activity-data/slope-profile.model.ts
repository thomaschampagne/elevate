export abstract class SlopeProfile {
  constructor(public down: number[] = [], public flat: number[] = [], public up: number[] = []) {}
}

export class SlopeProfileDurations extends SlopeProfile {}
export class SlopeProfileDistances extends SlopeProfile {}
export class SlopeProfileSpeeds extends SlopeProfile {}
export class SlopeProfileCadences extends SlopeProfile {}
