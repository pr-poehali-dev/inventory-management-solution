CREATE TABLE IF NOT EXISTS t_p72562668_inventory_management.order_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    icon VARCHAR(50) DEFAULT 'Circle',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO t_p72562668_inventory_management.order_statuses (name, color, icon, sort_order) VALUES
('Новый', '#3B82F6', 'CirclePlus', 1),
('В работе', '#F59E0B', 'Wrench', 2),
('Ожидание запчастей', '#8B5CF6', 'Clock', 3),
('Готов', '#10B981', 'CheckCircle', 4),
('Выдан', '#6B7280', 'PackageCheck', 5),
('Отменён', '#EF4444', 'XCircle', 6)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE t_p72562668_inventory_management.orders 
ADD COLUMN IF NOT EXISTS print_template_id INTEGER REFERENCES t_p72562668_inventory_management.print_templates(id);

COMMENT ON TABLE t_p72562668_inventory_management.order_statuses IS 'Статусы заказов';
COMMENT ON COLUMN t_p72562668_inventory_management.order_statuses.color IS 'Цвет статуса в формате HEX';
COMMENT ON COLUMN t_p72562668_inventory_management.order_statuses.icon IS 'Название иконки из lucide-react';