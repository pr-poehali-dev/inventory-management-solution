-- Добавляем поля для пользователей
ALTER TABLE t_p72562668_inventory_management.users 
    ADD COLUMN IF NOT EXISTS position VARCHAR(100),
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Добавляем новые поля в таблицу orders
ALTER TABLE t_p72562668_inventory_management.orders 
    ADD COLUMN IF NOT EXISTS manager_id INTEGER,
    ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS recommendation TEXT;

-- Обновляем таблицу order_history для файлов
ALTER TABLE t_p72562668_inventory_management.order_history 
    ADD COLUMN IF NOT EXISTS attachments JSONB;

-- Вставляем тестовых пользователей
INSERT INTO t_p72562668_inventory_management.users (username, password, full_name, email, role, position, phone, is_active) VALUES
('ivanov', 'temp123', 'Иванов Иван Иванович', 'ivanov@example.com', 'manager', 'Менеджер', '+79991234567', true),
('petrova', 'temp123', 'Петрова Анна Сергеевна', 'petrova@example.com', 'admin', 'Администратор', '+79991234568', true),
('sidorov', 'temp123', 'Сидоров Петр Алексеевич', 'sidorov@example.com', 'master', 'Мастер', '+79991234569', true)
ON CONFLICT DO NOTHING;

-- Вставляем тестовые товары
INSERT INTO t_p72562668_inventory_management.products (name, article, product_type, category, sale_price, warranty_months, description, quantity, is_active) VALUES
('Дисплей iPhone 12', 'DSP-IP12', 'Запчасти', 'Дисплеи', 4500.00, 3, 'Оригинальный дисплей для iPhone 12', 5, true),
('Аккумулятор Samsung Galaxy S21', 'BAT-S21', 'Запчасти', 'Батареи', 1200.00, 6, 'Батарея повышенной емкости', 10, true),
('Задняя крышка Xiaomi Redmi Note 10', 'COV-RN10', 'Запчасти', 'Корпус', 800.00, 1, 'Стеклянная задняя панель', 7, true),
('Камера основная iPhone 13', 'CAM-IP13', 'Запчасти', 'Камеры', 3200.00, 3, 'Основная камера 12MP', 3, true),
('Разъем зарядки Type-C', 'CHG-TYPEC', 'Запчасти', 'Разъемы', 350.00, 1, 'Универсальный разъем USB Type-C', 15, true),
('Динамик полифонический', 'SPK-POLY', 'Запчасти', 'Аудио', 450.00, 1, 'Полифонический громкий динамик', 12, true),
('Микрофон', 'MIC-STD', 'Запчасти', 'Аудио', 250.00, 1, 'Стандартный микрофон', 20, true),
('Шлейф кнопок громкости', 'FLX-VOL', 'Запчасти', 'Шлейфы', 400.00, 1, 'Шлейф с кнопками громкости', 8, true),
('Стекло защитное', 'GLS-PROT', 'Аксессуары', 'Защита', 300.00, 0, 'Защитное стекло 9H', 50, true),
('Чехол силиконовый', 'CASE-SIL', 'Аксессуары', 'Защита', 200.00, 0, 'Прозрачный силиконовый чехол', 30, true);

-- Вставляем тестовые работы
INSERT INTO t_p72562668_inventory_management.services (name, article, price, warranty_months, description, is_active) VALUES
('Замена дисплея', 'SRV-DSP', 1500.00, 3, 'Замена дисплейного модуля', true),
('Замена аккумулятора', 'SRV-BAT', 800.00, 6, 'Замена батареи с проверкой', true),
('Замена задней крышки', 'SRV-COV', 600.00, 1, 'Замена задней панели корпуса', true),
('Замена камеры', 'SRV-CAM', 1000.00, 3, 'Замена основной камеры', true),
('Замена разъема зарядки', 'SRV-CHG', 900.00, 3, 'Замена порта зарядки', true),
('Чистка от влаги', 'SRV-WTR', 1200.00, 0, 'Ультразвуковая чистка после попадания влаги', true),
('Диагностика', 'SRV-DIAG', 0.00, 0, 'Комплексная диагностика устройства', true),
('Перепрошивка ПО', 'SRV-FW', 1500.00, 1, 'Установка/восстановление программного обеспечения', true),
('Замена динамика', 'SRV-SPK', 700.00, 1, 'Замена полифонического динамика', true),
('Замена микрофона', 'SRV-MIC', 650.00, 1, 'Замена основного микрофона', true);