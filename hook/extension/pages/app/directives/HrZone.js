app.directive('hrZone', function() {

    var linkFunction = function($scope, element, attrs) {
        // console.warn($scope);
        //console.warn(element);
        // console.warn(attrs);
        // $scope.zoneAAA = "dqsdqs";
        /*        $scope.userMaxHr = 209;
                $scope.userRestHr = 56;*/
        /*
                console.warn($scope.userMaxHr);
                console.warn($scope.userRestHr);*/
        // console.warn($scope.hrZone);
    };

    var controllerFunction = function($scope) {

        $scope.$watch('hrZone', function(newHrZone, previousHrZone) {

            // console.debug('zone id:' + $scope.hrZoneId);
            // console.debug(previousHrZone);
            // console.debug(newHrZone);
            $scope.$parent.onZoneChange(parseInt($scope.hrZoneId), previousHrZone, newHrZone);

        }, true);

    };

    return {

        templateUrl: 'views/hrZones/hrZone.html',
        scope: {
            hrZone: "=",
            hrZoneId: "@hrZoneId",
            userMaxHr: "@userMaxHr",
            userRestHr: "@userRestHr"
        },
        controller: controllerFunction,
        link: linkFunction
    };

    /*
    return {
        restrict: 'EA', //E = element, A = attribute, C = class, M = comment         
        scope: {
            //@ reads the attribute value, = provides two-way binding, & works with functions
            title: '@'         },
        template: '<div>{{ myVal }}</div>',
        templateUrl: 'mytemplate.html',
        controller: controllerFunction, //Embed a custom controller in the directive
        link: function ($scope, element, attrs) { } //DOM manipulation
    }*/

    /*return {
        link: function($scope, element, attrs) {
            element.bind('click', function() {
                element.html('You clicked me!');
            });
            element.bind('mouseenter', function() {
                element.css('background-color', 'red');
            });
            element.bind('mouseleave', function() {
                element.css('background-color', 'white');
            });
        }
    };*/
});
