import React, { useRef, useState } from 'react';
import { 
  Layers, Plus, Search, Filter, Edit, Trash2, Eye, 
  Check, X, Image as ImageIcon, Sparkles, FolderPlus, 
  Compass, ArrowRight, Tag, Anchor, Mountain, Waves
} from 'lucide-react';
import { Activity } from '../../types/activity';
import { AppUser } from '../../types/auth';
import { Asset } from '../MediaUploadSection';
import { StandardMediaUploader } from '../shared/StandardMediaUploader';

export interface ActivityCollection {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  category: string;
  activityIds: string[];
  status: 'active' | 'draft';
  createdAt: string;
  ownerId?: string;
  ownerName?: string;
}

interface CollectionsManagerProps {
  activities: Activity[];
  currentUser: AppUser;
  collections?: ActivityCollection[];
  onCollectionsChange?: (collections: ActivityCollection[]) => void;
  onNavigateToActivityAdd?: () => void;
}

export const INITIAL_COLLECTIONS: ActivityCollection[] = [
  {
    id: 'col-1',
    name: 'باقات اليخوت الملكية واللانشات السريعة VIP',
    description: 'مجموعة متكاملة من أرقى رحلات اليخوت واللانشات الخاصة في جزر البحر الأحمر مع خدمات استثنائية.',
    coverUrl: '/src/assets/images/zanoza_yacht_hurghada_1794046061468.jpg',
    category: 'رحلات بحرية ويخوت',
    activityIds: ['act-yacht-01', 'act-submarine-04'],
    status: 'active',
    createdAt: '2026-11-01',
    ownerId: 'user-ahmed',
    ownerName: 'أحمد الشناوي'
  },
  {
    id: 'col-2',
    name: 'مغامرات الجبل وسفاري الصحراء الكبرى',
    description: 'باقة المغامرات الصحراوية تشمل البيتش باجي وعشاء بدوي وسط سلاسل جبال البحر الأحمر الشاهقة.',
    coverUrl: '/src/assets/images/zanoza_safari_desert_1794046062158.jpg',
    category: 'سفاري وصحراء',
    activityIds: ['act-safari-02', 'act-horses-05'],
    status: 'active',
    createdAt: '2026-11-03',
    ownerId: 'user-mohamed',
    ownerName: 'محمد عبد الرحمن'
  },
  {
    id: 'col-3',
    name: 'رحلات اليوم الواحد - جزر الغوص والشعاب المرجانية',
    description: 'باقات يومية تبدأ صباحاً لزيارة جزيرة الجفتون وأورانج باي ومواقع الدلافين والشعاب النادرة.',
    coverUrl: '/src/assets/images/zanoza_scuba_diving_1794046063460.jpg',
    category: 'غوص وسنوركلينج',
    activityIds: ['act-yacht-01'],
    status: 'active',
    createdAt: '2026-11-05',
    ownerId: 'user-ahmed',
    ownerName: 'أحمد الشناوي'
  },
  {
    id: 'col-4',
    name: 'عروض الصيف والأنشطة الترفيهية العائلية',
    description: 'باقات مخصصة للعائلات والأطفال تشمل القوارب الزجاجية والسنوركلينج السطحي والألعاب المائية.',
    coverUrl: '/src/assets/images/zanoza_glass_boat_1794046062451.jpg',
    category: 'عائلي وترفيهي',
    activityIds: ['act-diving-03'],
    status: 'draft',
    createdAt: '2026-11-08',
    ownerId: 'user-tarek',
    ownerName: 'طارق السويفي'
  }
];

