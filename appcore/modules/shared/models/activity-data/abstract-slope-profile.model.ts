export abstract class AbstractSlopeProfile {
  constructor(public down: number[] = [], public flat: number[] = [], public up: number[] = []) {}
}

export class SlopeProfileDurations extends AbstractSlopeProfile {}

export class SlopeProfileDistances extends AbstractSlopeProfile {}

export class SlopeProfileSpeeds extends AbstractSlopeProfile {}

export class SlopeProfileCadences extends AbstractSlopeProfile {}
