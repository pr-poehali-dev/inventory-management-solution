"""API для управления справочниками"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p72562668_inventory_management'

TABLES_MAP = {
    'contractors': 'contractors',
    'products': 'products',
    'services': 'services',
    'users': 'users',
    'devices': 'device_types',
    'brands': 'device_brands',
    'models': 'device_models',
    'accessories': 'accessories',
    'malfunctions': 'malfunctions',
    'units': 'units',
    'money': 'money_items',
    'advertising': 'advertising_sources',
}

def get_db_connection():
    """Создание подключения к БД"""
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    return conn, cursor

def handler(event: dict, context) -> dict:
    """Обработчик запросов к справочникам"""
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
        params = event.get('queryStringParameters', {}) or {}
        directory_type = params.get('type', 'contractors')
        table_name = TABLES_MAP.get(directory_type)
        
        if not table_name:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid directory type'})
            }
        
        full_table = f"{SCHEMA}.{table_name}"
        conn, cursor = get_db_connection()
        
        if method == 'GET':
            item_id = params.get('id')
            
            if item_id:
                cursor.execute(f"SELECT * FROM {full_table} WHERE id = %s", (item_id,))
                item = cursor.fetchone()
                result = dict(item) if item else None
            else:
                search = params.get('search', '')
                query = f"SELECT * FROM {full_table}"
                
                if search:
                    query += f" WHERE name ILIKE '%{search}%'"
                
                query += " ORDER BY id DESC LIMIT 100"
                cursor.execute(query)
                items = cursor.fetchall()
                result = [dict(item) for item in items]
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            fields = ', '.join(body.keys())
            placeholders = ', '.join(['%s'] * len(body))
            values = tuple(body.values())
            
            cursor.execute(
                f"INSERT INTO {full_table} ({fields}) VALUES ({placeholders}) RETURNING id",
                values
            )
            
            new_id = cursor.fetchone()['id']
            conn.commit()
            result = {'id': new_id}
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            item_id = body.pop('id', None)
            
            if not item_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID is required'})
                }
            
            set_clause = ', '.join([f"{key} = %s" for key in body.keys()])
            values = tuple(body.values()) + (item_id,)
            
            cursor.execute(
                f"UPDATE {full_table} SET {set_clause}, updated_at = NOW() WHERE id = %s",
                values
            )
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