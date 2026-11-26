import React from 'react';
import { X } from 'lucide-react';
import type { Activity } from '../../types/activity';
import type { EquipmentItem, EquipmentTypeDefinition } from '../../types/equipment';
import type { PlatformPricingSettings } from '../pricing/PricingToolManager';
import { ActivityCardAllProperties, ActivityCardMediaGallery } from './ActivityCardSections';
import {
  ACTIVITY_TERMINOLOGY,
  type EntityTerminologyConfig
} from '../reference/creation/entityCreationTerminology';

interface ActivityPreviewModalProps {
  activity: Activity | null;
  clientMode: boolean;
  onChangeClientMode: (isClientMode: boolean) => void;
  onClose: () => void;
  onOpenInEditor: (activity: Activity) => void;
  equipments: EquipmentItem[];
  equipmentTypes: EquipmentTypeDefinition[];
  platformPricingSettings: PlatformPricingSettings;
  terms?: EntityTerminologyConfig;
}

export const ActivityPreviewModal: React.FC<ActivityPreviewModalProps> = ({
  activity,
  clientMode,
  onChangeClientMode,
  onClose,
  onOpenInEditor,
  equipments,
  equipmentTypes,
  platformPricingSettings,
  terms = ACTIVITY_TERMINOLOGY
}) => {
  if (!activity) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <span className="text-[11px] text-cyan-400 font-medium">{terms.previewModalTitle}</span>
            <h3 className="text-lg font-bold text-white">{activity.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => onChangeClientMode(false)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  !clientMode ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                عرض المالك (كامل)
              </button>
              <button
                type="button"
                onClick={() => onChangeClientMode(true)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  clientMode ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                معاينة عرض العميل
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-800">
          <ActivityCardMediaGallery activity={activity} aspectClass="aspect-video" terms={terms} />
        </div>

        <ActivityCardAllProperties
          activity={activity}
          showStatsAndChannels={!clientMode}
          equipments={equipments}
          equipmentTypes={equipmentTypes}
          clientViewOnly={clientMode}
          platformPricingSettings={platformPricingSettings}
          terms={terms}
        />

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            المالك: {activity.owner.companyName}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenInEditor(activity)}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold"
            >
              فتح في المحرر التفصيلي
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
