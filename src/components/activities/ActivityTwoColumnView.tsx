import React from 'react';
import {
  CreationReferenceTwoColumnView,
  type CreationReferenceTwoColumnViewProps
} from '../reference/creation/CreationReferenceTwoColumnView';
import { ACTIVITY_TERMINOLOGY } from '../reference/creation/entityCreationTerminology';

export type ActivityTwoColumnViewProps = Omit<
  CreationReferenceTwoColumnViewProps,
  'terms' | 'overrides'
>;

export const ActivityTwoColumnView: React.FC<ActivityTwoColumnViewProps> = (props) => {
  return <CreationReferenceTwoColumnView {...props} terms={ACTIVITY_TERMINOLOGY} />;
};
