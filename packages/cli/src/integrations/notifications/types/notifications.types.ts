export type NotificationOutcome = "done" | "canceled" | "failed";

export type {
	HumanReviewRequiredNotificationServerRequest,
	NotificationEmailPayload,
	NotificationServerRequest,
	TaskOutcomeNotificationServerRequest,
} from "../../../features/server/types/notifications.types";
