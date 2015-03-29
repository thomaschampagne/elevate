var devData = '[{"from":0,"to":2},{"from":2,"to":5},{"from":5,"to":8},{"from":8,"to":10},{"from":10,"to":13},{"from":13,"to":16},{"from":16,"to":19},{"from":19,"to":21},{"from":21,"to":24},{"from":24,"to":27},{"from":27,"to":30},{"from":30,"to":32},{"from":32,"to":35},{"from":35,"to":38},{"from":38,"to":41}]';

app.controller("ZonesSettingsController", ['$scope', 'Notifier', '$timeout', '$location', function($scope, Notifier, $timeout, $location) {


    $scope.zones = angular.fromJson(devData);

    console.warn($scope.zones);

}]);
