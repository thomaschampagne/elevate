const GOAL_MARKER_TEXT_WIDTH = 40;


/**
 * Implements per-week/month annual goal tracking.
 *
 * This modifier adds two additional progress bars to the annual goal
 * tracker found in the #progress-goals-v2 element. The bars track monthly
 * and weekly progress towards the overall annual goal.
 */
class GoalsModifier implements IModifier {

    private $element: JQuery;

    /**
     * Construct a new GoalsModifier.
     *
     * The modifier will be bound to the given element.
     *
     * @param $element: A jQuery wrapper around a #progress-goals-v2.
     */
    constructor($element: JQuery) {
        this.$element = $element;
    }

    /**
     * Perform the actual modification.
     *
     * This initiates one or more requests for the current athletes
     * more recent activities. Once the activities have been loaded
     * then the monthy and weekly progress bars are added to each tab
     * within the #progress-goals-v2 element bound to the modifier.
     *
     * If the atheletes activities fail to load then this does nothing.
     */
    public modify = (): void => {
        this.getActivities().then((activities) => {
            this.$element.find('.tab-contents > .tab-content').each(
                (_, tab) => {
                    let $tab = $(tab);
                    let $view = $(tab).find('.js-view');
                    let $edit = $(tab).find('.js-edit');
                    let $barYearly = this.findProgressBar($view);
                    let goal = this.findGoal($edit, 'year');
                    let activityType = $tab.attr('data-sport');
                    activityType =
                        activityType[0].toUpperCase() + activityType.slice(1);
                    let $actual = $barYearly.find('.actual');
                    let actual = parseInt(
                        $actual.text().replace(/[^0-9]/g, ""), 10);
                    if (goal.value !== 0) {
                        if (goal.units === GoalUnit.METRES) {
                            actual = actual * 1000;
                        } else if (goal.units === GoalUnit.YARDS) {
                            actual = actual * 1760;
                        }
                        goal.value = Math.max(goal.value - actual, 0);
                        this.addProgressBarMonthly(
                            $view, activities, activityType, goal);
                        this.addProgressBarWeekly(
                            $view, activities, activityType, goal);
                    }
                    // Add year label last so it doesn't get cloned
                    this.labelProgressBar($barYearly, (new Date()).getFullYear().toString());
                }
            );
        });
    }

    /**
     * Add a progress bar for weekly progress.
     *
     * This adds a progress bar to a given .js-view container. The
     * progress bar will indicate proportional progress towards the
     * annual goal.
     *
     * The weekly target for an activity is determined from the
     * outstanding annual requirement divided by the number of weeks
     * remaining in the year.
     *
     * @param $view: A jQuery wrapper around a .js-view element.
     * @param activities: An array of at least the last months
     *      activities by the current athlete.
     * @param activityType: The `ActivityResource.type` that the
     *      progress bar refers to.
     * @param goal: The current, overall annual goal.
     */
    private addProgressBarWeekly = ($view: JQuery,
                                    activities: ActivityResource[],
                                    activityType: string,
                                    goal: Goal): void => {
        let now = new Date();
        let weekStart = new Date();
        let day = weekStart.getDay() || 7;  // week starting on Monday
        if (day !== 1) {
            weekStart.setHours(-24 * (day - 1));
        }
        weekStart.setHours(0, 0, 0, 0);
        let weekProgress = day / 7;
        let weekNumber = this.weekNumber();
        let weekCount = this.weekCount();
        let weeksRemaining = this.weekCount() - this.weekNumber() + 1;
        let scaledGoal: Goal = {
            value: goal.value / weeksRemaining,
            units: goal.units,
        };
        let actual = this.calculateActual(
            activities, weekStart, activityType, goal.units);
        let bar = this.createProgressBar(
            $view, scaledGoal, actual, weekProgress);
        this.labelProgressBar(bar, "this week");
        $view.append(bar)
    }

    /**
     * Determine the current week number.
     *
     * The first week of the year starts on January the 1st and lasts
     * exactly seven days has a week number of one. The last week of the
     * year has a week number matching the return value of `weekCount`.
     *
     * Note that the final week of the year may not be complete. For
     * example, if the new year started on a Tuesday, then the final
     * week of the preceeding year only has a single day in it.
     */
    private weekNumber = (): number => {
        let today = new Date();
        today.setHours(0, 0, 0, 0);
        let counter = new Date(today.getFullYear(), 0, 1);
        let week = 0;
        while (counter <= today) {
            week++;
            counter.setDate(counter.getDate() + 7);
        }
        return week;
    }

