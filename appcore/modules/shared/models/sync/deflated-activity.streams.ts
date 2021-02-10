export class DeflatedActivityStreams {
  constructor(public readonly activityId: string, public readonly deflatedStreams: string) {
    this.activityId = activityId;
    this.deflatedStreams = deflatedStreams;
  }
}
