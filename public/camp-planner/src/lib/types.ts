export type ActivityStatus = "planned" | "ready" | "in-progress" | "done";
export type Priority = "low" | "medium" | "high";

export interface Note {
  id: number;
  activityId: number;
  body: string;
  author: string;
  createdAt: string;
}

export interface Activity {
  id: number;
  title: string;
  cabin: string;
  scheduledFor: string;
  status: ActivityStatus;
  priority: Priority;
  host: string;
  details: string;
  createdAt: string;
  notes: Note[];
}

export interface ActivityPayload {
  title: string;
  cabin: string;
  scheduledFor: string;
  priority: Priority;
  host: string;
  details: string;
}
