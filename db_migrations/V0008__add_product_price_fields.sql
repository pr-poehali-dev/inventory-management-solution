ALTER TABLE t_p72562668_inventory_management.products 
ADD COLUMN IF NOT EXISTS barcode VARCHAR(100),
ADD COLUMN IF NOT EXISTS retail_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS wholesale_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS discount_price NUMERIC(10,2);

COMMENT ON COLUMN t_p72562668_inventory_management.products.barcode IS 'Штрих-код товара';
COMMENT ON COLUMN t_p72562668_inventory_management.products.retail_price IS 'Розничная цена';
COMMENT ON COLUMN t_p72562668_inventory_management.products.wholesale_price IS 'Оптовая цена';
COMMENT ON COLUMN t_p72562668_inventory_management.products.discount_price IS 'Скидочная цена';