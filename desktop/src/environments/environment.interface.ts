export const EnvironmentToken = "ENVIRONMENT_TOKEN";

export interface Environment {
  readonly debugActivityFiles: { enabled: boolean; endpoint: string };
  readonly allowActivitiesOverLapping: boolean;
}