    /**
     * Determine the number of weeks in the current year.
     *
     * A "week" is a seven day period with the first week of the year
     * starting on the first of January.
     */
    private weekCount = (): number => {
        let now = new Date();
        let counter = new Date(now.getFullYear(), 0, 1);
        let newYear = new Date(now.getFullYear() + 1, 0, 1);
        let week = 0;
        while (counter < newYear) {
            week++;
            counter.setDate(counter.getDate() + 7);
        }
        return week;
    }

    /**
     * Add a progress bar for monthly progress.
     *
     * This adds a progress bar to a given .js-view container. The
     * progress bar will indicate proportional progress towards the
     * annual goal.
     *
     * The monthly target for an activity is determined from the
     * outstanding annual requirement divided by the number of months
     * remaining in the year.
     *
     * @param $view: A jQuery wrapper around a .js-view element.
     * @param activities: An array of at least the last months
     *      activities by the current athlete.
     * @param activityType: The `ActivityResource.type` that the
     *      progress bar refers to.
     * @param goal: The current, overall annual goal.
     */
    private addProgressBarMonthly = ($view: JQuery,
                                     activities: ActivityResource[],
                                     activityType: string,
                                     goal: Goal): void => {
        let now = new Date();
        let monthStart = new Date();
        monthStart.setHours(0, 0, 0, 0);
        monthStart.setDate(1);
        let monthDays = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0  // last day of previous month
        ).getDate();
        let monthProgress = now.getDate() / monthDays;
        let monthsRemaining = 12 - monthStart.getMonth();
        let scaledGoal: Goal = {
            value: goal.value / monthsRemaining,
            units: goal.units,
        };
        let actual = this.calculateActual(
            activities, monthStart, activityType, goal.units);
        let bar = this.createProgressBar(
            $view, scaledGoal, actual, monthProgress);
        this.labelProgressBar(
            bar,
            [
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December',
            ][now.getMonth()]
        );
        $view.append(bar);
    }

    /**
     * Get activities since the start of the current month.
     *
     * This returns a promise which resolves to an array of activity
     * resources. Note that in order to load all activities for the
     * current month, multiple requests may need to be made. In such
     * cases, if *any* of the requests fail then the promise is rejected.
     */
    private getActivities = (): Promise<ActivityResource[]> => {
        let activities: ActivityResource[] = [];
        let monthStart = new Date();
        monthStart.setHours(0, 0, 0, 0);
        monthStart.setDate(1);
        return new Promise<ActivityResource[]>((resolve, reject) => {
            let request = (page: number) => {
                $.ajax({
                    url: `/athlete/training_activities`,
                    type: 'GET',
                    data: {
                        page: page,
                        new_activity_only: false,
                    },
                    dataType: 'json',
                    success: (response: ActivityCollectionPage) => {
                        let monthStartReached = false;
                        activities.push(... response.models);
                        for (let activity of response.models) {
                            // activity.start_date_local_raw is in seconds, monthStart is in ms
                            if (activity.start_date_local_raw*1000 < +monthStart) {
                                monthStartReached = true;
                            }
                        }
                        if (response.models.length === response.perPage
                            && !monthStartReached) {
                            request(page + 1);
                        } else {
                            resolve(activities);
                        }
                    },
                    error: () => {
                        console.log(
                            `Unable to fetch activities since ${monthStart}`);
                        reject();
                    },
                });
            };
            request(1);
        });
    }

    /**
     * Calculate the athletes actual activity.
     *
     * This calculates the current atheletes actual activity since a given
     * time in the paste. Only activities that match the given type are
     * considered.
     *
     * Both the actual, total distance or moving time can be calculated
     * based on the requested units.
     *
     * @param activities: An array of the athelete's activities.
     * @param since: The chronological cut-off point for activities.
     * @param type: The `ActivityResource.type` to calculate total
     *       activity for.
     * @param units: The units to return the actual activity in.
     */
    private calculateActual = (activities: ActivityResource[],
                               since: Date,
                               type: string,
                               units: GoalUnit): number => {
        let actual = 0;
        for (let activity of activities) {
            if (activity.start_date_local_raw < +since / 1000) {
                break;
            }
            if (activity.type === type) {
                if (units === GoalUnit.METRES) {
                    actual = actual + activity.distance_raw;
                } else if (units === GoalUnit.YARDS) {
                    actual = actual + (activity.distance_raw * 1.09361);
                } else if (units === GoalUnit.HOURS) {
                    actual = actual + (activity.moving_time_raw / 3600);
                }
            }
        }
        return actual;
    }

    /**
     * Find current goal by inspecting a .js-edit element.
     *
     * This takes the .js-edit element for a given tab and a goal period
     * and returns the corresponding goal value and units. The goal period
     * may be either 'year' or 'week'.
     *
     * @param $view: A jQuery wrapper around a .js-edit element.
     * @param period: Which period to find the goal for.
     *
     * @returns The configured goal, the value of which will be zero
     *      if no goal has been set.
     */
    private findGoal = ($edit: JQuery, period: GoalPeriod): Goal => {
        let goalString = $edit.find(
            `[data-period="${period}"] .goal-value`).val();
        let goalNumeric = parseInt(goalString, 10);
        if (!goalNumeric) {
            goalNumeric = 0;
        }
        let $units = $edit.find(`[data-period="${period}"] .goal-unit`);
        let units = $units.find('button.active').attr('data-type');
        let goalUnits = GoalUnit.UNKNOWN;
        if (units === 'distance') {
            let unitsSymbol = $units.find('button.active').text().trim();
            if (unitsSymbol.charAt(unitsSymbol.length - 1) === "m") {  // Metric
                goalUnits = GoalUnit.METRES;
                if (unitsSymbol === 'km') {
                    goalNumeric = goalNumeric * 1000;
                }
            } else {  // Imperial
                goalUnits = GoalUnit.YARDS;
                if (unitsSymbol === 'mi') {
                    goalNumeric = goalNumeric * 1760;
                }
            }
        } else if (units === 'time') {
            goalUnits = GoalUnit.HOURS;
        }
        return {
            value: goalNumeric,
            units: goalUnits,
        };
    }

    /**
     * Find the firts progress bar in a .js-view element.
     */
    private findProgressBar = ($view: JQuery): JQuery => {
        return $view
            .find('[id$="-yearly-progress-container"]')
            .first()
            ;
    }

    /**
     * Create a new goal tracing progres bar.
     *
     * Specifically, this clones an existing progress bar from the given
     * .js-view element. The progress bar is updated to represent the
     * given goal and actual attainment.
     *
     * The "today" marker's position is controlled by the `progress`
     * parameter. The `progress` represents the proportion of the
     * time that has already passed for the goal. For example, if
     * the progress bar represents a whole day, a `progress` of 0.5
     * would be midday.
     *
     * @param $view: A jQuery wrapped .js-view element.
     * @param goal: The goal to be represented by the bar.
     * @param actual: The actual progress towards the given goal
     *      expressed in the same units as the goal.
     * @param progress: Where to place "today" marker as a fraction of
     *      the total progress bar length.
     *
     * @returns A jQuery wrapper around the new progress bar.
     */
    private createProgressBar = ($view: JQuery,
                                 goal: Goal,
                                 actual: number,
                                 progress: number): JQuery => {
        let $sourceContainer = this.findProgressBar($view);
        let $container = $sourceContainer.clone();
        let $svg = $container.find('.chart-container svg');
        let $tooltip = $container.find('.yearly-goal-tooltip');
        let $tooltipSource = $sourceContainer.find('.yearly-goal-tooltip');
        let formattedGoal = this.formatValue(goal.value, goal.units);
        let formattedActual = this.formatValue(actual, goal.units, false);
        let difference = (goal.value * progress) - actual;
        let formattedDifference = this.formatValue(
            Math.abs(difference), goal.units);
        $container
            .find('.primary-stats')
            .contents()
            .filter(function () {
                return this.nodeType === 3;
            })
            .last()
            .replaceWith(` / ${formattedGoal}`)
        ;
        $container
            .find('.primary-stats .actual')
            .text(formattedActual)
        ;
        if (difference > 0) {
            $tooltip.text(`${formattedDifference} behind pace`);
        } else {
            $tooltip.text(`${formattedDifference} ahead of pace`);
        }
        $svg.find('g').hover(
            () => {
                $tooltip.attr('style', $tooltipSource.attr('style'));
                $tooltip.addClass('yearly-goal-tooltip-visible');
            },
            () => {
                $tooltip.removeClass('yearly-goal-tooltip-visible');
            }
        );
        this.updateProgressBarSVG($svg, goal, actual, progress);
        return $container;
    }

    /**
     * Update the <svg> element of a progress bar.
     *
     * This upates the width of the progress bar fill and the position
     * of the progress marker to reflect the given goal and actual.
     *
     * @param $svg: The jQuery wrapped <svg> element to update.
     * @param goal: The goal to be represented by the <svg> element.
     * @param actual: The actual progress towards the given goal
     *      expressed in the same units as the goal.
     * @param progress: Where to place "today" marker as a fraction of
     *      the total progress bar length.
     */
    private updateProgressBarSVG = ($svg: JQuery,
                                    goal: Goal,
                                    actual: number,
                                    progress: number): void => {
        let $container = $svg.find('rect.progress-bar-container');
        let $fill = $svg.find('rect.progress-bar-fill');
        let $marker = $svg.find('line.progress-marker');
        let $markerText = $svg.find('text');
        let width = parseInt($container.attr('width'), 10);
        if ( actual > goal.value ) {
            $container.attr('width', width * goal.value / actual);
            width = parseInt($container.attr('width'));
        }
        if (goal.value === 0) {
            $fill.attr('width', width);
        } else {
            $fill.attr('width', width * (actual / goal.value));
        }
        if (progress >= 1) {
            progress = 1;
        } else if (progress <= 0) {
            progress = 0;
        }
        let markerX = width * progress;
        $marker
            .attr('x1', markerX)
            .attr('x2', markerX)
        ;
        let markerTextAnchor = 'middle';
        // GOAL_MARKER_TEXT_WIDTH is used as we can't know the actual
        // width until we actually add the <svg> element to the DOM.
        if (width - markerX < GOAL_MARKER_TEXT_WIDTH) {
            markerTextAnchor = 'end';
        } else if (markerX < GOAL_MARKER_TEXT_WIDTH) {
            markerTextAnchor = 'start';
        }
        $markerText
            .attr('x', markerX)
            .attr('text-anchor', markerTextAnchor)
        ;
    }

    /*
     * Add a label to a progress bar.
     *
     * This adds a small label to the progress bar at the top right.
     */
    private labelProgressBar = ($bar: JQuery, label: string): void => {
        let $label = $('<span>');
        $label
            .text(label)
            .css('float', 'right')
            .css('padding-top', '0.4em')
            .css('text-transform', 'uppercase')
            .css('font-size', '0.6em')
        ;
        $bar.find('.primary-stats').append($label);
    }

    /**
     * Format a goal, including units.
     *
     * This formats a given goal to match Strava's native formatting of
     * goals within #progress-goals-v2 elements. Specifically this means
     * that the goal values are rounded and commas added to separate 1000s.
     *
     * @param value: The numeric value to format.
     * @param units: The units to format the value as.
     * @param includeUnits: Whether or not to include the actual units
     *      in the formatted output.
     *
     * @returns The given goal formatted into a string.
     */
    private formatValue = (value: number,
                           units: GoalUnit,
                           includeUnits = true): string => {
        let formattedValue = '';
        let formattedUnits = '';
        if (units === GoalUnit.METRES) {
            formattedUnits = ' km';
            formattedValue = (Math.round(value / 1000)).toLocaleString();
        } else if (units === GoalUnit.YARDS) {
            formattedUnits = ' mi';
            formattedValue = (Math.round(value / 1760)).toLocaleString();
        } else if (units === GoalUnit.HOURS) {
            formattedUnits = 'h';
            formattedValue = Math.round(value).toLocaleString();
        }
        if (!includeUnits) {
            formattedUnits = '';
        }
        return `${formattedValue}${formattedUnits}`;
    }
}


/**
 * Enumeration of possible `Goal` units.
 */
enum GoalUnit {
    UNKNOWN,
    METRES,
    YARDS,
    HOURS,
}


/**
 * Simple interface for representing goals.
 */
interface Goal {
    value: number;
    units: GoalUnit;
}


/**
 * Periods for goals that can be found by inspecting the HTML.
 */
type GoalPeriod = 'week' | 'year';


/**
 * Interface for /athlete/training_activities responses.
 */
interface ActivityCollectionPage {
    models: ActivityResource[];
    page: number;
    perPage: number;
    total: number;
}


/**
 * Partial interface for /athlete/training_activities resources.
 */
interface ActivityResource {
    distance_raw: number;
    moving_time_raw: number;
    long_unit: string;
    start_date_local_raw: number;
    type: string;
}
