-- Таблица: Заказы
CREATE TABLE t_p72562668_inventory_management.orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    contractor_id INTEGER REFERENCES t_p72562668_inventory_management.contractors(id),
    phone VARCHAR(20),
    address TEXT,
    advertising_source_id INTEGER REFERENCES t_p72562668_inventory_management.advertising_sources(id),
    serial_number VARCHAR(100),
    device_type_id INTEGER REFERENCES t_p72562668_inventory_management.device_types(id),
    brand_id INTEGER REFERENCES t_p72562668_inventory_management.device_brands(id),
    model_id INTEGER REFERENCES t_p72562668_inventory_management.device_models(id),
    color VARCHAR(50),
    appearance TEXT,
    appearance_photos TEXT,
    malfunction_id INTEGER REFERENCES t_p72562668_inventory_management.malfunctions(id),
    malfunction_description TEXT,
    security_code VARCHAR(50),
    device_turns_on BOOLEAN,
    failure_reason TEXT,
    repair_description TEXT,
    return_defective_parts BOOLEAN DEFAULT false,
    estimated_price DECIMAL(10, 2),
    prepayment DECIMAL(10, 2) DEFAULT 0,
    deadline TIMESTAMP,
    manager_id INTEGER REFERENCES t_p72562668_inventory_management.users(id),
    receiver_comment TEXT,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица: Комплектация заказа
CREATE TABLE t_p72562668_inventory_management.order_accessories (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES t_p72562668_inventory_management.orders(id),
    accessory_id INTEGER REFERENCES t_p72562668_inventory_management.accessories(id),
    is_present BOOLEAN DEFAULT true
);

-- Таблица: Работы в заказе
CREATE TABLE t_p72562668_inventory_management.order_services (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES t_p72562668_inventory_management.orders(id),
    product_id INTEGER REFERENCES t_p72562668_inventory_management.products(id),
    quantity DECIMAL(10, 2) DEFAULT 1,
    price DECIMAL(10, 2),
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2)
);

-- Таблица: Печатные формы
CREATE TABLE t_p72562668_inventory_management.print_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    template_type VARCHAR(50) DEFAULT 'order',
    content TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица: Настройки резервного копирования
CREATE TABLE t_p72562668_inventory_management.backup_settings (
    id SERIAL PRIMARY KEY,
    backup_type VARCHAR(20) DEFAULT 'local',
    ftp_host VARCHAR(100),
    ftp_port INTEGER DEFAULT 21,
    ftp_user VARCHAR(100),
    ftp_password VARCHAR(100),
    ftp_path VARCHAR(200),
    schedule_cron VARCHAR(50),
    is_active BOOLEAN DEFAULT false,
    last_backup TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
CREATE INDEX idx_orders_contractor ON t_p72562668_inventory_management.orders(contractor_id);
CREATE INDEX idx_orders_status ON t_p72562668_inventory_management.orders(status);
CREATE INDEX idx_orders_created ON t_p72562668_inventory_management.orders(created_at);
CREATE INDEX idx_orders_number ON t_p72562668_inventory_management.orders(order_number);

-- Вставка тестовой печатной формы
INSERT INTO t_p72562668_inventory_management.print_templates (name, template_type, content, is_default) VALUES 
    ('Стандартная квитанция', 'order', '<div class="receipt"><h2>Квитанция приёма устройства №{{order_number}}</h2><div><strong>Клиент:</strong> {{client_name}}</div><div><strong>Телефон:</strong> {{phone}}</div><div><strong>Устройство:</strong> {{device}}</div><div><strong>Неисправность:</strong> {{malfunction}}</div><div><strong>Ориентировочная стоимость:</strong> {{price}} руб.</div><div><strong>Предоплата:</strong> {{prepayment}} руб.</div><div><strong>Дата приёма:</strong> {{date}}</div></div>', true);