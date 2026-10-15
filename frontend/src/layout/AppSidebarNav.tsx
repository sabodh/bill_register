import { DownOutlined, RightOutlined } from '@ant-design/icons';
import type { MenuItemConfig, MenuSectionConfig } from '../config/menu';
import { useMenuGroupExpansion, useMenuSectionExpansion } from './useMenuSectionExpansion';

type AppSidebarNavProps = {
  sections: MenuSectionConfig[];
  selectedKey: string;
  onNavigate: (key: string, path: string) => void;
};

function NavRow({
  item,
  selectedKey,
  depth,
  onNavigate,
  isGroupOpen,
  toggleGroup,
}: {
  item: MenuItemConfig;
  selectedKey: string;
  depth: number;
  onNavigate: (key: string, path: string) => void;
  isGroupOpen: (groupKey: string, children: MenuItemConfig[]) => boolean;
  toggleGroup: (groupKey: string) => void;
}) {
  const hasChildren = Boolean(item.children?.length);
  const isGroupOnly = hasChildren && !item.path;

  if (isGroupOnly) {
    const open = isGroupOpen(item.key, item.children!);
    return (
      <div className="app-shell-nav-group" data-depth={depth}>
        <button
          type="button"
          className={`app-shell-nav-group-toggle${open ? '' : ' app-shell-nav-group-toggle--closed'}`}
          onClick={() => toggleGroup(item.key)}
          aria-expanded={open}
        >
          <span>{item.label}</span>
          <DownOutlined className="app-shell-nav-section-caret" aria-hidden />
        </button>
        <div
          className={`app-shell-nav-section-body${open ? '' : ' app-shell-nav-section-body--closed'}`}
        >
          <div className="app-shell-nav-section-body-inner">
            {item.children!.map((child) => (
              <NavRow
                key={child.key}
                item={child}
                selectedKey={selectedKey}
                depth={depth + 1}
                onNavigate={onNavigate}
                isGroupOpen={isGroupOpen}
                toggleGroup={toggleGroup}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!item.path) {
    return null;
  }

  const active = selectedKey === item.key;
  return (
    <button
      type="button"
      className={`app-shell-nav-row${active ? ' app-shell-nav-row--active' : ''}${
        depth > 0 ? ' app-shell-nav-row--nested' : ''
      }`}
      onClick={() => onNavigate(item.key, item.path!)}
    >
      <span className="app-shell-nav-row-label">
        {item.label}
        {item.comingSoon ? <span className="app-shell-nav-soon">Soon</span> : null}
      </span>
      <RightOutlined className="app-shell-nav-chevron" aria-hidden />
    </button>
  );
}

export function AppSidebarNav({ sections, selectedKey, onNavigate }: AppSidebarNavProps) {
  const { isOpen, toggle } = useMenuSectionExpansion(sections, selectedKey);
  const { isGroupOpen, toggleGroup } = useMenuGroupExpansion(selectedKey);

  return (
    <nav className="app-shell-nav" aria-label="Main">
      {sections.map((section, sectionIndex) => {
        const open = isOpen(section.key);
        const showToggle = section.items.length > 0;

        return (
          <div
            key={section.key}
            className={`app-shell-nav-section${open ? '' : ' app-shell-nav-section--closed'}`}
          >
            {sectionIndex > 0 ? <div className="app-shell-nav-divider" role="presentation" /> : null}
            {showToggle ? (
              <button
                type="button"
                className="app-shell-nav-section-toggle"
                onClick={() => toggle(section.key)}
                aria-expanded={open}
              >
                <span className="app-shell-nav-section-title">{section.title}</span>
                <DownOutlined className="app-shell-nav-section-caret" aria-hidden />
              </button>
            ) : (
              <div className="app-shell-nav-section-title app-shell-nav-section-title--static">
                {section.title}
              </div>
            )}
            <div
              className={`app-shell-nav-section-body${open ? '' : ' app-shell-nav-section-body--closed'}`}
            >
              <div className="app-shell-nav-section-body-inner">
                {section.items.map((item) => (
                  <NavRow
                    key={item.key}
                    item={item}
                    selectedKey={selectedKey}
                    depth={0}
                    onNavigate={onNavigate}
                    isGroupOpen={isGroupOpen}
                    toggleGroup={toggleGroup}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
