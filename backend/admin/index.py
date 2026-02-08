"""API для админ-панели управления сайтом"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Создание подключения к базе данных"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """Обработчик админ API"""
    
    # CORS
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    try:
        method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        body = json.loads(event.get('body', '{}')) if method == 'POST' else {}
        query = event.get('queryStringParameters', {}) or {}
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        admin_id = query.get('adminId') or body.get('adminId')
        
        # Проверка прав админа
        if admin_id:
            cur.execute("SELECT is_admin FROM users WHERE id = %s", (admin_id,))
            admin = cur.fetchone()
            
            if not admin or not admin['is_admin']:
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Доступ запрещен'})
                }
        
        # Получить список онлайн пользователей (активных за последние 5 минут)
        if path == '/online' and method == 'GET':
            cur.execute("""
                SELECT id, username, coins, is_guest, last_active
                FROM users
                WHERE last_active > NOW() - INTERVAL '5 minutes'
                ORDER BY last_active DESC
            """)
            
            users = cur.fetchall()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([{
                    'id': u['id'],
                    'username': u['username'],
                    'coins': u['coins'],
                    'isGuest': u['is_guest'],
                    'lastActive': u['last_active'].isoformat() if u['last_active'] else None
                } for u in users])
            }
        
        # Выдать монеты пользователю
        elif path == '/give-coins' and method == 'POST':
            target_user_id = body.get('targetUserId')
            amount = body.get('amount', 0)
            
            if not target_user_id or amount <= 0:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'targetUserId and positive amount required'})
                }
            
            # Обновление баланса
            cur.execute("UPDATE users SET coins = coins + %s WHERE id = %s", (amount, target_user_id))
            
            # Запись транзакции
            cur.execute(
                "INSERT INTO coin_transactions (user_id, amount, transaction_type, description) VALUES (%s, %s, 'admin_gift', %s)",
                (target_user_id, amount, f"Подарок от администратора")
            )
            
            conn.commit()
            
            # Получение нового баланса
            cur.execute("SELECT coins, username FROM users WHERE id = %s", (target_user_id,))
            user = cur.fetchone()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'username': user['username'],
                    'newCoins': user['coins'],
                    'message': f"Выдано {amount} монет пользователю {user['username']}"
                })
            }
        
        # Получить статистику сайта
        elif path == '/stats' and method == 'GET':
            # Общее количество пользователей
            cur.execute("SELECT COUNT(*) as total FROM users")
            total_users = cur.fetchone()['total']
            
            # Пользователей онлайн
            cur.execute("SELECT COUNT(*) as online FROM users WHERE last_active > NOW() - INTERVAL '5 minutes'")
            online_users = cur.fetchone()['online']
            
            # Всего отправлено сообщений
            cur.execute("SELECT COUNT(*) as total FROM chat_messages")
            total_messages = cur.fetchone()['total']
            
            # Всего куплено титулов
            cur.execute("SELECT COUNT(*) as total FROM user_titles")
            total_purchases = cur.fetchone()['total']
            
            # Топ-10 по монетам
            cur.execute("""
                SELECT id, username, coins, is_guest
                FROM users
                ORDER BY coins DESC
                LIMIT 10
            """)
            top_users = cur.fetchall()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'totalUsers': total_users,
                    'onlineUsers': online_users,
                    'totalMessages': total_messages,
                    'totalPurchases': total_purchases,
                    'topUsers': [{
                        'id': u['id'],
                        'username': u['username'],
                        'coins': u['coins'],
                        'isGuest': u['is_guest']
                    } for u in top_users]
                })
            }
        
        # Получить все транзакции пользователя
        elif path == '/transactions' and method == 'GET':
            target_user_id = query.get('targetUserId')
            
            if not target_user_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'targetUserId required'})
                }
            
            cur.execute("""
                SELECT id, amount, transaction_type, description, created_at
                FROM coin_transactions
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT 100
            """, (target_user_id,))
            
            transactions = cur.fetchall()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([{
                    'id': t['id'],
                    'amount': t['amount'],
                    'type': t['transaction_type'],
                    'description': t['description'],
                    'createdAt': t['created_at'].isoformat() if t['created_at'] else None
                } for t in transactions])
            }
        
        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Endpoint not found'})
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }