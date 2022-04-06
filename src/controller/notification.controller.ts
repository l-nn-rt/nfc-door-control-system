import {Request, Response} from 'express';
import webpush, {PushSubscription} from 'web-push';

/**
 * Controls web push notifications and manages web push notification subscribers
 *
 * @author Lennart Rak
 * @version 1.0
 */
export class NotificationController {
    private static readonly publicKey =
        'BM_zJWwukVPA6D0u10ZpbAXyve4_YvoUwrKEZOg29edIYMI6NDO8F8NW0E9tMd4nalthN1C8Q0avcql1bmgjl94';
    private static readonly privateKey = 'w6yHAzjdG47vKZ7Sn2apxs0OqnL5pzrbUXKXDL9DBhw';

    private readonly subscriptions: Array<PushSubscription>;

    /**
     * Creates new {@link NotificationController} object
     */
    public constructor() {
        this.subscriptions = [];
        webpush.setVapidDetails(
            'mailto:test@test.com',
            NotificationController.publicKey,
            NotificationController.privateKey
        );
    }

    /**
     * Subscribes sender to web push notifications
     *
     * @param request the request object from the API call.
     * Requires body.endpoint, body.keys, body.keys.p256dh, body.keys.auth
     * @param response the response object for the API call
     */
    public async subscribe(request: Request, response: Response): Promise<void> {
        const newSubscription = request.body as PushSubscription;

        if (!this.subscriptions.map((subscription) => {
            return subscription.endpoint
        })
            .includes(newSubscription.endpoint)) {
            this.subscriptions.push(newSubscription);
            response.status(201).json(newSubscription);
        }
    }

    /**
     * Sends a new web push notification to all subscribers
     *
     * @param title the title text of the notification
     * @param body the body text of the notification
     */
    public async sendNotification(title: string, body: string): Promise<void> {
        const notification = {
            "notification": {
                "title": title,
                "body": body,
                "icon": "assets/icons/icon.png",
                "badge": "assets/icons/icon-only lock.png",
                "vibrate": [500, 50, 2],
                "data": {
                    "dateOfArrival": Date.now(),
                    "primaryKey": 1,
                    "onActionClick": {
                        "default": {"operation": "focusLastFocusedOrOpen"}
                    }
                },
            }
        };

        this.subscriptions.forEach((subscription) => {
            webpush.sendNotification(subscription, JSON.stringify(notification)).catch((error) => {
                //console.log(error);
            });
        });
    }
}
