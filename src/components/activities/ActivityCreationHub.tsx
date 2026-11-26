import React from 'react';
import {
  CreationReferenceHub,
  type CreationReferenceHubProps
} from '../reference/creation/CreationReferenceHub';
import { ACTIVITY_TERMINOLOGY } from '../reference/creation/entityCreationTerminology';

export type ActivityCreationHubProps = Omit<CreationReferenceHubProps, 'terms' | 'overrides'>;

export const ActivityCreationHub: React.FC<ActivityCreationHubProps> = (props) => {
  return <CreationReferenceHub {...props} terms={ACTIVITY_TERMINOLOGY} />;
};
