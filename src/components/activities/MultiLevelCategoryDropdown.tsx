import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronLeft, ChevronDown, Plus, Check, X, ArrowRight, CornerDownLeft, Sparkles, FolderPlus } from 'lucide-react';
import type { CategoryNode } from './ActivityEditor';

interface MultiLevelCategoryDropdownProps {
  categoryTree: CategoryNode[];
  selectedPath: string[];
  onSelectPath: (path: string[]) => void;
  onAddCategory: (parentPath: string[], name: string) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
}

interface FlattenedItem {
  id: string;
  name: string;
  path: string[];
  level: number;
  hasChildren: boolean;
}

export const MultiLevelCategoryDropdown: React.FC<MultiLevelCategoryDropdownProps> = ({
  categoryTree,
  selectedPath,
  onSelectPath,
  onAddCategory,
  label = 'Category / التصنيف',
  placeholder = 'Choose a product category / اختر تصنيف النشاط',
  helperText = 'قائمة هرمية متعددة المستويات تتيح التصفح والاختيار المباشر والإضافة في أي مستوى'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [drillPath, setDrillPath] = useState<string[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const newCatInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAddingNew(false);
        setSearchQuery('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Focus new category input when adding mode opens
  useEffect(() => {
    if (isAddingNew && newCatInputRef.current) {
      newCatInputRef.current.focus();
    }
  }, [isAddingNew]);

  // Flatten the entire category tree for global search across all levels
  const allFlattenedNodes = useMemo(() => {
    const flatten = (nodes: CategoryNode[], prefix: string[] = []): FlattenedItem[] => {
      let result: FlattenedItem[] = [];
      for (const node of nodes) {
        const currentPath = [...prefix, node.name];
        const hasChildren = Boolean(node.children && node.children.length > 0);
        result.push({
          id: node.id || currentPath.join('>'),
          name: node.name,
          path: currentPath,
          level: currentPath.length,
          hasChildren
        });
        if (node.children && node.children.length > 0) {
          result = result.concat(flatten(node.children, currentPath));
        }
      }
      return result;
    };
    return flatten(categoryTree);
  }, [categoryTree]);

  // Get current active nodes at the current drill level
  const currentLevelNodes = useMemo(() => {
    if (drillPath.length === 0) {
      return categoryTree;
    }

    let currentList = categoryTree;
    for (const segment of drillPath) {
      const match = currentList.find((n) => n.name === segment);
      if (match && match.children) {
        currentList = match.children;
      } else {
        return [];
      }
    }
    return currentList;
  }, [categoryTree, drillPath]);

  // Filtered nodes when searching
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allFlattenedNodes.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.path.some((p) => p.toLowerCase().includes(q))
    );
  }, [searchQuery, allFlattenedNodes]);

  // Handle drill down into a subcategory
  const handleDrillDown = (nodeName: string) => {
    setDrillPath((prev) => [...prev, nodeName]);
    setIsAddingNew(false);
  };

  // Handle back navigation
  const handleGoBack = () => {
    setDrillPath((prev) => prev.slice(0, -1));
    setIsAddingNew(false);
  };

  // Jump to specific breadcrumb level in drilldown
  const handleJumpToLevel = (levelIndex: number) => {
    if (levelIndex < 0) {
      setDrillPath([]);
    } else {
      setDrillPath((prev) => prev.slice(0, levelIndex + 1));
    }
    setIsAddingNew(false);
  };

  // Select a category path and close dropdown
  const handleSelect = (path: string[]) => {
    onSelectPath(path);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Add new category at the current drill level
  const handleAddNewSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    onAddCategory(drillPath, trimmed);
    setNewCategoryName('');
    setIsAddingNew(false);
  };

  // Selected label text
  const selectedDisplay = selectedPath.length > 0 ? selectedPath.join(' ← ') : '';

  return (
    <div className="relative w-full space-y-1.5" ref={containerRef}>
      {/* Label and Info */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <span>{label}</span>
          {selectedPath.length > 0 && (
            <span className="text-[10px] font-normal px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 rounded font-mono">
              المستوى: L{selectedPath.length}
            </span>
          )}
        </label>
        {helperText && (
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {helperText}
          </span>
        )}
      </div>

      {/* Main Trigger Box (Clean borders & emerald focus) */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-between gap-2 bg-slate-900 border text-xs md:text-sm shadow-sm select-none ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-slate-900/95'
            : selectedPath.length > 0
            ? 'border-slate-700 hover:border-slate-600 bg-slate-900'
            : 'border-slate-700 hover:border-slate-600 text-slate-400 bg-slate-900'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedPath.length > 0 ? (
            <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="font-semibold text-white tracking-wide truncate">
                {selectedPath[selectedPath.length - 1]}
              </span>
              <span className="text-slate-400 text-xs truncate">
                ({selectedDisplay})
              </span>
            </div>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedPath.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectPath([]);
              }}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400 transition-colors"
              title="مسح التصنيف"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-emerald-400' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Card (Multi-Level Flyout / Drilldown Panel) */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Top Search Input */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/70">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search / ابحث في جميع مستويات التصنيف..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pr-9 pl-8 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Drilldown Navigation Header (When not searching & drilled into subcategories) */}
          {!searchQuery && drillPath.length > 0 && (
            <div className="bg-slate-950/90 px-3 py-2 border-b border-slate-800/80 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors py-1 px-1.5 rounded hover:bg-emerald-950/40"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>رجوع للخلف (المستوى السابق)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect(drillPath)}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-white bg-emerald-900/40 hover:bg-emerald-700/60 border border-emerald-600/40 px-2 py-1 rounded transition-colors"
                  title="اعتماد هذا التصنيف نفسه بدون الدخول في تفرعاته"
                >
                  <Check className="w-3 h-3" />
                  <span>اختيار هذا المستوى</span>
                </button>
              </div>

              {/* Breadcrumbs Trail */}
              <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-400 pt-0.5 border-t border-slate-800/50">
                <button
                  type="button"
                  onClick={() => handleJumpToLevel(-1)}
                  className="hover:text-emerald-300 font-medium transition-colors"
                >
                  الرئيسية
                </button>
                {drillPath.map((seg, idx) => (
                  <React.Fragment key={idx}>
                    <span className="text-slate-600">‹</span>
                    <button
                      type="button"
                      onClick={() => handleJumpToLevel(idx)}
                      className={`hover:text-emerald-300 transition-colors ${
                        idx === drillPath.length - 1 ? 'text-white font-bold' : ''
                      }`}
                    >
                      {seg}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin scrollbar-thumb-slate-700">
            {/* Case 1: Search Query active */}
            {searchQuery ? (
              searchResults.length > 0 ? (
                <div>
                  <div className="px-3.5 py-1.5 bg-slate-950 text-[11px] text-slate-400 font-medium flex items-center justify-between">
                    <span>نتائج البحث ({searchResults.length}):</span>
                    <span className="text-[10px] text-emerald-400">انقر للاختيار المباشر</span>
                  </div>
                  {searchResults.map((item, idx) => {
                    const isSelected = selectedPath.join('>') === item.path.join('>');
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelect(item.path)}
                        className={`px-4 py-2.5 flex items-center justify-between gap-3 text-xs md:text-sm cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-950/50 text-emerald-200'
                            : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{item.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded font-mono">
                              L{item.level}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 truncate">
                            {item.path.join(' ← ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {isSelected ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <button
                              type="button"
                              className="text-[10px] text-emerald-400 border border-emerald-600/30 px-2 py-0.5 rounded hover:bg-emerald-950"
                            >
                              اختيار
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center space-y-2">
                  <p className="text-xs text-slate-400">
                    لا توجد تصنيفات تطابق البحث: <strong className="text-white">"{searchQuery}"</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onAddCategory(drillPath, searchQuery.trim());
                      setSearchQuery('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة "{searchQuery.trim()}" كتصنيف جديد في هذا المستوى</span>
                  </button>
                </div>
              )
            ) : (
              /* Case 2: Normal Tree Navigation */
              <div>
                {currentLevelNodes.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-400">
                    لا توجد فئات فرعية مسجلة داخل هذا المستوى حالياً.
                  </div>
                ) : (
                  currentLevelNodes.map((node) => {
                    const nodePath = [...drillPath, node.name];
                    const hasChildren = Boolean(node.children && node.children.length > 0);
                    const isSelected = selectedPath.join('>') === nodePath.join('>');

                    return (
                      <div
                        key={node.id}
                        onClick={() => {
                          if (hasChildren) {
                            handleDrillDown(node.name);
                          } else {
                            handleSelect(nodePath);
                          }
                        }}
                        className={`px-4 py-3 flex items-center justify-between text-xs md:text-sm cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-950/40 text-emerald-200'
                            : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${hasChildren ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                          <span className="font-medium">{node.name}</span>
                          {node.children && node.children.length > 0 && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({node.children.length})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* If has children, show select button AND drilldown chevron */}
                          {hasChildren ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelect(nodePath);
                                }}
                                className="text-[10px] text-emerald-400 hover:text-white bg-slate-800 hover:bg-emerald-700/60 border border-slate-700 hover:border-emerald-600/50 px-2 py-0.5 rounded transition-colors"
                                title="اختيار هذا التصنيف مباشرة دون فتح التفرعات"
                              >
                                اختيار
                              </button>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDrillDown(node.name);
                                }}
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
                                title="تصفح الفئات الفرعية"
                              >
                                <ChevronLeft className="w-4 h-4 text-slate-400" />
                              </div>
                            </div>
                          ) : (
                            isSelected && <Check className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Bottom Action: Add Category to Current Level */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800">
            {isAddingNew ? (
              <form onSubmit={handleAddNewSubmit} className="flex items-center gap-2">
                <input
                  ref={newCatInputRef}
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={`اسم التصنيف الجديد في ${drillPath.length === 0 ? 'المستوى الرئيسي' : `"${drillPath[drillPath.length - 1]}"`}...`}
                  className="flex-1 bg-slate-900 border border-emerald-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newCategoryName.trim()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewCategoryName('');
                  }}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                >
                  إلغاء
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  + إضافة تصنيف جديد في{' '}
                  {drillPath.length === 0
                    ? 'المستوى الرئيسي (L1)'
                    : `"${drillPath[drillPath.length - 1]}" (L${drillPath.length + 1})`}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
