"""API для управления заказами сервисного центра"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

SCHEMA = 't_p72562668_inventory_management'

def get_db_connection():
    """Создание подключения к БД"""
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    return conn, cursor

def handler(event: dict, context) -> dict:
    """Обработчик запросов к API заказов"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    try:
        conn, cursor = get_db_connection()
        
        if method == 'GET':
            order_id = event.get('queryStringParameters', {}).get('id')
            
            if order_id:
                cursor.execute(f"""
                    SELECT o.*, 
                           c.surname || ' ' || c.name || ' ' || COALESCE(c.patronymic, '') as contractor_name,
                           dt.name as device_type_name,
                           db.name as brand_name,
                           dm.name as model_name,
                           ads.name as advertising_source
                    FROM {SCHEMA}.orders o
                    LEFT JOIN {SCHEMA}.contractors c ON o.contractor_id = c.id
                    LEFT JOIN {SCHEMA}.device_types dt ON o.device_type_id = dt.id
                    LEFT JOIN {SCHEMA}.device_brands db ON o.brand_id = db.id
                    LEFT JOIN {SCHEMA}.device_models dm ON o.model_id = dm.id
                    LEFT JOIN {SCHEMA}.advertising_sources ads ON o.advertising_source_id = ads.id
                    WHERE o.id = %s
                """, (order_id,))
                order = cursor.fetchone()
                if order:
                    result = dict(order)
                    cursor.execute(f"""
                        SELECT a.name
                        FROM {SCHEMA}.order_accessories oa
                        JOIN {SCHEMA}.accessories a ON oa.accessory_id = a.id
                        WHERE oa.order_id = %s AND oa.is_present = true
                    """, (order_id,))
                    accessories = [row['name'] for row in cursor.fetchall()]
                    result['accessories'] = accessories
                else:
                    result = None
            else:
                status_filter = event.get('queryStringParameters', {}).get('status')
                query = f"""
                    SELECT o.id, o.order_number, o.status, o.created_at, o.estimated_price,
                           c.surname || ' ' || c.name as contractor_name,
                           o.phone,
                           db.name || ' ' || dm.name as device
                    FROM {SCHEMA}.orders o
                    LEFT JOIN {SCHEMA}.contractors c ON o.contractor_id = c.id
                    LEFT JOIN {SCHEMA}.device_brands db ON o.brand_id = db.id
                    LEFT JOIN {SCHEMA}.device_models dm ON o.model_id = dm.id
                """
                
                if status_filter and status_filter != 'all':
                    query += f" WHERE o.status = '{status_filter}'"
                
                query += " ORDER BY o.created_at DESC LIMIT 100"
                cursor.execute(query)
                orders = cursor.fetchall()
                result = [dict(order) for order in orders]
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            cursor.execute(f"""
                SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1 as next_num
                FROM {SCHEMA}.orders 
                WHERE order_number LIKE %s
            """, (f"{datetime.now().year}-%",))
            result_row = cursor.fetchone()
            next_num = result_row['next_num'] if result_row else 1
            order_number = f"{datetime.now().year}-{str(next_num).zfill(3)}"
            
            deadline = None
            if body.get('deadline_date'):
                deadline = body.get('deadline_date') + ' ' + body.get('deadline_time', '00:00')
            
            contractor_id = None
            contractor_name = body.get('contractor_name')
            if contractor_name:
                parts = contractor_name.split()
                surname = parts[0] if len(parts) > 0 else ''
                name = parts[1] if len(parts) > 1 else ''
                patronymic = parts[2] if len(parts) > 2 else ''
                
                cursor.execute(f"""
                    INSERT INTO {SCHEMA}.contractors (surname, name, patronymic)
                    VALUES (%s, %s, %s)
                    ON CONFLICT DO NOTHING
                    RETURNING id
                """, (surname, name, patronymic))
                result_row = cursor.fetchone()
                if result_row:
                    contractor_id = result_row['id']
                else:
                    cursor.execute(f"""
                        SELECT id FROM {SCHEMA}.contractors 
                        WHERE surname = %s AND name = %s AND patronymic = %s
                        LIMIT 1
                    """, (surname, name, patronymic))
                    result_row = cursor.fetchone()
                    if result_row:
                        contractor_id = result_row['id']
            
            brand_id = None
            brand_name = body.get('brand')
            if brand_name:
                cursor.execute(f"""
                    INSERT INTO {SCHEMA}.device_brands (name)
                    VALUES (%s)
                    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                    RETURNING id
                """, (brand_name,))
                result_row = cursor.fetchone()
                if result_row:
                    brand_id = result_row['id']
            
            model_id = None
            model_name = body.get('model')
            if model_name and brand_id:
                cursor.execute(f"""
                    INSERT INTO {SCHEMA}.device_models (brand_id, name)
                    VALUES (%s, %s)
                    ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name
                    RETURNING id
                """, (brand_id, model_name))
                result_row = cursor.fetchone()
                if result_row:
                    model_id = result_row['id']
            
            device_type_id = None
            device_type = body.get('device_type')
            if device_type:
                type_map = {'phone': 'Смартфон', 'tablet': 'Планшет', 'laptop': 'Ноутбук', 'watch': 'Часы'}
                device_type_name = type_map.get(device_type, device_type)
                cursor.execute(f"""
                    INSERT INTO {SCHEMA}.device_types (name)
                    VALUES (%s)
                    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                    RETURNING id
                """, (device_type_name,))
                result_row = cursor.fetchone()
                if result_row:
                    device_type_id = result_row['id']
            
            advertising_source_id = None
            advertising_source = body.get('advertising_source')
            if advertising_source:
                cursor.execute(f"""
                    INSERT INTO {SCHEMA}.advertising_sources (name)
                    VALUES (%s)
                    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                    RETURNING id
                """, (advertising_source,))
                result_row = cursor.fetchone()
                if result_row:
                    advertising_source_id = result_row['id']
            
            cursor.execute(f"""
                INSERT INTO {SCHEMA}.orders (
                    order_number, contractor_id, phone, address, advertising_source_id, serial_number, 
                    device_type_id, brand_id, model_id, color, appearance,
                    malfunction_description, security_code, device_turns_on, failure_reason,
                    repair_description, return_defective_parts, estimated_price, prepayment,
                    deadline, receiver_comment, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'new')
                RETURNING id
            """, (
                order_number,
                contractor_id,
                body.get('phone'),
                body.get('address'),
                advertising_source_id,
                body.get('serial_number'),
                device_type_id,
                brand_id,
                model_id,
                body.get('color'),
                body.get('appearance'),
                body.get('malfunction'),
                body.get('security_code'),
                body.get('device_turns_on', False),
                body.get('failure_reason'),
                body.get('repair_description'),
                body.get('return_defective_parts', False),
                body.get('estimated_price'),
                body.get('prepayment') or 0,
                deadline,
                body.get('receiver_comment')
            ))
            
            order_id = cursor.fetchone()['id']
            
            accessories_list = body.get('accessories', [])
            if accessories_list:
                for accessory_name in accessories_list:
                    cursor.execute(f"""
                        INSERT INTO {SCHEMA}.accessories (name)
                        VALUES (%s)
                        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                        RETURNING id
                    """, (accessory_name,))
                    accessory_row = cursor.fetchone()
                    if accessory_row:
                        cursor.execute(f"""
                            INSERT INTO {SCHEMA}.order_accessories (order_id, accessory_id, is_present)
                            VALUES (%s, %s, true)
                        """, (order_id, accessory_row['id']))
            
            conn.commit()
            result = {'id': order_id, 'order_number': order_number}
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            order_id = body.get('id')
            
            deadline = None
            if body.get('deadline_date'):
                deadline = body.get('deadline_date') + ' ' + body.get('deadline_time', '00:00')
            elif body.get('deadline'):
                deadline = body.get('deadline')
            
            contractor_id = None
            contractor_name = body.get('contractor_name')
            if contractor_name:
                parts = contractor_name.split()
                surname = parts[0] if len(parts) > 0 else ''
                name = parts[1] if len(parts) > 1 else ''
                patronymic = parts[2] if len(parts) > 2 else ''
                
                cursor.execute(f"""
                    INSERT INTO {SCHEMA}.contractors (surname, name, patronymic)
                    VALUES (%s, %s, %s)
                    ON CONFLICT DO NOTHING
                    RETURNING id
                """, (surname, name, patronymic))
                result_row = cursor.fetchone()
                if result_row:
                    contractor_id = result_row['id']
                else:
                    cursor.execute(f"""
                        SELECT id FROM {SCHEMA}.contractors 
                        WHERE surname = %s AND name = %s AND patronymic = %s
                        LIMIT 1
                    """, (surname, name, patronymic))
                    result_row = cursor.fetchone()
                    if result_row:
                        contractor_id = result_row['id']
            
            brand_id = None
            brand_name = body.get('brand')
            if brand_name:
                cursor.execute(f"""
                    INSERT INTO {SCHEMA}.device_brands (name)
                    VALUES (%s)
                    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                    RETURNING id
                """, (brand_name,))
                result_row = cursor.fetchone()
                if result_row:
                    brand_id = result_row['id']
            
            model_id = None
            model_name = body.get('model')
            if model_name and brand_id:
                cursor.execute(f"""
                    INSERT INTO {SCHEMA}.device_models (brand_id, name)
                    VALUES (%s, %s)
                    ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name
                    RETURNING id
                """, (brand_id, model_name))
                result_row = cursor.fetchone()
                if result_row:
                    model_id = result_row['id']
            
            device_type_id = None
            device_type = body.get('device_type')
            if device_type:
                type_map = {'phone': 'Смартфон', 'tablet': 'Планшет', 'laptop': 'Ноутбук', 'watch': 'Часы'}
                device_type_name = type_map.get(device_type, device_type)
                cursor.execute(f"""
                    INSERT INTO {SCHEMA}.device_types (name)
                    VALUES (%s)
                    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                    RETURNING id
                """, (device_type_name,))
                result_row = cursor.fetchone()
                if result_row:
                    device_type_id = result_row['id']
            
            advertising_source_id = None
            advertising_source = body.get('advertising_source')
            if advertising_source:
                cursor.execute(f"""
                    INSERT INTO {SCHEMA}.advertising_sources (name)
                    VALUES (%s)
                    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                    RETURNING id
                """, (advertising_source,))
                result_row = cursor.fetchone()
                if result_row:
                    advertising_source_id = result_row['id']
            
            cursor.execute(f"""
                UPDATE {SCHEMA}.orders SET
                    contractor_id = %s, phone = %s, address = %s, advertising_source_id = %s, serial_number = %s,
                    device_type_id = %s, brand_id = %s, model_id = %s, color = %s,
                    appearance = %s, malfunction_description = %s, security_code = %s,
                    device_turns_on = %s, failure_reason = %s, repair_description = %s,
                    return_defective_parts = %s, estimated_price = %s, prepayment = %s,
                    deadline = %s, receiver_comment = %s, status = %s, updated_at = NOW()
                WHERE id = %s
            """, (
                contractor_id,
                body.get('phone'),
                body.get('address'),
                advertising_source_id,
                body.get('serial_number'),
                device_type_id,
                brand_id,
                model_id,
                body.get('color'),
                body.get('appearance'),
                body.get('malfunction'),
                body.get('security_code'),
                body.get('device_turns_on', False),
                body.get('failure_reason'),
                body.get('repair_description'),
                body.get('return_defective_parts', False),
                body.get('estimated_price'),
                body.get('prepayment') or 0,
                deadline,
                body.get('receiver_comment'),
                body.get('status', 'new'),
                order_id
            ))
            
            cursor.execute(f"DELETE FROM {SCHEMA}.order_accessories WHERE order_id = %s", (order_id,))
            
            accessories_list = body.get('accessories', [])
            if accessories_list:
                for accessory_name in accessories_list:
                    cursor.execute(f"""
                        INSERT INTO {SCHEMA}.accessories (name)
                        VALUES (%s)
                        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                        RETURNING id
                    """, (accessory_name,))
                    accessory_row = cursor.fetchone()
                    if accessory_row:
                        cursor.execute(f"""
                            INSERT INTO {SCHEMA}.order_accessories (order_id, accessory_id, is_present)
                            VALUES (%s, %s, true)
                        """, (order_id, accessory_row['id']))
            
            conn.commit()
            result = {'success': True}
        
        elif method == 'DELETE':
            order_id = event.get('queryStringParameters', {}).get('id')
            if not order_id:
                raise ValueError('Order ID is required')
            
            cursor.execute(f"DELETE FROM {SCHEMA}.orders WHERE id = %s", (order_id,))
            conn.commit()
            result = {'success': True, 'deleted_id': order_id}
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result, default=str)
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }