import React from 'react';
import type { Activity } from '../../../types/activity';
import {
  Clock,
  Compass,
  DollarSign,
  FolderTree,
  MapPin,
  Share2,
  Shield,
  Truck,
  UserPlus
} from 'lucide-react';
import {
  ACTIVITY_TERMINOLOGY,
  type EntityTerminologyConfig
} from './entityCreationTerminology';

export interface CreationReferenceModalsProps {
  terms?: EntityTerminologyConfig;
  formData: Activity;
  showAddCityModal: boolean;
  setShowAddCityModal: (v: boolean) => void;
  newCityInput: string;
  setNewCityInput: (v: string) => void;
  handleAddCityToDb: (val: string) => void;

  showAddSiteModal: boolean;
  setShowAddSiteModal: (v: boolean) => void;
  newSiteInput: string;
  setNewSiteInput: (v: string) => void;
  handleAddSiteToDb: (val: string) => void;

  showAddDurationModal: boolean;
  setShowAddDurationModal: (v: boolean) => void;
  newDurationLabel: string;
  setNewDurationLabel: (v: string) => void;
  handleAddDurationPresetToDb: () => void;

  showAddStatusModal: boolean;
  setShowAddStatusModal: (v: boolean) => void;
  newCustomStatusInput: string;
  setNewCustomStatusInput: (v: string) => void;
  handleAddCustomStatusToDb: () => void;

  showAddChannelModal: boolean;
  setShowAddChannelModal: (v: boolean) => void;
  newChannelName: string;
  setNewChannelName: (v: string) => void;
  newChannelDesc: string;
  setNewChannelDesc: (v: string) => void;
  handleAddCustomChannelToDb: () => void;

  showAddPickupModal: boolean;
  setShowAddPickupModal: (v: boolean) => void;
  newPickupPointInput: string;
  setNewPickupPointInput: (v: string) => void;
  handleAddPickupPointToDb: (val: string) => void;

  showAddPricingPackageModal: boolean;
  setShowAddPricingPackageModal: (v: boolean) => void;
  newPricingPackageName: string;
  setNewPricingPackageName: (v: string) => void;
  handleSaveCurrentPricingAsPackage: () => void;

  showAddOwnerModal: boolean;
  setShowAddOwnerModal: (v: boolean) => void;
  newOwnerName: string;
  setNewOwnerName: (v: string) => void;
  newOwnerCompany: string;
  setNewOwnerCompany: (v: string) => void;
  newOwnerPhone: string;
  setNewOwnerPhone: (v: string) => void;
  newOwnerTier: string;
  setNewOwnerTier: (v: string) => void;
  handleAddNewOwnerSubmit: () => void;
  notifyDbSuccess: (msg: string) => void;

  showAddCategoryModal: boolean;
  setShowAddCategoryModal: (v: boolean) => void;
  targetParentCategoryPath: string[];
  newSubcategoryTitle: string;
  setNewSubcategoryTitle: (v: string) => void;
  addCategoryToTree: (path: string[], newName: string) => void;
}

export const CreationReferenceModals: React.FC<CreationReferenceModalsProps> = ({
  terms = ACTIVITY_TERMINOLOGY,
  formData,
  showAddCityModal,
  setShowAddCityModal,
  newCityInput,
  setNewCityInput,
  handleAddCityToDb,
  showAddSiteModal,
  setShowAddSiteModal,
  newSiteInput,
  setNewSiteInput,
  handleAddSiteToDb,
  showAddDurationModal,
  setShowAddDurationModal,
  newDurationLabel,
  setNewDurationLabel,
  handleAddDurationPresetToDb,
  showAddStatusModal,
  setShowAddStatusModal,
  newCustomStatusInput,
  setNewCustomStatusInput,
  handleAddCustomStatusToDb,
  showAddChannelModal,
  setShowAddChannelModal,
  newChannelName,
  setNewChannelName,
  newChannelDesc,
  setNewChannelDesc,
  handleAddCustomChannelToDb,
  showAddPickupModal,
  setShowAddPickupModal,
  newPickupPointInput,
  setNewPickupPointInput,
  handleAddPickupPointToDb,
  showAddPricingPackageModal,
  setShowAddPricingPackageModal,
  newPricingPackageName,
  setNewPricingPackageName,
  handleSaveCurrentPricingAsPackage,
  showAddOwnerModal,
  setShowAddOwnerModal,
  newOwnerName,
  setNewOwnerName,
  newOwnerCompany,
  setNewOwnerCompany,
  newOwnerPhone,
  setNewOwnerPhone,
  newOwnerTier,
  setNewOwnerTier,
  handleAddNewOwnerSubmit,
  notifyDbSuccess,
  showAddCategoryModal,
  setShowAddCategoryModal,
  targetParentCategoryPath,
  newSubcategoryTitle,
  setNewSubcategoryTitle,
  addCategoryToTree
}) => {
  return (
    <>
      {/* 1. Modal: Add City */}
      {showAddCityModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddCityModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>إضافة مدينة جديدة لقاعدة البيانات</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCityModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              autoFocus
              placeholder="أدخل اسم المدينة (مثل: سفاجا، القصير، الأقصر)..."
              value={newCityInput}
              onChange={(e) => setNewCityInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddCityModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleAddCityToDb(newCityInput)}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg"
              >
                حفظ واختيار
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Add Primary Site */}
      {showAddSiteModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddSiteModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>إضافة موقع جغرافي جديد</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddSiteModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              autoFocus
              placeholder="أدخل اسم الموقع أو المارينا..."
              value={newSiteInput}
              onChange={(e) => setNewSiteInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddSiteModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleAddSiteToDb(newSiteInput)}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg"
              >
                حفظ واختيار
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Add Custom Duration */}
      {showAddDurationModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddDurationModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>حفظ المدة الحالية في قاعدة البيانات</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddDurationModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <div className="text-xs space-y-2">
              <div className="text-slate-400">
                المدة الحالية:{' '}
                <strong className="text-white">
                  {formData.duration.days} أيام، {formData.duration.hours} ساعات،{' '}
                  {formData.duration.minutes} دقائق
                </strong>
              </div>
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">
                  تسمية مخصصة لهذا الخيار:
                </label>
                <input
                  type="text"
                  placeholder="مثال: 5 ساعات (رحلة غروب مميزة)..."
                  value={newDurationLabel}
                  onChange={(e) => setNewDurationLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddDurationModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleAddDurationPresetToDb}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg"
              >
                حفظ كخيار دائم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: Add Custom Status */}
      {showAddStatusModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddStatusModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>{terms.modalAddStatusTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddStatusModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <div className="text-xs space-y-2">
              <label className="text-[11px] text-slate-300 block mb-1">
                اسم الحالة الجديدة:
              </label>
              <input
                type="text"
                placeholder="مثال: 6. حجز مبكر للمجموعات فقط..."
                value={newCustomStatusInput}
                onChange={(e) => setNewCustomStatusInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddStatusModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleAddCustomStatusToDb}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg"
              >
                إضافة واعتماد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Add Custom Publishing Channel */}
      {showAddChannelModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddChannelModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-cyan-400" />
                <span>إضافة قناة نشر وتوزيع جديدة</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddChannelModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <div className="text-xs space-y-3">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
                  اسم القناة أو المتجر *
                </label>
                <input
                  type="text"
                  placeholder="مثال: تطبيق الجوال، شبكة شركاء B2B، وكالة حجز..."
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
                  وصف وتفاصيل القناة
                </label>
                <textarea
                  rows={2}
                  placeholder="اكتب شرحاً لطريقة النشر واستقبال الحجوزات عبر هذه القناة..."
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddChannelModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleAddCustomChannelToDb}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg"
              >
                إضافة القناة لقاعدة البيانات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: Add Pickup Point */}
      {showAddPickupModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddPickupModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-cyan-400" />
                <span>إضافة نقطة تجمع أو فندق لقاعدة البيانات</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPickupModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              autoFocus
              placeholder="أدخل اسم الفندق أو الممشى أو نقطة التجمع..."
              value={newPickupPointInput}
              onChange={(e) => setNewPickupPointInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddPickupModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleAddPickupPointToDb(newPickupPointInput)}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg"
              >
                حفظ واختيار
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: Save Pricing Package */}
      {showAddPricingPackageModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddPricingPackageModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                <span>حفظ باقة التسعير الحالية في قاعدة البيانات</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPricingPackageModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <div className="text-xs space-y-2">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-slate-300 space-y-1">
                <div>
                  البالغ: {formData.pricing.egyptianB2C.adultEGP} ج.م /{' '}
                  {formData.pricing.foreignerB2C.adultEUR}€
                </div>
                <div>
                  الطفل:{' '}
                  {formData.pricing.egyptianB2C.childEGP === 0
                    ? 'مجاني'
                    : `${formData.pricing.egyptianB2C.childEGP} ج.م`}{' '}
                  /{' '}
                  {formData.pricing.foreignerB2C.childEUR === 0
                    ? 'مجاني'
                    : `${formData.pricing.foreignerB2C.childEUR}€`}
                </div>
                <div>
                  الرضيع:{' '}
                  {formData.pricing.egyptianB2C.infantEGP === 0
                    ? 'مجاني'
                    : `${formData.pricing.egyptianB2C.infantEGP} ج.م`}{' '}
                  /{' '}
                  {formData.pricing.foreignerB2C.infantEUR === 0
                    ? 'مجاني'
                    : `${formData.pricing.foreignerB2C.infantEUR}€`}
                </div>
                <div>
                  خاصة: {formData.pricing.egyptianB2C.privateTotalEGP} ج.م /{' '}
                  {formData.pricing.foreignerB2C.privateTotalEUR}€
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
                  اسم باقة الأسعار:
                </label>
                <input
                  type="text"
                  placeholder="مثال: باقة عطلة الأسبوع، باقة رحلات الغطس..."
                  value={newPricingPackageName}
                  onChange={(e) => setNewPricingPackageName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddPricingPackageModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveCurrentPricingAsPackage}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg"
              >
                تأكيد الحفظ في قاعدة البيانات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal: Add Owner to Database */}
      {showAddOwnerModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddOwnerModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in text-right"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                <span>{terms.modalAddOwnerTitle}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowAddOwnerModal(false)}
                className="text-slate-400 hover:text-white text-xs p-1 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
                  اسم المالك الكامل *
                </label>
                <input
                  type="text"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  placeholder="مثال: كابتن محمود عبد الرحيم"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
                  اسم الشركة / المنشأة *
                </label>
                <input
                  type="text"
                  value={newOwnerCompany}
                  onChange={(e) => setNewOwnerCompany(e.target.value)}
                  placeholder="مثال: شركة مارينا هيروز لليخوت"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
                  رقم الهاتف / الواتساب
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={newOwnerPhone}
                  onChange={(e) => setNewOwnerPhone(e.target.value)}
                  placeholder="+201xxxxxxxxx"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500 text-right"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
                  باقة الاشتراك / التصنيف
                </label>
                <select
                  value={newOwnerTier}
                  onChange={(e) => setNewOwnerTier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500 font-medium"
                >
                  <option value="شخصي">شخصي (الافتراضية)</option>
                  <option value="باقة الشركاء المعتمدين">باقة الشركاء المعتمدين</option>
                  <option value="باقة المحترفين الفضية">باقة المحترفين الفضية</option>
                  <option value="باقة المحترفين الذهبية">باقة المحترفين الذهبية</option>
                  <option value="باقة كبار الشركاء VIP">باقة كبار الشركاء VIP</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddOwnerModal(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  handleAddNewOwnerSubmit();
                  notifyDbSuccess(terms.modalAddOwnerSuccessMessage(newOwnerName));
                }}
                disabled={!newOwnerName.trim() || !newOwnerCompany.trim()}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                {terms.ownerAssignSaveLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Modal: Add Category at Any Chosen Parent Level */}
      {showAddCategoryModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddCategoryModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">
                  {terms.modalAddCategoryTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  موقع الإضافة في الشجرة:
                </label>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-cyan-300 font-mono">
                  {targetParentCategoryPath.length === 0 ? (
                    <span>التصنيف الأساسي الرئيسي (المستوى 1)</span>
                  ) : (
                    <span>مستوى فرعي داخل: {targetParentCategoryPath.join(' ← ')}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  اسم التصنيف الجديد:
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="أدخل اسم التصنيف باللغة العربية..."
                  value={newSubcategoryTitle}
                  onChange={(e) => setNewSubcategoryTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {terms.modalAddCategoryHelperText}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newSubcategoryTitle.trim()) return;
                  addCategoryToTree(targetParentCategoryPath, newSubcategoryTitle.trim());
                  setNewSubcategoryTitle('');
                  setShowAddCategoryModal(false);
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                تأكيد وإضافة للتصنيفات
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
