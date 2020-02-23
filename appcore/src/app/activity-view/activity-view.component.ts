import { Component, OnInit } from "@angular/core";
import { Location } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { ActivityService } from "../shared/services/activity/activity.service";
import { ActivityStreamsModel, SyncedActivityModel } from "@elevate/shared/models";
import { StreamsService } from "../shared/services/streams/streams.service";
import { LoggerService } from "../shared/services/logging/logger.service";

@Component({
	selector: "app-activity-view",
	templateUrl: "./activity-view.component.html",
	styleUrls: ["./activity-view.component.scss"]
})
export class ActivityViewComponent implements OnInit {

	public syncedActivityModel: SyncedActivityModel;
	public activityStreamsModel: ActivityStreamsModel;

	constructor(public activityService: ActivityService,
				public streamsService: StreamsService,
				public route: ActivatedRoute,
				public location: Location,
				public logger: LoggerService) {
		this.syncedActivityModel = null;
		this.activityStreamsModel = null;
	}

	public ngOnInit(): void {
		const activityId = this.route.snapshot.paramMap.get("id");
		this.activityService.getById(activityId).then(syncedActivityModel => {
			this.syncedActivityModel = syncedActivityModel;
			this.logger.info("syncedActivityModel", syncedActivityModel);
		});

		this.streamsService.getById(activityId).then(compressedStreamModel => {
			this.activityStreamsModel = (compressedStreamModel && compressedStreamModel.data) ? ActivityStreamsModel.deflate(compressedStreamModel.data) : null;
			this.logger.info("activityStreamsModel", this.activityStreamsModel);
		});
	}

	public onBack(): void {
		this.location.back();
	}
}
