import * as _ from "lodash";
import { CoreEnv } from "../../config/core-env";
import { VacuumProcessor } from "./VacuumProcessor";
import { LatLonSpherical } from "geodesy";

export interface ISegmentInfo {
	id: number;
	name: string;
	climb_category: number;
	climb_category_desc: number;
	avg_grade: number;
	start_latlng: number[];
	end_latlng: number[];
	elev_difference: number;
	distance: number;
	type: string;
}

export class SegmentProcessor {

	public static cachePrefix = "stravistix_nearbySegments_";

	protected vacuumProcessor: VacuumProcessor;
	protected segmentId: number;

	constructor(vacuumProcessor: VacuumProcessor, segmentId: number) {
		this.vacuumProcessor = vacuumProcessor;
		this.segmentId = segmentId;
	}

	public getNearbySegmentsAround(callback: (segmentsInBounds: ISegmentInfo[]) => void): void {

		// NearbySegmentsAround cached?
		const cacheResult: any = JSON.parse(localStorage.getItem(SegmentProcessor.cachePrefix + this.segmentId));

		if (!_.isNull(cacheResult) && !CoreEnv.debugMode) {
			if (CoreEnv.debugMode) {
				console.log("Using existing nearbySegments cache in non debug mode: " + JSON.stringify(cacheResult));
			}
			callback(cacheResult);
			return;
		}

		// Find search point of segment first
		this.getSegmentAroundSearchPoint((searchPoint: LatLonSpherical) => {

			// Prepare Bounding box 2 km around search point
			const boundingBox: number[] = this.getBoundingBox(searchPoint, 2000);

			// Find segments in bounding box
			this.getSegmentsInBoundingBox(boundingBox, (segmentsInBounds: ISegmentInfo[]) => {

				if (CoreEnv.debugMode) {
					console.log("Creating nearbySegments cache: " + JSON.stringify(segmentsInBounds));
				}
				try {
					localStorage.setItem(SegmentProcessor.cachePrefix + this.segmentId, JSON.stringify(segmentsInBounds)); // Cache the result to local storage
				} catch (err) {
					console.warn(err);
					localStorage.clear();
				}
				callback(segmentsInBounds);
			});
		});
	}

	public getBoundingBox(point: LatLonSpherical, distance: number): number[] {

		return [
			point.destinationPoint(distance, 180).lat,
			point.destinationPoint(distance, -90).lon,
			point.destinationPoint(distance, 0).lat,
			point.destinationPoint(distance, 90).lon,
		];
	}

	public getSegmentsInBoundingBox(boundingBox: number[], callback: (segmentsData: ISegmentInfo[]) => void): void {

		this.vacuumProcessor.getSegmentsFromBounds(
			boundingBox[0] + "," + boundingBox[1],
			boundingBox[2] + "," + boundingBox[3],
			(segmentsData: any) => {

				// Flag cycling/running
				_.forEach(segmentsData.cycling.segments, (segment: any) => {
					segment.type = "cycling";
				});

				_.forEach(segmentsData.running.segments, (segment: any) => {
					segment.type = "running";
				});

				// Merge cycling/running arrays into one entry array
				segmentsData = _.union(segmentsData.cycling.segments, segmentsData.running.segments);

				// Remove watched segment
				segmentsData = _.filter(segmentsData, (segment: any) => {
					return (segment.id !== this.segmentId);
				});

				callback(segmentsData);
			},
		);
	}

	public getSegmentAroundSearchPoint(callback: (latLon: LatLonSpherical) => void) {

		this.vacuumProcessor.getSegmentStream(this.segmentId, (stream: any) => {

			const startPoint: number[] = stream.latlng[0];
			const midPoint: number[] = stream.latlng[(stream.latlng.length / 2).toFixed(0)];
			const endPoint: number[] = stream.latlng[stream.latlng.length - 1];

			const approximateSearchPoint: number[] = [null, null];

			// Add start + end vector
			approximateSearchPoint[0] = (startPoint[0] + endPoint[0]) / 2;
			approximateSearchPoint[1] = (startPoint[1] + endPoint[1]) / 2;

			// Add midPoint
			approximateSearchPoint[0] = (approximateSearchPoint[0] + midPoint[0]) / 2;
			approximateSearchPoint[1] = (approximateSearchPoint[1] + midPoint[1]) / 2;

			callback(new LatLonSpherical(approximateSearchPoint[0], approximateSearchPoint[1]));
		});
	}
}
