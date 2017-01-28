class YearProgressController {

    public static $inject = ['$scope', 'ChromeStorageService', '$mdDialog', '$window'];

    constructor($scope: any, chromeStorageService: ChromeStorageService, $mdDialog: IDialogService, $window: IWindowService) {

    }

}

app.controller("YearProgressController", YearProgressController);