import _ from "lodash";

export const removeActivityFromArray = (activityId: number, fromArray: Array<any>): Array<any> => {
  const predicate = {
    id: activityId
  } as any;

  return _.without(fromArray, _.find(fromArray, predicate));
};

export const editActivityFromArray = (
  activityId: number,
  fromArray: Array<any>,
  newName: string,
  newType: string
): Array<any> => {
  const predicate = {
    id: activityId
  } as any;

  const a: any = _.find(fromArray, predicate);
  a.name = newName;
  a.sport_type = newType;
  return fromArray;
};
