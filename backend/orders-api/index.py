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
                           dm.name as model_name
                    FROM {SCHEMA}.orders o
                    LEFT JOIN {SCHEMA}.contractors c ON o.contractor_id = c.id
                    LEFT JOIN {SCHEMA}.device_types dt ON o.device_type_id = dt.id
                    LEFT JOIN {SCHEMA}.device_brands db ON o.brand_id = db.id
                    LEFT JOIN {SCHEMA}.device_models dm ON o.model_id = dm.id
                    WHERE o.id = %s
                """, (order_id,))
                order = cursor.fetchone()
                result = dict(order) if order else None
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
                SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1 
                FROM {SCHEMA}.orders 
                WHERE order_number LIKE %s
            """, (f"{datetime.now().year}-%",))
            next_num = cursor.fetchone()[0]
            order_number = f"{datetime.now().year}-{str(next_num).zfill(3)}"
            
            cursor.execute(f"""
                INSERT INTO {SCHEMA}.orders (
                    order_number, phone, address, serial_number, color, appearance,
                    malfunction_description, security_code, device_turns_on, failure_reason,
                    repair_description, return_defective_parts, estimated_price, prepayment,
                    deadline, receiver_comment, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'new')
                RETURNING id
            """, (
                order_number,
                body.get('phone'),
                body.get('address'),
                body.get('serial_number'),
                body.get('color'),
                body.get('appearance'),
                body.get('malfunction'),
                body.get('security_code'),
                body.get('device_turns_on', False),
                body.get('failure_reason'),
                body.get('repair_description'),
                body.get('return_defective_parts', False),
                body.get('estimated_price'),
                body.get('prepayment', 0),
                body.get('deadline_date') + ' ' + body.get('deadline_time', '00:00') if body.get('deadline_date') else None,
                body.get('receiver_comment')
            ))
            
            order_id = cursor.fetchone()['id']
            conn.commit()
            result = {'id': order_id, 'order_number': order_number}
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            order_id = body.get('id')
            
            cursor.execute(f"""
                UPDATE {SCHEMA}.orders SET
                    phone = %s, address = %s, serial_number = %s, color = %s,
                    appearance = %s, malfunction_description = %s, security_code = %s,
                    device_turns_on = %s, failure_reason = %s, repair_description = %s,
                    return_defective_parts = %s, estimated_price = %s, prepayment = %s,
                    deadline = %s, receiver_comment = %s, status = %s, updated_at = NOW()
                WHERE id = %s
            """, (
                body.get('phone'),
                body.get('address'),
                body.get('serial_number'),
                body.get('color'),
                body.get('appearance'),
                body.get('malfunction'),
                body.get('security_code'),
                body.get('device_turns_on', False),
                body.get('failure_reason'),
                body.get('repair_description'),
                body.get('return_defective_parts', False),
                body.get('estimated_price'),
                body.get('prepayment', 0),
                body.get('deadline'),
                body.get('receiver_comment'),
                body.get('status', 'new'),
                order_id
            ))
            conn.commit()
            result = {'success': True}
        
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
