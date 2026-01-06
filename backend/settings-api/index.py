"""API для управления настройками (статусы и печатные формы)"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p72562668_inventory_management'

def get_db_connection():
    """Создание подключения к БД"""
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    return conn, cursor

def handler(event: dict, context) -> dict:
    """Обработчик запросов к API настроек"""
    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters', {}) or {}
    entity_type = params.get('type', 'statuses')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn, cursor = get_db_connection()
        
        if entity_type == 'statuses':
            result = handle_statuses(event, conn, cursor)
        elif entity_type == 'print-templates':
            result = handle_print_templates(event, conn, cursor)
        else:
            result = {'error': 'Invalid type'}
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result, default=str),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        error_msg = str(e)
        user_message = error_msg
        
        if 'foreign key' in error_msg.lower():
            user_message = 'Невозможно удалить запись, так как она используется в других документах'
        elif 'duplicate' in error_msg.lower():
            user_message = 'Запись с таким именем уже существует'
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': user_message, 'technical_error': error_msg}),
            'isBase64Encoded': False
        }

def handle_statuses(event: dict, conn, cursor) -> dict:
    """Управление статусами заказов"""
    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters', {}) or {}
    
    if method == 'GET':
        status_id = params.get('id')
        
        if status_id:
            cursor.execute(f"SELECT * FROM {SCHEMA}.order_statuses WHERE id = %s", (status_id,))
            status = cursor.fetchone()
            return dict(status) if status else None
        else:
            cursor.execute(f"SELECT * FROM {SCHEMA}.order_statuses ORDER BY sort_order, name")
            statuses = cursor.fetchall()
            return [dict(s) for s in statuses]
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        
        cursor.execute(f"""
            INSERT INTO {SCHEMA}.order_statuses (name, color, icon, sort_order, is_active)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (
            body.get('name'),
            body.get('color', '#6B7280'),
            body.get('icon', 'Circle'),
            body.get('sort_order', 0),
            body.get('is_active', True)
        ))
        
        new_id = cursor.fetchone()['id']
        conn.commit()
        return {'id': new_id}
    
    elif method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        status_id = params.get('id') or body.get('id')
        
        if not status_id:
            raise ValueError('ID is required')
        
        cursor.execute(f"""
            UPDATE {SCHEMA}.order_statuses 
            SET name = %s, color = %s, icon = %s, sort_order = %s, is_active = %s, updated_at = NOW()
            WHERE id = %s
        """, (
            body.get('name'),
            body.get('color'),
            body.get('icon'),
            body.get('sort_order'),
            body.get('is_active'),
            status_id
        ))
        
        conn.commit()
        return {'success': True}
    
    elif method == 'DELETE':
        status_id = params.get('id')
        
        if not status_id:
            raise ValueError('ID is required')
        
        cursor.execute(f"DELETE FROM {SCHEMA}.order_statuses WHERE id = %s", (status_id,))
        conn.commit()
        return {'success': True, 'deleted_id': status_id}

def handle_print_templates(event: dict, conn, cursor) -> dict:
    """Управление печатными формами"""
    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters', {}) or {}
    
    if method == 'GET':
        template_id = params.get('id')
        
        if template_id:
            cursor.execute(f"SELECT * FROM {SCHEMA}.print_templates WHERE id = %s", (template_id,))
            template = cursor.fetchone()
            return dict(template) if template else None
        else:
            cursor.execute(f"SELECT * FROM {SCHEMA}.print_templates ORDER BY name")
            templates = cursor.fetchall()
            return [dict(t) for t in templates]
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        
        cursor.execute(f"""
            INSERT INTO {SCHEMA}.print_templates (name, template_type, content, is_default)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (
            body.get('name'),
            body.get('template_type', 'order'),
            body.get('content', ''),
            body.get('is_default', False)
        ))
        
        new_id = cursor.fetchone()['id']
        conn.commit()
        return {'id': new_id}
    
    elif method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        template_id = params.get('id') or body.get('id')
        
        if not template_id:
            raise ValueError('ID is required')
        
        cursor.execute(f"""
            UPDATE {SCHEMA}.print_templates 
            SET name = %s, template_type = %s, content = %s, is_default = %s, updated_at = NOW()
            WHERE id = %s
        """, (
            body.get('name'),
            body.get('template_type'),
            body.get('content'),
            body.get('is_default'),
            template_id
        ))
        
        conn.commit()
        return {'success': True}
    
    elif method == 'DELETE':
        template_id = params.get('id')
        
        if not template_id:
            raise ValueError('ID is required')
        
        cursor.execute(f"DELETE FROM {SCHEMA}.print_templates WHERE id = %s", (template_id,))
        conn.commit()
        return {'success': True, 'deleted_id': template_id}