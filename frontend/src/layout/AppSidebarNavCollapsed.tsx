import { Tooltip } from 'antd';

import { flattenSectionLinks, type MenuSectionConfig } from '../config/menu';
import { menuItemGlyph } from './menuItemGlyphs';

type AppSidebarNavCollapsedProps = {
  sections: MenuSectionConfig[];
  selectedKey: string;
  onNavigate: (key: string, path: string) => void;
};

export function AppSidebarNavCollapsed({
  sections,
  selectedKey,
  onNavigate,
}: AppSidebarNavCollapsedProps) {
  const links = flattenSectionLinks(sections);

  return (
    <nav className="app-shell-nav-collapsed" aria-label="Main (compact)">
      {links.map((item) => {
        if (!item.path) {
          return null;
        }
        const active = selectedKey === item.key;
        return (
          <Tooltip key={item.key} title={item.label} placement="right">
            <button
              type="button"
              className={`app-shell-nav-glyph-btn${active ? ' app-shell-nav-glyph-btn--active' : ''}`}
              onClick={() => onNavigate(item.key, item.path!)}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {menuItemGlyph(item.key, item.label)}
            </button>
          </Tooltip>
        );
      })}
    </nav>
  );
}
