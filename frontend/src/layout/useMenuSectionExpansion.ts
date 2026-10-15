import { useCallback, useEffect, useMemo, useState } from 'react';

import type { MenuItemConfig, MenuSectionConfig } from '../config/menu';
import { menuItemTreeContainsKey } from '../config/menu';

const STORAGE_KEY = 'hms-nav-sections-open';

function readStored(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

function writeStored(next: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function useMenuSectionExpansion(
  sections: MenuSectionConfig[],
  selectedKey: string,
) {
  const sectionKeys = useMemo(() => sections.map((s) => s.key), [sections]);

  const [openByKey, setOpenByKey] = useState<Record<string, boolean>>(() => {
    const stored = readStored();
    const initial: Record<string, boolean> = {};
    for (const key of sectionKeys) {
      initial[key] = stored[key] ?? true;
    }
    return initial;
  });

  useEffect(() => {
    setOpenByKey((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const section of sections) {
        if (!next[section.key] && menuItemTreeContainsKey(section.items, selectedKey)) {
          next[section.key] = true;
          changed = true;
        }
      }
      if (changed) {
        writeStored(next);
      }
      return changed ? next : prev;
    });
  }, [sections, selectedKey]);

  useEffect(() => {
    setOpenByKey((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const key of sectionKeys) {
        if (!(key in next)) {
          next[key] = readStored()[key] ?? true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [sectionKeys]);

  const isOpen = useCallback(
    (sectionKey: string) => openByKey[sectionKey] ?? true,
    [openByKey],
  );

  const toggle = useCallback((sectionKey: string) => {
    setOpenByKey((prev) => {
      const next = { ...prev, [sectionKey]: !(prev[sectionKey] ?? true) };
      writeStored(next);
      return next;
    });
  }, []);

  return { isOpen, toggle };
}

export function useMenuGroupExpansion(selectedKey: string) {
  const [closedGroups, setClosedGroups] = useState<Set<string>>(() => new Set());

  const isGroupOpen = useCallback(
    (groupKey: string, children: MenuItemConfig[]) => {
      if (menuItemTreeContainsKey(children, selectedKey)) {
        return true;
      }
      return !closedGroups.has(groupKey);
    },
    [closedGroups, selectedKey],
  );

  const toggleGroup = useCallback((groupKey: string) => {
    setClosedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }, []);

  return { isGroupOpen, toggleGroup };
}
