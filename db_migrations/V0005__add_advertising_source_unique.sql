-- Добавление уникального ограничения для рекламных источников
ALTER TABLE t_p72562668_inventory_management.advertising_sources 
ADD CONSTRAINT advertising_sources_name_unique UNIQUE (name);
