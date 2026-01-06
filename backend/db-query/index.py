import json
import os
import psycopg2
import psycopg2.extras

def handler(event: dict, context) -> dict:
    '''Выполнение SQL-запросов к базе данных'''
    
    method = event.get('httpMethod', 'POST')
    
    # CORS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        sql = body.get('sql', '')
        params = body.get('params', [])
        
        if not sql:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'SQL query is required'}),
                'isBase64Encoded': False
            }
        
        # Подключение к БД
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            raise Exception('DATABASE_URL not configured')
        
        conn = psycopg2.connect(database_url)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Выполнение запроса
        cur.execute(sql, params)
        
        # Если это SELECT - возвращаем результат
        if sql.strip().upper().startswith('SELECT') or 'RETURNING' in sql.upper():
            rows = cur.fetchall()
            result = {'rows': [dict(row) for row in rows], 'rowCount': len(rows)}
        else:
            conn.commit()
            result = {'rows': [], 'rowCount': cur.rowcount}
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(result, default=str),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
