import _ from "lodash";

export let removeActivityFromArray = (activityId: number, fromArray: Array<any>): Array<any> => {
  const predicate = {
    id: activityId
  } as any;

  return _.without(fromArray, _.find(fromArray, predicate));
};

export let editActivityFromArray = (
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
  a.type = newType;
  a.display_type = newType;
  return fromArray;
};
