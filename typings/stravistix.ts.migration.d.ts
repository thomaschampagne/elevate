/*

 // Install new typings:
 typings search xxxxx
 typings install dt~XXXXXX --global --save


 // Rename JS to TS
 for f in *.js; do
 mv -- "$f" "${f%.js}.ts"
 done

 // Find variable without type
 .*let\s\w+\s=
 .*var\s\w+\s=

 // Find variable without type ANY !! waring on this !
 .*var\s\w+\s:\sany\s=

 var (.*) = AbstractDataView\.extend\(function\(base\) \{
 >
 class $1 extends AbstractDataView {

 // Find JS functions
 \w:\sfunction((.*))\s+\{

 */

// TMP TypeScript declaration
//
// declare class AthleteStatsModifier {
//     constructor(a: any, b: any);
//
//     modify(): Function;
// }

///<reference path="d3.d.ts"/>

declare class ActivitiesSummaryModifier {
    constructor();

    modify(): Function;
}

// declare class ActivityBikeOdoModifier {
//     constructor(a: any, b: any);
//
//     modify(): Function;
// }
declare class ActivitySegmentTimeComparisonModifier {
    constructor(a: any, b: any, c: any, d: any);

    modify(): Function;
}

declare class ActivityBestSplitsModifier {
    constructor(a: any, b: any, c: any, d: any, e: any, f: any);

    modify(): Function;
}



// declare class GoogleMapsModifier {
//     constructor(a: any, b: any, c: any);
//
//     modify(): Function;
// }


///
/*
 declare abstract class AbstractDataView {

 constructor();
 render: Function;
 getContent: Function;
 setAppResources: Function;
 setIsAuthorOfViewedActivity: Function;
 setActivityType: Function;
 setIsSegmentEffortView: Function;
 displayGraph: Function;
 }*/
/*
 declare class FeaturedDataView extends AbstractDataView{
 public render(): void
 constructor();
 constructor(a: any, b: any);
 constructor(a: any, b: any, c: any);

 }
 declare class HeartRateDataView extends AbstractDataView{
 public render(): void
 constructor();
 constructor(a: any, b: any, c: any);

 }

 declare class SpeedDataView extends AbstractDataView {
 public render(): void
 constructor(a: any, b: any);
 }
 declare class PowerDataView extends AbstractDataView {
 public render(): void
 constructor(a: any, b: any);
 }
 declare class CyclingCadenceDataView extends AbstractDataView {
 public render(): void
 constructor(a: any, b: any);
 }
 declare class CyclingGradeDataView extends AbstractDataView {
 public render(): void
 constructor(a: any, b: any);
 }
 declare class ElevationDataView extends AbstractDataView {
 public render(): void
 constructor(a: any, b: any);
 }
 declare class AscentSpeedDataView extends AbstractDataView {
 public render(): void
 constructor(a: any, b: any);
 }

 declare class PaceDataView extends AbstractDataView {
 public render(): void
 constructor(a: any, b: any);
 }
 declare class RunningCadenceDataView extends AbstractDataView {
 public render(): void
 constructor(a: any, b: any, c: any);
 }
 declare class RunningGradeDataView extends AbstractDataView {
 public render(): void
 constructor(a: any, b: any);
 }

 */
