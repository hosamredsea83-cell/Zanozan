import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { MediaUploadSection, Asset } from '../MediaUploadSection';
import { INITIAL_STORED_MEDIA_LIBRARY } from '../activities/activityEditorData';

interface StandardMediaUploaderProps {
  title?: string;
  initialFiles: Asset[];
  existingLibrary?: Asset[];
  maxFiles?: number;
  onUpdate: (files: Asset[]) => void;
  onAddToLibrary?: (asset: Asset) => void;
  ownerTier?: string;
  storageDescription?: string;
  maxQuotaMB?: number;
}

export const StandardMediaUploader: React.FC<StandardMediaUploaderProps> = ({
  title = 'Media / وسائط وصور النشاط',
  initialFiles,
  existingLibrary,
  maxFiles = 12,
  onUpdate,
  onAddToLibrary,
  ownerTier = 'افتراضي',
  storageDescription = 'الحدود مرتبطة بباقة صاحب النشاط. روابط YouTube لا تستهلك مساحة التخزين في المنصة.',
  maxQuotaMB = 2048
}) => {
  const [localLibrary, setLocalLibrary] = useState<Asset[]>(() => INITIAL_STORED_MEDIA_LIBRARY);

  const effectiveLibrary = existingLibrary ?? localLibrary;
  const handleAddToLibrary = (newAsset: Asset) => {
    if (onAddToLibrary) {
      onAddToLibrary(newAsset);
      return;
    }
    setLocalLibrary((prev) => {
      const exists = prev.some(
        (item) => item.name === newAsset.name && item.sizeBytes === newAsset.sizeBytes
      );
      return exists ? prev : [newAsset, ...prev];
    });
  };

  const totalStorageBytes = initialFiles.reduce(
    (acc, asset) => acc + (asset.sizeBytes || 1200000),
    0
  );
  const maxStorageBytes = maxQuotaMB * 1024 * 1024;
  const storagePercentage = Math.min(
    100,
    Math.round((totalStorageBytes / maxStorageBytes) * 100)
  );

  return (
    <div className="space-y-4">
      <MediaUploadSection
        title={title}
        initialFiles={initialFiles}
        existingLibrary={effectiveLibrary}
        maxFiles={maxFiles}
        onUpdate={onUpdate}
        onAddToLibrary={handleAddToLibrary}
      />

      {/* Storage Quota Gauge */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <span>حدود التخزين وباقة المالك</span>
            </h3>
            <p className="text-xs text-slate-400">{storageDescription}</p>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-semibold">
            باقة: {ownerTier || 'افتراضي'}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>
              المساحة المستهلكة: {(totalStorageBytes / (1024 * 1024)).toFixed(1)} ميجابايت من{' '}
              {maxQuotaMB} ميجابايت
            </span>
            <span>{storagePercentage}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, storagePercentage)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
