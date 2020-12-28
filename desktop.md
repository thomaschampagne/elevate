### How to recalculate stats on my activities?

Click the _[3-dots]_ button in top right and corner, then _Advanced menu_ > _Recalculate stats on all activities_.

[](id:calculate-compute-history-activity-activities)

### Why 1st Strava sync takes so much time?

When syncing the Strava connector you probably got the following message: 

**_"Strava wants you to slow down...🐌 Resuming sync in X seconds..."_**.

This behavior is not an issue. This is a call limitation set up by Strava on their servers. The default Strava rate limit allows **100 requests every 15 minutes** and **1000 requests per day**. [More info here](https://developers.strava.com/docs/rate-limits/)

This means that your 1st Strava sync can take many hours to finish. Upcoming syncs with few activities on a daily or weekly basis will be instantaneous.

**💡 Tip: You can speed up your 1st Strava sync through the _"How to speed up the 1st Strava sync?"_ helper on this page.**

[](id:strava-connector-slow-first-sync)

### How to speed up the 1st Strava sync?

The 1st sync can take hours to complete if you have a large history (Enter _"id:strava-connector-slow-first-sync"_ in the help search bar for more info). To bypass this, here is what you can do:

1. First [request a download of your activities **(in step 2)**](https://www.strava.com/athlete/delete_your_account).

1. Unzip the downloaded archive to a location of your choice.

1. Using the **File connector**, select and sync the folder _"activities"_.

1. Then, on the **Strava connector**, click _Configure_ and **tick** the option _**Override existing activities names and types with those fetched from Strava**_.

1. Sync now the **Strava connector** with _Sync all activities_ button.
Only the activities names and types previously synced by the file connector will be updated. Every others and "heavy" network calls to Strava will be avoided.

And voilà 😉! Your 1st Strava sync has been done at speed of light. You can now use the Strava connector on your regular daily or weekly basis using the _Sync new activities_ button.

[](id:strava-connector-faster-first-sync)
