import * as _ from "lodash";

export let removeActivityFromArray = (activityId: number, fromArray: Array<any>): Array<any> => {
    return _.without(fromArray, _.find(fromArray, {
        id: activityId
    }));
};

export let editActivityFromArray = (activityId: number, fromArray: Array<any>, newName: string, newType: string): Array<any> => {
    let a: any = _.find(fromArray, {
        id: activityId
    });
    a.name = newName;
    a.type = newType;
    a.display_type = newType;
    return fromArray;
};