-- Добавление уникальных ограничений для справочников

-- Уникальность названия бренда
ALTER TABLE t_p72562668_inventory_management.device_brands 
ADD CONSTRAINT device_brands_name_unique UNIQUE (name);

-- Уникальность комбинации бренд + модель
ALTER TABLE t_p72562668_inventory_management.device_models 
ADD CONSTRAINT device_models_brand_model_unique UNIQUE (brand_id, name);

-- Уникальность типа устройства
ALTER TABLE t_p72562668_inventory_management.device_types 
ADD CONSTRAINT device_types_name_unique UNIQUE (name);

-- Уникальность названия комплектации
ALTER TABLE t_p72562668_inventory_management.accessories 
ADD CONSTRAINT accessories_name_unique UNIQUE (name);

-- Уникальность названия неисправности
ALTER TABLE t_p72562668_inventory_management.malfunctions 
ADD CONSTRAINT malfunctions_name_unique UNIQUE (name);