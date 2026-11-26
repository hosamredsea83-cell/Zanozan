import React from 'react';
import {
  CreationReferenceEditor,
  type CreationReferenceEditorProps
} from '../reference/creation/CreationReferenceEditor';
import { ACTIVITY_TERMINOLOGY } from '../reference/creation/entityCreationTerminology';
import {
  RegisteredOwnerItem,
  CategoryNode,
  StoredActivityPreset,
  StoredWaypointTemplate,
  StoredDurationPreset,
  StoredStatusOption,
  StoredChannelItem,
  StoredDescriptionTemplate,
  StoredPricingPackage,
  INITIAL_CATEGORY_TREE,
  INITIAL_STORED_MEDIA_LIBRARY,
  INITIAL_STORED_PRESETS,
  INITIAL_STORED_COUNTRIES,
  INITIAL_STORED_CITIES,
  INITIAL_STORED_SITES,
  sortItineraryWithAnchors,
  INITIAL_STORED_WAYPOINTS_BANK,
  INITIAL_STORED_DURATIONS,
  INITIAL_STORED_STATUSES,
  INITIAL_STORED_CHANNELS,
  INITIAL_STORED_DESCRIPTION_TEMPLATES,
  INITIAL_STORED_INCLUSIONS,
  INITIAL_STORED_EXCLUSIONS,
  INITIAL_STORED_PICKUP_POINTS,
  INITIAL_STORED_PRICING_PACKAGES
} from '../reference/creation/creationReferenceData';

export type {
  RegisteredOwnerItem,
  CategoryNode,
  StoredActivityPreset,
  StoredWaypointTemplate,
  StoredDurationPreset,
  StoredStatusOption,
  StoredChannelItem,
  StoredDescriptionTemplate,
  StoredPricingPackage
};

export {
  INITIAL_CATEGORY_TREE,
  INITIAL_STORED_MEDIA_LIBRARY,
  INITIAL_STORED_PRESETS,
  INITIAL_STORED_COUNTRIES,
  INITIAL_STORED_CITIES,
  INITIAL_STORED_SITES,
  sortItineraryWithAnchors,
  INITIAL_STORED_WAYPOINTS_BANK,
  INITIAL_STORED_DURATIONS,
  INITIAL_STORED_STATUSES,
  INITIAL_STORED_CHANNELS,
  INITIAL_STORED_DESCRIPTION_TEMPLATES,
  INITIAL_STORED_INCLUSIONS,
  INITIAL_STORED_EXCLUSIONS,
  INITIAL_STORED_PICKUP_POINTS,
  INITIAL_STORED_PRICING_PACKAGES
};

export type ActivityEditorProps = Omit<CreationReferenceEditorProps, 'terms' | 'overrides'>;

export const ActivityEditor: React.FC<ActivityEditorProps> = (props) => {
  return <CreationReferenceEditor {...props} terms={ACTIVITY_TERMINOLOGY} />;
};
