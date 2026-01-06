import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

type MenuCategory = {
  id: string;
  icon: string;
  label: string;
  subcategories?: { id: string; label: string }[];
};

type SidebarProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

const menuCategories: MenuCategory[] = [
  { id: 'dashboard', icon: 'Home', label: 'Главная' },
  { id: 'orders', icon: 'ClipboardList', label: 'Заказы' },
  { id: 'sales', icon: 'TrendingUp', label: 'Продажи' },
  {
    id: 'warehouse',
    icon: 'Warehouse',
    label: 'Склад',
    subcategories: [
      { id: 'warehouse-stock', label: 'Остатки' },
      { id: 'warehouse-arrivals', label: 'Поступления' },
      { id: 'warehouse-transfers', label: 'Перемещения' },
      { id: 'warehouse-returns', label: 'Возвраты от клиентов' },
      { id: 'warehouse-inventory', label: 'Инвентаризация' },
      { id: 'warehouse-writeoffs', label: 'Списания' },
      { id: 'warehouse-settings', label: 'Настройки склада' },
    ],
  },
  { id: 'tasks', icon: 'CheckSquare', label: 'Задачи' },
  {
    id: 'finances',
    icon: 'DollarSign',
    label: 'Финансы',
    subcategories: [
      { id: 'finances-cashboxes', label: 'Кассы' },
      { id: 'finances-salary', label: 'Зарплата' },
      { id: 'finances-transactions', label: 'Транзакции' },
      { id: 'finances-cashflow', label: 'Денежный поток' },
      { id: 'finances-invoices', label: 'Счета' },
    ],
  },
  {
    id: 'analytics',
    icon: 'BarChart3',
    label: 'Аналитика',
    subcategories: [
      { id: 'analytics-reports', label: 'Отчёты' },
      { id: 'analytics-callcenter', label: 'Колл-центр' },
      { id: 'analytics-notifications', label: 'Оповещения' },
      { id: 'analytics-advertising', label: 'Реклама' },
    ],
  },
  {
    id: 'directories',
    icon: 'BookOpen',
    label: 'Справочники',
    subcategories: [
      { id: 'directories-products', label: 'Товары' },
      { id: 'directories-services', label: 'Работы' },
      { id: 'directories-contractors', label: 'Контрагенты' },
      { id: 'directories-devices', label: 'Устройства' },
      { id: 'directories-accessories', label: 'Комплектации' },
      { id: 'directories-malfunctions', label: 'Неисправности' },
      { id: 'directories-units', label: 'Ед. измерения' },
      { id: 'directories-money', label: 'Денежные статьи' },
    ],
  },
  { id: 'shop', icon: 'ShoppingBag', label: 'Интернет-магазин' },
];

const bottomMenuItems: MenuCategory[] = [
  { id: 'notifications', icon: 'Bell', label: 'Уведомления' },
  { 
    id: 'settings', 
    icon: 'Settings', 
    label: 'Настройки',
    subcategories: [
      { id: 'settings-users', label: 'Пользователи' },
      { id: 'settings-statuses', label: 'Статусы' },
      { id: 'settings-print-templates', label: 'Печатные формы' },
    ],
  },
  { id: 'knowledge', icon: 'HelpCircle', label: 'База знаний' },
  { id: 'account', icon: 'User', label: 'Данные аккаунта' },
];

export default function Sidebar({ activeTab, onTabChange, collapsed, onToggleCollapse }: SidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const isExpanded = (categoryId: string) => expandedCategories.includes(categoryId);

  return (
    <aside
      className={cn(
        'bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col transition-all duration-300 border-r border-slate-700',
        collapsed ? 'w-16' : 'w-72'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Сервис Клик
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">собственная разработка</p>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          title={collapsed ? 'Развернуть' : 'Свернуть'}
        >
          <Icon name={collapsed ? 'ChevronsRight' : 'ChevronsLeft'} size={20} />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {menuCategories.map((category) => (
          <div key={category.id}>
            <button
              onClick={() => {
                if (category.subcategories) {
                  toggleCategory(category.id);
                } else {
                  onTabChange(category.id);
                }
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group',
                activeTab === category.id || activeTab.startsWith(category.id + '-')
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-700 text-slate-300'
              )}
            >
              <Icon name={category.icon} size={20} className="flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left text-sm font-medium">{category.label}</span>
                  {category.subcategories && (
                    <Icon
                      name="ChevronDown"
                      size={16}
                      className={cn('transition-transform', isExpanded(category.id) && 'rotate-180')}
                    />
                  )}
                </>
              )}
            </button>

            {/* Subcategories */}
            {!collapsed && category.subcategories && isExpanded(category.id) && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-700 pl-2">
                {category.subcategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => onTabChange(sub.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm rounded-lg transition-all',
                      activeTab === sub.id
                        ? 'bg-blue-600/20 text-blue-300 font-medium'
                        : 'hover:bg-slate-700 text-slate-400'
                    )}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom Menu */}
      <div className="border-t border-slate-700 p-2 space-y-1">
        {bottomMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
              activeTab === item.id
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-700 text-slate-300'
            )}
            title={collapsed ? item.label : undefined}
          >
            <Icon name={item.icon} size={20} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
          </button>
        ))}
      </div>
    </aside>
  );
}