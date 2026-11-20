import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  FileImage, X, Plus, Minus, Search, ChevronDown, Check, 
  LayoutGrid, List, UploadCloud, ArrowUpDown, Eye, ChevronLeft, ChevronRight, 
  Image as ImageIcon, AlertTriangle, ShieldCheck, CheckCircle2 
} from 'lucide-react';

export interface Asset {
  id: string;
  url: string;
  name: string;
  extension: string;
  file?: File;
  sizeBytes?: number;
  dateAdded: number;
  activityTag?: string;
}


export interface UploadableAsset extends Asset {
  progress?: number;
}

interface MediaUploadSectionProps {
  title?: string;
  initialFiles?: Asset[];
  existingLibrary?: Asset[]; // مكتبة الصور الموجودة مسبقاً للاختيار منها
  maxFiles?: number;
  onUpdate?: (files: Asset[]) => void;
  onAddToLibrary?: (asset: Asset) => void;
}

export function MediaUploadSection({ 
  title = "الوسائط", 
  initialFiles = [], 
  existingLibrary = [],
  maxFiles, 
  onUpdate,
  onAddToLibrary 
}: MediaUploadSectionProps) {
  const [isDraggingExternal, setIsDraggingExternal] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [images, setImages] = useState<UploadableAsset[]>(initialFiles);
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [duplicateNotice, setDuplicateNotice] = useState<string>('');
  
  // مكتبة الصور المحلية المتاحة للاختيار
  const [library, setLibrary] = useState<Asset[]>(existingLibrary);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Sync library when existingLibrary genuinely changes
  const prevLibIds = useRef<string>(existingLibrary.map(f => f.id).join(','));
  useEffect(() => {
    const currentIds = existingLibrary.map(f => f.id).join(',');
    if (currentIds !== prevLibIds.current) {
      prevLibIds.current = currentIds;
      setLibrary(existingLibrary);
    }
  }, [existingLibrary]);

  // Sync images if initialFiles genuinely changes from outside
  const prevInitialIds = useRef<string>(initialFiles.map(f => f.id).join(','));
  const prevExportedSignature = useRef<string>(initialFiles.map(f => f.id).join(','));

  useEffect(() => {
    const currentIds = initialFiles.map(f => f.id).join(',');
    if (currentIds !== prevInitialIds.current) {
      prevInitialIds.current = currentIds;
      prevExportedSignature.current = currentIds;
      setImages(initialFiles);
    }
  }, [initialFiles]);

  // Only notify parent when images list actually changes
  useEffect(() => {
    const currentSignature = images.map(img => img.id).join(',');
    if (currentSignature !== prevExportedSignature.current) {
      prevExportedSignature.current = currentSignature;
      if (onUpdateRef.current) {
        const exportableAssets = images.map(img => {
          const { progress, ...rest } = img;
          return rest as Asset;
        });
        onUpdateRef.current(exportableAssets);
      }
    }
  }, [images]);


  const handleDragOverArea = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIdx === null) {
      setIsDraggingExternal(true);
    }
  }, [draggedIdx]);

  const handleDragLeaveArea = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingExternal(false);
  }, []);

  // دالة فحص وتحديد ما إذا كانت الصورة مكررة مسبقاً في المعرض
  const checkIfDuplicate = useCallback((fileName: string, fileSize: number, currentList: Asset[]) => {
    const ext = '.' + fileName.split('.').pop();
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '').trim().toLowerCase();

    return currentList.some((img) => {
      const existingName = img.name.trim().toLowerCase();
      // 1. نفس مرجع الملف بالاسم والحجم
      if (img.file && img.file.name === fileName && img.file.size === fileSize) {
        return true;
      }
      // 2. نفس الاسم ونفس الحجم بالبايت
      if (existingName === nameWithoutExt && img.sizeBytes === fileSize) {
        return true;
      }
      // 3. نفس الاسم تماماً مع نفس الامتداد
      if (existingName === nameWithoutExt && img.extension.toLowerCase() === ext.toLowerCase()) {
        return true;
      }
      return false;
    });
  }, []);

  const processFiles = useCallback((files: FileList | File[]) => {
    setUploadError('');
    setDuplicateNotice('');
    const newAssets: UploadableAsset[] = [];
    const rejectedDuplicates: string[] = [];
    
    Array.from(files).forEach((file) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('الملفات المسموح بها هي الصور فقط (JPG, PNG, GIF, WebP, SVG)');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setUploadError('حجم الصورة يجب ألا يتجاوز 20 ميجابايت');
        return;
      }

      // فحص عدم تكرار الصورة في المعرض الحالي أو في الحزمة المرفوعة حالياً
      const isDuplicateInGallery = checkIfDuplicate(file.name, file.size, images);
      const isDuplicateInBatch = checkIfDuplicate(file.name, file.size, newAssets);

      if (isDuplicateInGallery || isDuplicateInBatch) {
        rejectedDuplicates.push(file.name);
        return; // منع قبول وإضافة الصورة المكررة
      }

      const ext = '.' + file.name.split('.').pop();
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      const asset: UploadableAsset = {
        id: 'asset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file),
        name: nameWithoutExt,
        extension: ext,
        file: file,
        sizeBytes: file.size,
        dateAdded: Date.now(),
        progress: 0,
      };

      newAssets.push(asset);
      if (onAddToLibrary) onAddToLibrary(asset);
      setLibrary(prev => {
        const alreadyInLib = prev.some(item => 
          item.name.toLowerCase() === asset.name.toLowerCase() && item.sizeBytes === asset.sizeBytes
        );
        return alreadyInLib ? prev : [asset, ...prev];
      });
    });

    // إشعار المستخدم بالصور المرفوضة بسبب التكرار
    if (rejectedDuplicates.length > 0) {
      setDuplicateNotice(
        `تم منع وقفل (${rejectedDuplicates.length}) صورة مكررة لعدم التكرار في المعرض: [${rejectedDuplicates.join('، ')}]`
      );
    }

    if (newAssets.length > 0) {
      setImages(prev => {
        const combined = [...prev, ...newAssets];
        return maxFiles ? combined.slice(0, maxFiles) : combined;
      });

      // محاكاة رفع مع شريط التقدم
      newAssets.forEach(asset => {
        let currentProgress = 0;
        const interval = setInterval(() => {
          currentProgress += 20;
          if (currentProgress >= 100) {
            clearInterval(interval);
            setImages(currentImages => 
              currentImages.map(img => 
                img.id === asset.id ? { ...img, progress: undefined } : img
              )
            );
          } else {
            setImages(currentImages => 
              currentImages.map(img => 
                img.id === asset.id ? { ...img, progress: currentProgress } : img
              )
            );
          }
        }, 120);
      });
    }
  }, [images, maxFiles, onAddToLibrary, checkIfDuplicate]);

  const handleDropArea = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingExternal(false);
    if (draggedIdx !== null) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [draggedIdx, processFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCardDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCardDragEnter = (index: number) => {
    if (draggedIdx !== null && draggedIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleCardDrop = (index: number) => {
    if (draggedIdx !== null && draggedIdx !== index) {
      setImages(prev => {
        const updated = [...prev];
        const [movedItem] = updated.splice(draggedIdx, 1);
        updated.splice(index, 0, movedItem);
        return updated;
      });
    }
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const toggleSelectForDeletion = (id: string) => {
    setSelectedForDeletion(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchDelete = () => {
    setImages(prev => prev.filter(img => !selectedForDeletion.has(img.id)));
    setSelectedForDeletion(new Set());
  };

  const handleSelectFromLibrary = (selectedAssets: Asset[]) => {
    setDuplicateNotice('');
    const existingIds = new Set(images.map(img => img.id));
    const existingUrls = new Set(images.map(img => img.url));
    const existingNames = new Set(images.map(img => img.name.trim().toLowerCase()));

    const rejectedNames: string[] = [];
    const uniqueToAdd: Asset[] = [];

    selectedAssets.forEach(item => {
      const isDuplicate = 
        existingIds.has(item.id) ||
        existingUrls.has(item.url) ||
        existingNames.has(item.name.trim().toLowerCase());

      if (isDuplicate) {
        rejectedNames.push(item.name);
      } else {
        uniqueToAdd.push(item);
      }
    });

    if (rejectedNames.length > 0) {
      setDuplicateNotice(
        `تم تجاهل ومنع إضافة (${rejectedNames.length}) صورة لأنها مضافة مسبقاً في المعرض: [${rejectedNames.join('، ')}]`
      );
    }

    if (uniqueToAdd.length > 0) {
      setImages(prev => {
        const combined = [...prev, ...uniqueToAdd];
        return maxFiles ? combined.slice(0, maxFiles) : combined;
      });
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-md p-5 space-y-4 text-right" dir="rtl">
      {/* رأس البطاقة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white text-base">{title}</h3>
          <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
            {images.length} {maxFiles ? `/ ${maxFiles}` : ''} صورة
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>نظام منع تكرار الصور مفعل</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedForDeletion.size > 0 && (
            <button
              type="button"
              onClick={handleBatchDelete}
              className="text-xs text-rose-300 hover:text-white font-medium px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>حذف المحدد ({selectedForDeletion.size})</span>
            </button>
          )}
        </div>
      </div>

      {/* تنبيه الخطأ العام */}
      {uploadError && (
        <div className="p-3 text-xs text-rose-300 bg-rose-950/70 border border-rose-800 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* تنبيه منع التكرار الفوري */}
      {duplicateNotice && (
        <div className="p-3 text-xs text-amber-300 bg-amber-950/60 border border-amber-800/60 rounded-lg flex items-center justify-between gap-2 shadow-sm animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium">{duplicateNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setDuplicateNotice('')}
            className="p-1 hover:bg-amber-900/60 rounded text-amber-400 hover:text-white transition-colors"
            title="إغلاق التنبيه"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* منطقة السحب والإفلات والأزرار */}
      <div
        onDragOver={handleDragOverArea}
        onDragLeave={handleDragLeaveArea}
        onDrop={handleDropArea}
        className={`border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center transition-all ${
          isDraggingExternal ? 'border-cyan-500 bg-cyan-950/40' : 'border-slate-700 bg-slate-950/60 hover:bg-slate-950/90'
        }`}
      >
        <FileImage className="w-12 h-12 text-slate-500 mb-3 stroke-[1.2]" />
        
        <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            multiple 
            accept="image/*" 
            className="hidden" 
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs md:text-sm font-semibold rounded-lg shadow-sm shadow-cyan-950/30 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة جديد</span>
          </button>
          
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs md:text-sm font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Search className="w-4 h-4 text-cyan-400" />
            <span>اختيار ملف موجود</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-1">
          أو اسحب وأفلت الملفات هنا للتحميل (يتم فحص ومنع أي صور مكررة تلقائياً)
        </p>
      </div>

      {/* شبكة الصور المرفوعة والفرز بالسحب والإفلات */}
      {images.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>الصور المرفوعة (اسحب الصورة لإعادة ترتيب أولويتها في العرض):</span>
            <span className="text-[11px] text-cyan-400">الصورة الأولى هي صورة الغلاف الرئيسية</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {images.map((img, index) => {
              const isDeleting = selectedForDeletion.has(img.id);
              const isTarget = dragOverIdx === index;
              const isCover = index === 0;

              return (
                <div
                  key={img.id}
                  draggable
                  onDragStart={(e) => handleCardDragStart(e, index)}
                  onDragEnter={() => handleCardDragEnter(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleCardDrop(index)}
                  className={`group relative aspect-square rounded-xl overflow-hidden border bg-slate-950 cursor-grab active:cursor-grabbing transition-all ${
                    isDeleting 
                      ? 'border-rose-500 ring-2 ring-rose-500/50' 
                      : isCover 
                      ? 'border-cyan-500 ring-1 ring-cyan-500/30' 
                      : 'border-slate-800 hover:border-slate-700'
                  } ${isTarget ? 'scale-105 border-cyan-500' : ''}`}
                >
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  
                  {/* شريط التقدم */}
                  {img.progress !== undefined && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-2 z-20">
                      <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-cyan-500 h-full transition-all duration-150"
                          style={{ width: `${img.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-white mt-1 font-mono">{img.progress}%</span>
                    </div>
                  )}


                  {/* علامة صورة الغلاف */}
                  {isCover && (
                    <div className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 bg-cyan-600/90 text-white rounded text-[9px] font-bold shadow">
                      الغلاف
                    </div>
                  )}

                  {/* زر التحديد للحذف */}
                  <button
                    type="button"
                    onClick={() => toggleSelectForDeletion(img.id)}
                    className={`absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      isDeleting 
                        ? 'bg-rose-600 text-white' 
                        : 'bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-rose-600'
                    }`}
                    title={isDeleting ? 'إلغاء التحديد' : 'تحديد للحذف'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* اسم الصورة وحجمها */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-2 py-1.5 text-[10px] text-white truncate text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="truncate font-medium">{img.name}{img.extension}</p>
                    {img.sizeBytes && (
                      <p className="text-[9px] text-slate-300 font-mono">
                        {(img.sizeBytes / 1024).toFixed(0)} KB
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* نافذة اختيار صورة موجودة من المكتبة (Modal) */}
      {isModalOpen && (
        <SelectFileModal
          isOpen={isModalOpen}
          library={library}
          currentGalleryImages={images}
          onClose={() => setIsModalOpen(false)}
          onSelectFiles={handleSelectFromLibrary}
          onAddNewToLibrary={(asset) => {
            if (onAddToLibrary) onAddToLibrary(asset);
            setLibrary(prev => {
              const exists = prev.some(item => item.name === asset.name && item.sizeBytes === asset.sizeBytes);
              return exists ? prev : [asset, ...prev];
            });
          }}
        />
      )}
    </div>
  );
}

// نافذة اختيار الصور من المكتبة (Select file Modal) مطابقة تماماً لتصميم الشاشة المرفقة
function SelectFileModal({ 
  isOpen, 
  library, 
  currentGalleryImages = [],
  onClose, 
  onSelectFiles,
  onAddNewToLibrary
}: { 
  isOpen: boolean; 
  library: Asset[]; 
  currentGalleryImages?: Asset[];
  onClose: () => void; 
  onSelectFiles: (files: Asset[]) => void; 
  onAddNewToLibrary?: (asset: Asset) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<'fileType' | 'fileSize' | 'usedIn' | 'activity' | 'sort' | null>(null);
  
  // Filters
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'png' | 'jpg' | 'webp' | 'svg'>('all');
  const [fileSizeFilter, setFileSizeFilter] = useState<'all' | 'small' | 'medium' | 'large'>('all');
  const [usedInFilter, setUsedInFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'size'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDraggingModal, setIsDraggingModal] = useState(false);

  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Close open dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdown(null);
    };
    if (activeDropdown) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [activeDropdown]);

  if (!isOpen) return null;

  const existingIds = new Set(currentGalleryImages.map(img => img.id));
  const existingUrls = new Set(currentGalleryImages.map(img => img.url));
  const existingNames = new Set(currentGalleryImages.map(img => img.name.trim().toLowerCase()));

  // فحص ما إذا كانت الصورة مضافة بالفعل في المعرض
  const isAssetAlreadyInGallery = (asset: Asset) => {
    return (
      existingIds.has(asset.id) ||
      existingUrls.has(asset.url) ||
      existingNames.has(asset.name.trim().toLowerCase())
    );
  };

  // معالجة الفلترة والبحث والفرز
  const filteredAssets = library
    .filter(item => {
      // 1. بحث بالاسم
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchExt = item.extension.toLowerCase().includes(q);
        if (!matchName && !matchExt) return false;
      }
      // 2. نوع الملف File type
      if (fileTypeFilter !== 'all') {
        if (!item.extension.toLowerCase().includes(fileTypeFilter)) return false;
      }
      // 3. حجم الملف File size
      if (fileSizeFilter === 'small' && (item.sizeBytes || 0) > 1024 * 1024) return false;
      if (fileSizeFilter === 'medium' && ((item.sizeBytes || 0) <= 1024 * 1024 || (item.sizeBytes || 0) > 3 * 1024 * 1024)) return false;
      if (fileSizeFilter === 'large' && (item.sizeBytes || 0) <= 3 * 1024 * 1024) return false;

      // 4. مستخدم في Used in
      const inGallery = isAssetAlreadyInGallery(item);
      if (usedInFilter === 'used' && !inGallery) return false;
      if (usedInFilter === 'unused' && inGallery) return false;

      // 5. فلتر النشاط Activity (بدلاً من Product)
      if (activityFilter !== 'all') {
        const actLower = activityFilter.toLowerCase();
        const matchAct = 
          (item.activityTag && item.activityTag.toLowerCase().includes(actLower)) ||
          item.name.toLowerCase().includes(actLower);
        if (!matchAct) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return (b.dateAdded || 0) - (a.dateAdded || 0);
      if (sortBy === 'oldest') return (a.dateAdded || 0) - (b.dateAdded || 0);
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name, 'ar');
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name, 'ar');
      if (sortBy === 'size') return (b.sizeBytes || 0) - (a.sizeBytes || 0);
      return 0;
    });

  const toggleSelect = (asset: Asset) => {
    if (isAssetAlreadyInGallery(asset)) return; // غير قابلة للتكرار

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(asset.id)) next.delete(asset.id);
      else next.add(asset.id);
      return next;
    });
  };

  const handleConfirm = () => {
    const selected = library.filter(item => selectedIds.has(item.id) && !isAssetAlreadyInGallery(item));
    onSelectFiles(selected);
    onClose();
  };

  const handleModalFileUpload = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const ext = '.' + file.name.split('.').pop();
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      const newAsset: Asset = {
        id: 'asset_lib_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7),
        url: URL.createObjectURL(file),
        name: nameWithoutExt,
        extension: ext,
        file: file,
        sizeBytes: file.size,
        dateAdded: Date.now()
      };
      if (onAddNewToLibrary) onAddNewToLibrary(newAsset);
      setSelectedIds(prev => new Set(prev).add(newAsset.id));
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6" dir="ltr">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-750 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-left font-sans"
      >
        {/* 1. Header (Select file + X close button) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <h2 className="text-base font-semibold text-white">
              Select file
            </h2>
            <span className="text-xs text-slate-400 font-mono">({library.length} available)</span>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Search Bar (Full width with magnifying glass) */}
        <div className="px-6 pt-4 pb-2 bg-slate-900">
          <div className="relative">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files"
              className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 3. Filters Row: File type, File size, Used in, Activity (changing Product to Activity), Sort, Grid/List */}
        <div className="px-6 py-2 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Left: Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 relative">
            {/* Filter 1: File type */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'fileType' ? null : 'fileType');
                }}
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 text-xs font-medium transition ${
                  fileTypeFilter !== 'all'
                    ? 'border-cyan-500 bg-cyan-950/80 text-cyan-300 font-semibold'
                    : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>File type {fileTypeFilter !== 'all' ? `(${fileTypeFilter.toUpperCase()})` : ''}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {activeDropdown === 'fileType' && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 mt-1 w-36 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-30 py-1 text-xs"
                >
                  {['all', 'png', 'jpg', 'webp', 'svg'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setFileTypeFilter(t as any);
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between ${
                        fileTypeFilter === t ? 'text-cyan-400 font-bold bg-cyan-950/40' : 'text-slate-200'
                      }`}
                    >
                      <span>{t === 'all' ? 'All types' : t.toUpperCase()}</span>
                      {fileTypeFilter === t && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter 2: File size */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'fileSize' ? null : 'fileSize');
                }}
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 text-xs font-medium transition ${
                  fileSizeFilter !== 'all'
                    ? 'border-cyan-500 bg-cyan-950/80 text-cyan-300 font-semibold'
                    : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>File size {fileSizeFilter !== 'all' ? `(${fileSizeFilter})` : ''}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {activeDropdown === 'fileSize' && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 mt-1 w-44 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-30 py-1 text-xs"
                >
                  {[
                    { id: 'all', label: 'All sizes' },
                    { id: 'small', label: '< 1 MB' },
                    { id: 'medium', label: '1 MB – 3 MB' },
                    { id: 'large', label: '> 3 MB' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setFileSizeFilter(s.id as any);
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between ${
                        fileSizeFilter === s.id ? 'text-cyan-400 font-bold bg-cyan-950/40' : 'text-slate-200'
                      }`}
                    >
                      <span>{s.label}</span>
                      {fileSizeFilter === s.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter 3: Used in */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'usedIn' ? null : 'usedIn');
                }}
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 text-xs font-medium transition ${
                  usedInFilter !== 'all'
                    ? 'border-cyan-500 bg-cyan-950/80 text-cyan-300 font-semibold'
                    : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>Used in {usedInFilter !== 'all' ? `(${usedInFilter})` : ''}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {activeDropdown === 'usedIn' && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-30 py-1 text-xs"
                >
                  {[
                    { id: 'all', label: 'All files' },
                    { id: 'used', label: 'Used in this activity' },
                    { id: 'unused', label: 'Not used in activity' }
                  ].map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setUsedInFilter(u.id as any);
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between ${
                        usedInFilter === u.id ? 'text-cyan-400 font-bold bg-cyan-950/40' : 'text-slate-200'
                      }`}
                    >
                      <span>{u.label}</span>
                      {usedInFilter === u.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter 4: Activity (User explicit instruction: تغير كلمة المنتج الي نشاط) */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'activity' ? null : 'activity');
                }}
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 text-xs font-semibold transition ${
                  activityFilter !== 'all'
                    ? 'border-cyan-500 bg-cyan-950/80 text-cyan-300 font-bold shadow-sm'
                    : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
                title="تصفية حسب النشاط (بدلاً من المنتج)"
              >
                <span className="text-cyan-400 font-bold">Activity</span>
                <span>{activityFilter !== 'all' ? `(${activityFilter})` : ''}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {activeDropdown === 'activity' && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 mt-1 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-30 py-1 text-xs"
                >
                  <div className="px-3 py-1 text-[10px] font-bold text-cyan-400 border-b border-slate-700">
                    Filter by Activity / تصفية حسب النشاط
                  </div>
                  {[
                    { id: 'all', label: 'All activities (جميع الأنشطة)' },
                    { id: 'yacht', label: 'أنشطة اليخوت (Yachts)' },
                    { id: 'scuba', label: 'الغوص والسنوركلينج (Diving)' },
                    { id: 'safari', label: 'السفاري والمغامرات (Safari)' },
                    { id: 'horse', label: 'الفروسية والشواطئ (Horses)' },
                    { id: 'boat', label: 'قوارب زجاجية وجزر (Boats)' }
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => {
                        setActivityFilter(act.id);
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between ${
                        activityFilter === act.id ? 'text-cyan-400 font-bold bg-cyan-950/40' : 'text-slate-200'
                      }`}
                    >
                      <span className="truncate">{act.label}</span>
                      {activityFilter === act.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Sort & View Mode Switcher */}
          <div className="flex items-center gap-2">
            {/* Sort Button */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'sort' ? null : 'sort');
                }}
                className="px-3 py-1.5 border border-slate-700 rounded-lg bg-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sort</span>
              </button>
              {activeDropdown === 'sort' && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-30 py-1 text-xs"
                >
                  {[
                    { id: 'newest', label: 'Date added (newest first)' },
                    { id: 'oldest', label: 'Date added (oldest first)' },
                    { id: 'name_asc', label: 'File name (A–Z)' },
                    { id: 'name_desc', label: 'File name (Z–A)' },
                    { id: 'size', label: 'File size (largest first)' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSortBy(s.id as any);
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between ${
                        sortBy === s.id ? 'text-cyan-400 font-bold bg-cyan-950/40' : 'text-slate-200'
                      }`}
                    >
                      <span>{s.label}</span>
                      {sortBy === s.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Mode Toggle: List & Grid Icons */}
            <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 transition ${
                  viewMode === 'list' 
                    ? 'bg-slate-700 text-cyan-400' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-slate-700" />
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 transition ${
                  viewMode === 'grid' 
                    ? 'bg-slate-700 text-cyan-400' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Dashed Upload Area (Platform Slate & Cyan Style) */}
        <div className="px-6 py-2.5 bg-slate-900">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingModal(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDraggingModal(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingModal(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleModalFileUpload(e.dataTransfer.files);
              }
            }}
            className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center transition ${
              isDraggingModal 
                ? 'border-cyan-500 bg-cyan-950/40' 
                : 'border-slate-700 bg-slate-950/60 hover:bg-slate-950/80 hover:border-slate-600'
            }`}
          >
            {/* Circle Upload Icon */}
            <div className="w-9 h-9 rounded-full bg-slate-800 shadow-sm border border-slate-700 flex items-center justify-center text-cyan-400 mb-2.5">
              <UploadCloud className="w-4 h-4 stroke-[1.5]" />
            </div>

            {/* "Add media ∨" Button */}
            <div className="relative mb-1.5">
              <input
                ref={modalFileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleModalFileUpload(e.target.files);
                  }
                  if (modalFileInputRef.current) modalFileInputRef.current.value = '';
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => modalFileInputRef.current?.click()}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-800 border border-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <span>Add media</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Drag and drop images, videos, 3D models, and files
            </p>
          </div>
        </div>

        {/* 5. Media Grid / List View matching screenshot with platform colors */}
        <div className="flex-1 overflow-y-auto px-6 py-2 bg-slate-900 scrollbar-thin scrollbar-thumb-slate-700">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No files found matching current filters.
            </div>
          ) : viewMode === 'grid' ? (
            /* Cards Grid (Platform slate + cyan highlight) */
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-3.5 pb-4">
              {filteredAssets.map(asset => {
                const alreadyInGallery = isAssetAlreadyInGallery(asset);
                const isSelected = selectedIds.has(asset.id);

                return (
                  <div
                    key={asset.id}
                    onClick={() => toggleSelect(asset)}
                    className={`group relative rounded-xl border overflow-hidden flex flex-col transition cursor-pointer bg-slate-950 ${
                      alreadyInGallery
                        ? 'border-slate-800/80 opacity-55 cursor-not-allowed bg-slate-950'
                        : isSelected 
                        ? 'border-cyan-500 ring-2 ring-cyan-500/40 shadow-xl shadow-cyan-950/40' 
                        : 'border-slate-800 hover:border-slate-700 shadow-sm'
                    }`}
                  >
                    {/* Top Image Preview (aspect 4/3) */}
                    <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                      <img 
                        src={asset.url} 
                        alt={asset.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                      />
                      
                      {/* Checkmark indicator when selected (Cyan theme) */}
                      {isSelected && !alreadyInGallery && (
                        <div className="absolute top-2 right-2 bg-cyan-600 text-white p-1 rounded-full shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      )}

                      {/* Already in gallery badge */}
                      {alreadyInGallery && (
                        <div className="absolute top-2 right-2 bg-slate-900/95 text-slate-300 border border-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                          <span>مضافة بالنشاط</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom File Metadata */}
                    <div className="p-3 bg-slate-900 border-t border-slate-800/80 text-left">
                      <div className="text-xs font-semibold text-white truncate" title={asset.name}>
                        {asset.name}
                      </div>
                      <div className="text-[10px] font-medium text-slate-400 uppercase mt-0.5 tracking-wider font-mono">
                        {asset.extension.replace('.', '') || 'PNG'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 mb-4 bg-slate-950">
              {filteredAssets.map(asset => {
                const alreadyInGallery = isAssetAlreadyInGallery(asset);
                const isSelected = selectedIds.has(asset.id);

                return (
                  <div
                    key={asset.id}
                    onClick={() => toggleSelect(asset)}
                    className={`px-4 py-2.5 flex items-center justify-between text-xs transition cursor-pointer ${
                      alreadyInGallery
                        ? 'opacity-55 bg-slate-950 cursor-not-allowed'
                        : isSelected
                        ? 'bg-cyan-950/40 text-cyan-200'
                        : 'hover:bg-slate-800/60 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-900">
                        <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{asset.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {asset.extension.toUpperCase().replace('.', '')} • {asset.sizeBytes ? `${(asset.sizeBytes / 1024).toFixed(0)} KB` : '1.5 MB'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {alreadyInGallery ? (
                        <span className="text-[10px] font-bold text-slate-400">مضافة بالنشاط</span>
                      ) : isSelected ? (
                        <div className="bg-cyan-600 text-white p-1 rounded-full">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Select</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 6. Footer (Cancel & Done buttons with Cyan & Slate Theme) */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex justify-between items-center bg-slate-950/90">
          <span className="text-xs text-slate-400">
            {selectedIds.size > 0 ? (
              <span>Selected: <strong className="text-cyan-400 font-bold font-mono">{selectedIds.size} file(s)</strong></span>
            ) : (
              <span>No files selected</span>
            )}
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold shadow-md shadow-cyan-950/40 transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

