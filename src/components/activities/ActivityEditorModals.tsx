import React from 'react';
import {
  CreationReferenceModals,
  type CreationReferenceModalsProps
} from '../reference/creation/CreationReferenceModals';
import { ACTIVITY_TERMINOLOGY } from '../reference/creation/entityCreationTerminology';

export type ActivityEditorModalsProps = Omit<CreationReferenceModalsProps, 'terms'>;

export const ActivityEditorModals: React.FC<ActivityEditorModalsProps> = (props) => {
  return <CreationReferenceModals {...props} terms={ACTIVITY_TERMINOLOGY} />;
};
