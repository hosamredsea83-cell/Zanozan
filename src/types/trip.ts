import type { Activity, ActivityMediaItem, ActivityStatus, Waypoint } from './activity';

export type TripStatus = ActivityStatus;
export type TripMediaItem = ActivityMediaItem;
export type TripWaypoint = Waypoint;

export interface TripRecord extends Activity {
  entityKind?: 'trip';
  tripTemplateMeta?: {
    customNotes?: string;
  };
}
