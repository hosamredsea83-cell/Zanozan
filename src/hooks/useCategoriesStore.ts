import { useEffect, useState } from 'react';
import type { Activity, CategoryRecord } from '../types/activity';
import type { CategoryNode } from '../components/activities/ActivityEditor';
import { INITIAL_CATEGORY_TREE } from '../components/activities/ActivityEditor';
import type { AppUser } from '../types/auth';
import type { LogAuditEventInput } from './useAuditLogStore';
import {
  createLocalCategoryRecord,
  deleteLocalCategoryRecord,
  getLocalCategoriesSnapshot,
  resetAndReseedLocalCategoriesDb,
  syncLocalCategoryActivityCounts,
  updateLocalCategoryRecord
} from '../db/localCategoriesDb';

export function useCategoriesStore(
  activities: Activity[],
  hasLoadedActivitiesFromDb: boolean,
  onRenameActivityCategoryPath: (prevPath: string[], levelIndex: number, nextName: string) => void,
  currentUser?: AppUser,
  onAuditLog?: (input: LogAuditEventInput) => void
) {
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>(INITIAL_CATEGORY_TREE);
  const [categoryRecords, setCategoryRecords] = useState<CategoryRecord[]>([]);

  useEffect(() => {
    let active = true;
    getLocalCategoriesSnapshot()
      .then((data) => {
        if (!active) return;
        setCategoryTree(data.tree);
        setCategoryRecords(data.records);
      })
      .catch((err) => {
        console.error('Failed to load local categories database:', err);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedActivitiesFromDb) return;
    let active = true;
    syncLocalCategoryActivityCounts(activities)
      .then((data) => {
        if (!active) return;
        setCategoryTree(data.tree);
        setCategoryRecords(data.records);
      })
      .catch((err) => {
        console.error('Failed to sync category activity counts:', err);
      });
    return () => {
      active = false;
    };
  }, [activities, hasLoadedActivitiesFromDb]);

  const handleCreateCategoryRecord = async (payload: {
    id?: string;
    name: string;
    handle?: string;
    description?: string;
    parentId?: string | null;
    parentPath?: string[];
  }): Promise<CategoryRecord> => {
    const result = await createLocalCategoryRecord(payload);
    setCategoryTree(result.tree);
    setCategoryRecords(result.records);
    if (currentUser) {
      onAuditLog?.({
        actor: currentUser,
        action: 'create',
        domain: 'category',
        entityId: result.record.id,
        entityName: result.record.name,
        summary: `أضاف ${currentUser.name} تصنيفاً جديداً «${result.record.name}»`
      });
    }
    return result.record;
  };

  const handleUpdateCategoryRecord = async (
    id: string,
    updates: { name?: string; handle?: string; description?: string }
  ): Promise<CategoryRecord> => {
    const result = await updateLocalCategoryRecord(id, updates, activities);
    setCategoryTree(result.tree);
    setCategoryRecords(result.records);

    if (
      result.previousPath &&
      result.renamedLevelIndex !== undefined &&
      result.previousPath.length > result.renamedLevelIndex
    ) {
      onRenameActivityCategoryPath(
        result.previousPath,
        result.renamedLevelIndex,
        result.record.name
      );
    }

    if (currentUser) {
      onAuditLog?.({
        actor: currentUser,
        action: 'update',
        domain: 'category',
        entityId: result.record.id,
        entityName: result.record.name,
        summary: `عدّل ${currentUser.name} التصنيف «${result.record.name}»`
      });
    }

    return result.record;
  };

  const handleDeleteCategoryRecord = async (id: string): Promise<void> => {
    const target = categoryRecords.find((c) => c.id === id);
    const result = await deleteLocalCategoryRecord(id, activities);
    setCategoryTree(result.tree);
    setCategoryRecords(result.records);
    if (currentUser) {
      onAuditLog?.({
        actor: currentUser,
        action: 'delete',
        domain: 'category',
        entityId: id,
        entityName: target?.name || id,
        summary: `حذف ${currentUser.name} التصنيف «${target?.name || id}»`
      });
    }
  };

  const handleAddCategoryToTree = (path: string[], newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    if (path.length === 0) {
      const newNode: CategoryNode = {
        id: `cat-${Date.now()}`,
        name: trimmed,
        children: []
      };
      setCategoryTree((prev) => [...prev, newNode]);
    } else {
      const updateNodes = (nodes: CategoryNode[], depth: number): CategoryNode[] => {
        return nodes.map((node) => {
          if (node.name === path[depth]) {
            if (depth === path.length - 1) {
              const newNode: CategoryNode = {
                id: `cat-${Date.now()}`,
                name: trimmed,
                children: []
              };
              return {
                ...node,
                children: [...(node.children || []), newNode]
              };
            } else if (node.children) {
              return {
                ...node,
                children: updateNodes(node.children, depth + 1)
              };
            }
          }
          return node;
        });
      };
      setCategoryTree((prev) => updateNodes(prev, 0));
    }

    void handleCreateCategoryRecord({
      name: trimmed,
      parentPath: path
    }).catch((err) => {
      console.error('Failed to persist category:', err);
    });
  };

  const handleResetCategories = async () => {
    const result = await resetAndReseedLocalCategoriesDb();
    setCategoryTree(result.tree);
    setCategoryRecords(result.records);
    if (currentUser) {
      onAuditLog?.({
        actor: currentUser,
        action: 'update',
        domain: 'category',
        entityId: 'categories-tree',
        entityName: 'شجرة الفئات والتصنيفات',
        summary: `أعاد ${currentUser.name} تهيئة شجرة الفئات الأساسية الأربعة بالمرجع الموحد`
      });
    }
  };

  return {
    categoryTree,
    categoryRecords,
    handleCreateCategoryRecord,
    handleUpdateCategoryRecord,
    handleDeleteCategoryRecord,
    handleAddCategoryToTree,
    handleResetCategories
  };
}