export const CollectionsManager: React.FC<CollectionsManagerProps> = ({
  activities,
  currentUser,
  collections: controlledCollections,
  onCollectionsChange,
  onNavigateToActivityAdd
}) => {
  const [internalCollections, setInternalCollections] = useState<ActivityCollection[]>(INITIAL_COLLECTIONS);
  const collections = controlledCollections ?? internalCollections;
  const setCollections = (updater: React.SetStateAction<ActivityCollection[]>) => {
    const next = typeof updater === 'function' ? updater(collections) : updater;
    if (onCollectionsChange) {
      onCollectionsChange(next);
    } else {
      setInternalCollections(next);
    }
  };
  const ownerCollections = collections.filter(
    (c) => !c.ownerId || c.ownerId === currentUser.id
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'draft'>('all');
  
  // Inline Create / Edit Panel State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<ActivityCollection | null>(null);
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Form State
  const [nameInput, setNameInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('رحلات بحرية ويخوت');
  const [coverUrlInput, setCoverUrlInput] = useState('/src/assets/images/zanoza_yacht_hurghada_1794046061468.jpg');
  const [collectionAssets, setCollectionAssets] = useState<Asset[]>([]);
  const [statusInput, setStatusInput] = useState<'active' | 'draft'>('active');
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const defaultCoverUrl = '/src/assets/images/zanoza_yacht_hurghada_1794046061468.jpg';

  const scrollToInlineForm = () => {
    setTimeout(() => {
      formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleOpenCreateModal = () => {
    if (showCreateModal && !editingCollection) {
      setShowCreateModal(false);
      return;
    }
    setEditingCollection(null);
    setNameInput('');
    setDescInput('');
    setCategoryInput('رحلات بحرية ويخوت');
    setCoverUrlInput(defaultCoverUrl);
    setCollectionAssets([]);
    setStatusInput('active');
    setSelectedActivityIds([]);
    setShowCreateModal(true);
    scrollToInlineForm();
  };

  const handleOpenEditModal = (col: ActivityCollection) => {
    setEditingCollection(col);
    setNameInput(col.name);
    setDescInput(col.description);
    setCategoryInput(col.category);
    setCoverUrlInput(col.coverUrl);
    setCollectionAssets(
      col.coverUrl
        ? [
            {
              id: `col-cover-${col.id}`,
              name: `${col.name}.jpg`,
              extension: 'jpg',
              sizeBytes: 1450000,
              url: col.coverUrl,
              dateAdded: Date.now(),
              activityTag: col.category
            }
          ]
        : []
    );
    setStatusInput(col.status);
    setSelectedActivityIds([...col.activityIds]);
    setShowCreateModal(true);
    scrollToInlineForm();
  };

  const handleToggleActivitySelection = (id: string) => {
    setSelectedActivityIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSaveCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    if (editingCollection) {
      // Update existing
      setCollections(prev => prev.map(c => {
        if (c.id === editingCollection.id) {
          return {
            ...c,
            name: nameInput.trim(),
            description: descInput.trim(),
            category: categoryInput,
            coverUrl: coverUrlInput,
            status: statusInput,
            activityIds: selectedActivityIds
          };
        }
        return c;
      }));
      setSaveSuccessMsg(`✓ تم تحديث المجموعة "${nameInput}" بنجاح`);
    } else {
      // Create new
      const newCol: ActivityCollection = {
        id: `col-${Date.now().toString().slice(-4)}`,
        name: nameInput.trim(),
        description: descInput.trim(),
        category: categoryInput,
        coverUrl: coverUrlInput,
        activityIds: selectedActivityIds,
        status: statusInput,
        createdAt: new Date().toISOString().split('T')[0],
        ownerId: currentUser.id,
        ownerName: currentUser.name
      };
      setCollections(prev => [newCol, ...prev]);
      setSaveSuccessMsg(`✓ تم إنشاء وإضافة المجموعة "${newCol.name}" بنجاح`);
    }

    setTimeout(() => setSaveSuccessMsg(''), 3000);
    setShowCreateModal(false);
  };

  const handleDeleteCollection = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDeleteCollection = (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
    setConfirmDeleteId(null);
    setSaveSuccessMsg('تم حذف المجموعة بنجاح');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const filteredCollections = ownerCollections.filter(c => {
    const matchesFilter = selectedFilter === 'all' || c.status === selectedFilter;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto text-right" dir="rtl">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold mb-1">
            <Layers className="w-4 h-4" />
            <span>إدارة نشاط · تنظيم العروض المجمعة</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <span>إضافة وإدارة المجموعات (Collections)</span>
            <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-800/40 px-2.5 py-1 rounded-full font-mono">
              {ownerCollections.length} مجموعات
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            قسّم أنشطتك السياحية إلى مجموعات وباقات جاذبة مثل رحلات اليوم الواحد، عروض الصيف، أو مغامرات السفاري واليخوت لزيادة المبيعات.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
          >
            {showCreateModal && !editingCollection ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showCreateModal && !editingCollection ? 'إغلاق نموذج الإنشاء' : '+ إنشاء مجموعة جديدة'}</span>
          </button>
        </div>
      </div>

      {/* Inline Create / Edit Collection Section (Inside the Page) */}
      {showCreateModal && (
        <div
          ref={formContainerRef}
          className="bg-slate-900 border border-cyan-500/40 rounded-2xl overflow-hidden shadow-2xl animate-fade-in text-right"
          dir="rtl"
        >
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <div className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">
                {editingCollection ? 'تعديل المجموعة السياحية' : 'إضافة مجموعة جديدة (داخل الصفحة)'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              title="إغلاق النموذج"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveCollection} className="p-5 space-y-4">
            {/* Name & Description */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">اسم المجموعة / الباقة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: رحلات اليوم الواحد، مغامرات الغردقة VIP، عروض العائلات..."
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">تصنيف المجموعة</label>
                  <select
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 font-medium"
                  >
                    <option value="رحلات بحرية ويخوت">رحلات بحرية ويخوت</option>
                    <option value="سفاري وصحراء">سفاري وصحراء</option>
                    <option value="غوص وسنوركلينج">غوص وسنوركلينج</option>
                    <option value="عائلي وترفيهي">عائلي وترفيهي</option>
                    <option value="باقات VIP حصرية">باقات VIP حصرية</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">حالة المجموعة في المنصة</label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value as 'active' | 'draft')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-cyan-500 font-medium"
                  >
                    <option value="active">نشطة (ظاهرة في المتجر والكتالوج)</option>
                    <option value="draft">مسودة (غير معلنة مؤقتاً)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">وصف المجموعة</label>
              <textarea
                rows={2}
                placeholder="اكتب نبذة تسويقية جذابة تشرح مزايا الأنشطة المجمعة معاً..."
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-slate-500 resize-none"
              />
            </div>

            {/* Standard Activity-Grade Media Uploader + Storage Quota Gauge */}
            <StandardMediaUploader
              title="Media / وسائط وصور المجموعة"
              initialFiles={collectionAssets}
              maxFiles={12}
              ownerTier={currentUser.tier || 'افتراضي'}
              storageDescription="الحدود مرتبطة بباقة صاحب النشاط. الصور المرفوعة للمجموعات تشارك نفس مكتبة الوسائط وحدود التخزين."
              onUpdate={(files) => {
                setCollectionAssets(files);
                const cover = files[0];
                setCoverUrlInput(cover?.url || defaultCoverUrl);
              }}
            />

            {/* Link Activities */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-slate-300 font-semibold">اختر الأنشطة المضمنة في هذه المجموعة:</label>
                <span className="text-[11px] text-cyan-400 font-mono">
                  {selectedActivityIds.length} تم تحديدهم
                </span>
              </div>
              <div className="max-h-44 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                {activities.map((act) => {
                  const isChecked = selectedActivityIds.includes(act.id);
                  return (
                    <div
                      key={act.id}
                      onClick={() => handleToggleActivitySelection(act.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                        isChecked
                          ? 'bg-cyan-950/40 border border-cyan-800/50 text-white'
                          : 'hover:bg-slate-900 border border-transparent text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-slate-700 text-cyan-600 focus:ring-0"
                        />
                        <span className="truncate">{act.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0 mr-2">
                        {act.pricing?.egyptianB2C?.adultEGP || 0} ج.م
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={!nameInput.trim()}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                {editingCollection ? 'حفظ التعديلات' : 'إنشاء وحفظ المجموعة'}
              </button>
            </div>
          </form>
        </div>
      )}

      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs rounded-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">قاعدة البيانات محدثة</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ابحث باسم المجموعة أو الفئة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              selectedFilter === 'all'
                ? 'bg-cyan-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            الكل ({ownerCollections.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('active')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              selectedFilter === 'active'
                ? 'bg-cyan-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            نشطة ({ownerCollections.filter(c => c.status === 'active').length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('draft')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              selectedFilter === 'draft'
                ? 'bg-cyan-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            مسودة ({ownerCollections.filter(c => c.status === 'draft').length})
          </button>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCollections.map((col) => {
          const linkedActivities = activities.filter(a => col.activityIds.includes(a.id));
          return (
            <div
              key={col.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition-all flex flex-col justify-between group shadow-lg"
            >
              <div>
                {/* Image Cover */}
                <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                  <img
                    src={col.coverUrl}
                    alt={col.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-sm ${
                      col.status === 'active'
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-amber-500/90 text-slate-950'
                    }`}>
                      {col.status === 'active' ? 'نشطة في المتجر' : 'مسودة قيد الإعداد'}
                    </span>
                  </div>

                  {/* Category Pill */}
                  <div className="absolute bottom-3 right-3">
                    <span className="text-[10px] bg-slate-900/90 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-lg backdrop-blur-sm font-semibold flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-cyan-400" />
                      <span>{col.category}</span>
                    </span>
                  </div>

                  {/* Activities Count */}
                  <div className="absolute bottom-3 left-3">
                    <span className="text-[10px] bg-slate-950/80 text-white px-2 py-0.5 rounded font-mono border border-slate-800">
                      {col.activityIds.length} أنشطة مضمنة
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2.5">
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                    {col.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {col.description}
                  </p>

                  {/* Linked Activities Preview */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-500 block mb-1 font-medium">الأنشطة المندرجة بالمجموعة:</span>
                    {linkedActivities.length > 0 ? (
                      <div className="space-y-1">
                        {linkedActivities.slice(0, 2).map(act => (
                          <div key={act.id} className="text-[11px] text-slate-300 flex items-center gap-1.5 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                            <span className="truncate">{act.name}</span>
                          </div>
                        ))}
                        {linkedActivities.length > 2 && (
                          <span className="text-[10px] text-slate-500 font-mono block">
                            + {linkedActivities.length - 2} أنشطة إضافية أخرى
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-amber-400/80 italic">لم يتم ربط أنشطة بعد بهذه المجموعة</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 border-t border-slate-800/50 mt-3 flex items-center justify-between gap-2">
                {confirmDeleteId === col.id ? (
                  <div className="w-full flex items-center justify-between gap-2 bg-red-950/50 border border-red-800/60 rounded-lg px-2.5 py-1.5 animate-fade-in">
                    <span className="text-[11px] font-bold text-red-300">تأكيد حذف المجموعة؟</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleConfirmDeleteCollection(col.id)}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold rounded-md transition cursor-pointer"
                      >
                        حذف
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-md transition cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(col)}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-750 text-cyan-300 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>تعديل المجموعة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCollection(col.id)}
                      className="p-1.5 bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 rounded-lg transition border border-transparent hover:border-red-800/50 cursor-pointer"
                      title="حذف المجموعة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
