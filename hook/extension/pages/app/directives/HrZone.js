app.directive('hrZone', function() {

    var linkFunction = function($scope, element, attrs) {
        $scope.printableHrZoneId = parseInt($scope.hrZoneId) + 1;
    };

    var controllerFunction = function($scope) {

        $scope.avoidInputKeyEdit = function(evt) { // TODO Externalize has service
            if (evt.keyCode !== 38 && evt.keyCode !== 40) { // If key up/down press then return to don't block event progation
                evt.preventDefault();
            }
        };

        $scope.$watch('hrZone', function(newHrZone, oldHrZone) {
            // Notify parent scope when a zone has changed
            $scope.$parent.onZoneChange(parseInt($scope.hrZoneId), oldHrZone, newHrZone);

        }, true);
    };

    return {

        templateUrl: 'views/hrZones/hrZone.html',
        scope: {
            hrZoneId: '@hrZoneId',
            hrZone: '=',
            previousFromHrr: '@previousFromHrr',
            nextToHrr: '@nextToHrr',
            hrZoneFirst: '@hrZoneFirst',
            hrZoneLast: '@hrZoneLast',
            userMaxHr: '@userMaxHr',
            userRestHr: '@userRestHr'
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
