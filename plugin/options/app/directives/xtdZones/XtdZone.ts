
import {IZone} from "../../../../common/scripts/interfaces/IActivityData";
import {IAvoidInputKeysService} from "../../services/AvoidInputKeysService";

export class XtdZone {

    static $inject: string[] = ["$scope", "AvoidInputKeysService"];

    constructor(public $scope: any, public AvoidInputKeysService: IAvoidInputKeysService) {

        $scope.zoneId = parseInt($scope.zoneId);

        $scope.avoidInputKeyEdit = (evt: KeyboardEvent) => {
            AvoidInputKeysService.apply(evt);
        };

        $scope.$watch("xtdZone", (newZone: IZone, oldZone: IZone) => {
            // Notify parent scope when a zone has changed
            $scope.$parent.onZoneChange(parseInt($scope.zoneId), oldZone, newZone);
        }, true);

        $scope.removeZone = ($event: Event) => {
            $scope.$parent.removeZone($event, parseInt($scope.zoneId));
        };
    }
}

export let xtdZone = [() => {

    return {
        scope: {
            zoneId: "@zoneId",
            xtdZone: "=",
            xtdDataSelected: "=",
            previousFrom: "@previousFrom",
            nextTo: "@nextTo",
            xtdZoneFirst: "@xtdZoneFirst",
            xtdZoneLast: "@xtdZoneLast",
        },
        controller: XtdZone,
        templateUrl: "directives/xtdZones/templates/xtdZone.html",
    } as any;

}];
