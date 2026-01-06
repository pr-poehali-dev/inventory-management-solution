"""
API для интернет-магазина.
Предоставляет доступ к товарам и оформлению заказов.
"""
import json
import os
from datetime import datetime
from typing import Optional


INVENTORY_DATA = [
    {
        'id': '1',
        'name': 'Ноутбук Dell XPS 13',
        'sku': 'LAP-001',
        'category': 'Электроника',
        'quantity': 5,
        'price': 89990,
        'image': 'https://cdn.poehali.dev/projects/ecc87eec-1e42-4990-bf43-a1fac36edbf4/files/35de587e-a370-4736-8105-ef0ca9e67059.jpg',
        'description': 'Мощный и компактный ноутбук для работы и развлечений'
    },
    {
        'id': '2',
        'name': 'Клавиатура Logitech MX',
        'sku': 'KEY-002',
        'category': 'Аксессуары',
        'quantity': 45,
        'price': 8990,
        'image': 'https://cdn.poehali.dev/projects/ecc87eec-1e42-4990-bf43-a1fac36edbf4/files/95939c2c-43de-467e-a4c0-9dcb099e65c9.jpg',
        'description': 'Профессиональная беспроводная клавиатура'
    },
    {
        'id': '3',
        'name': 'Монитор Samsung 27"',
        'sku': 'MON-003',
        'category': 'Электроника',
        'quantity': 8,
        'price': 24990,
        'image': 'https://cdn.poehali.dev/projects/ecc87eec-1e42-4990-bf43-a1fac36edbf4/files/3abd42e4-cdd6-498d-8116-693a50c16907.jpg',
        'description': 'Современный монитор с высоким разрешением'
    },
    {
        'id': '4',
        'name': 'Мышь Wireless',
        'sku': 'MOU-004',
        'category': 'Аксессуары',
        'quantity': 3,
        'price': 1990,
        'image': 'https://cdn.poehali.dev/projects/ecc87eec-1e42-4990-bf43-a1fac36edbf4/files/d1aa084c-fe67-4c77-a6ac-a0123979b925.jpg',
        'description': 'Эргономичная беспроводная мышь'
    },
    {
        'id': '5',
        'name': 'USB-C Кабель',
        'sku': 'CAB-005',
        'category': 'Кабели',
        'quantity': 120,
        'price': 590,
        'image': 'https://cdn.poehali.dev/projects/ecc87eec-1e42-4990-bf43-a1fac36edbf4/files/324a8c8c-648c-44d0-bcfa-990f368c8b88.jpg',
        'description': 'Надёжный кабель USB-C для зарядки'
    }
]

ORDERS = []


def handler(event: dict, context) -> dict:
    """API endpoint для интернет-магазина"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    query_params = event.get('queryStringParameters') or {}
    action = query_params.get('action', 'products')
    
    if method == 'GET':
        if action == 'products':
            category = query_params.get('category')
            search = query_params.get('search', '').lower()
            
            products = [p for p in INVENTORY_DATA if p['quantity'] > 0]
            
            if category:
                products = [p for p in products if p['category'] == category]
            
            if search:
                products = [
                    p for p in products 
                    if search in p['name'].lower() or search in p['sku'].lower()
                ]
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'products': products,
                    'total': len(products)
                }, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        if action == 'categories':
            categories = list(set(p['category'] for p in INVENTORY_DATA))
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'categories': categories}, ensure_ascii=False),
                'isBase64Encoded': False
            }
    
    if method == 'POST' and action == 'order':
        try:
            body = json.loads(event.get('body', '{}'))
            
            customer_name = body.get('customerName')
            email = body.get('email')
            phone = body.get('phone')
            items = body.get('items', [])
            
            if not customer_name or not email or not phone:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Заполните все поля'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            if not items:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Корзина пуста'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            for item in items:
                product = next((p for p in INVENTORY_DATA if p['id'] == item['id']), None)
                if not product:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': f'Товар {item["id"]} не найден'}, ensure_ascii=False),
                        'isBase64Encoded': False
                    }
                
                if product['quantity'] < item['quantity']:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'error': f'Недостаточно товара {product["name"]} на складе'
                        }, ensure_ascii=False),
                        'isBase64Encoded': False
                    }
            
            total = sum(
                next(p['price'] for p in INVENTORY_DATA if p['id'] == item['id']) * item['quantity']
                for item in items
            )
            
            for item in items:
                product = next(p for p in INVENTORY_DATA if p['id'] == item['id'])
                product['quantity'] -= item['quantity']
            
            order_id = f"ORD-{len(ORDERS) + 1005}"
            order = {
                'id': order_id,
                'customerName': customer_name,
                'email': email,
                'phone': phone,
                'items': items,
                'total': total,
                'status': 'pending',
                'date': datetime.now().isoformat()
            }
            ORDERS.append(order)
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'orderId': order_id,
                    'message': 'Заказ успешно оформлен'
                }, ensure_ascii=False),
                'isBase64Encoded': False
            }
            
        except json.JSONDecodeError:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Неверный формат данных'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 404,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Endpoint не найден'}, ensure_ascii=False),
        'isBase64Encoded': False
    }