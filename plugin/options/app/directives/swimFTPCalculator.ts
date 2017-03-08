interface ISwimCalculationMethod {
    active: boolean;
    name: string;
    params: Array<{hint: string, value: number}>;
    formula: Function;
}

interface IScopeSwimFTPCalculator extends IScope {
    calculationMethods: Array<ISwimCalculationMethod>;
    methodChanged: (selectedMethod: ISwimCalculationMethod) => void;
    userSwimFtp: number;
    onMethodSelected: Function;
}

class SwimFTPCalculator {

    public static $inject: string[] = ['$scope'];

    public static convertMPerMinToTimePer100m(userSwimFTP: number): string {
        return (!userSwimFTP || userSwimFTP <= 0) ? '' : moment(((1 / userSwimFTP) * 60 * 100) * 1000).format('mm:ss');
    }

    constructor(public $scope: IScopeSwimFTPCalculator) {

        $scope.calculationMethods = [{
            active: false,
            name: '60 minutes swimming FTP test (recommended)',
            params: [{
                hint: 'Swim as far as possible during 60 minutes and enter distance performed in meters (ex: 1800 meters)',
                value: null
            }],
            formula: (params: Array<{hint: string, value: number}>) => {
                return params[0].value / 60;
            }
        }, {
            active: false,
            name: '30 minutes swimming FTP test',
            params: [{
                hint: 'Swim as far as possible during 30 minutes and enter distance performed in meters (ex: 950 meters)',
                value: null
            }],
            formula: (params: Array<{hint: string, value: number}>) => {
                return (params[0].value / 30) - ((2 * params[0].value / 30 ) * 0.025); // (distance(m) / 30) - ( (2 * distance(m) / 30 ) * 0.025)
            }
        }, {
            active: false,
            name: 'Critical velocity test session: (1) 200m swim test. (2) Rest. (3) 400m swim test',
            params: [{
                hint: 'Swim as fast as possible on 200 meters. Enter time performed in seconds (ex: 210 seconds)',
                value: null
            }, {
                hint: 'After a rest (same session), swim as fast as possible on 400 meters. Enter time performed in seconds (ex: 590 seconds)',
                value: null
            }],
            formula: (params: Array<{hint: string, value: number}>) => {
                return ((400 - 200) / ((params[1].value - params[0].value) / 60)); // (400m – 200m) / (400mTimeInMinutes - 200mTimeInMinutes)
            }
        }];

        $scope.methodChanged = (selectedMethod: ISwimCalculationMethod) => {

            // Make all other method inactive
            let othersMethods = _.reject($scope.calculationMethods, (method: any) => {
                return method.name === selectedMethod.name;
            });

            _.each(othersMethods, (method: any) => {
                method.active = false;
            });

            let userSwimFtp = selectedMethod.formula(selectedMethod.params);

            $scope.userSwimFtp = (_.isNumber(userSwimFtp) && userSwimFtp >= 0) ? parseFloat(userSwimFtp.toFixed(2)) : 0;

            if(selectedMethod.active) {
                $scope.onMethodSelected(selectedMethod);
            }
        };
    }
}

app.directive('swimFtpCalculator', [() => {

    return {
        controller: SwimFTPCalculator,
        scope: {
            userSwimFtp: '=',
            onMethodSelected: '='
        },
        templateUrl: 'directives/templates/swimFTPCalculator.html'
    };
}]);