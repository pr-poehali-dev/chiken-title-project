"""API для регистрации и авторизации пользователей"""
import json
import os
import hashlib
import secrets
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta

def get_db_connection():
    """Создание подключения к базе данных"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    """Хеширование пароля"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    """Генерация токена для сессии"""
    return secrets.token_urlsafe(32)

def handler(event: dict, context) -> dict:
    """Обработчик запросов регистрации и авторизации"""
    
    # CORS
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Регистрация
        if action == 'register':
            username = body.get('username', '').strip()
            password = body.get('password', '')
            
            if not username or len(username) < 3:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Имя должно быть минимум 3 символа'})
                }
            
            if not password or len(password) < 4:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пароль должен быть минимум 4 символа'})
                }
            
            # Проверка существования
            cur.execute("SELECT id FROM users WHERE username = %s", (username,))
            if cur.fetchone():
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Это имя уже занято'})
                }
            
            # Создание пользователя
            password_hash = hash_password(password)
            cur.execute(
                "INSERT INTO users (username, password_hash, coins) VALUES (%s, %s, %s) RETURNING id",
                (username, password_hash, 100)
            )
            user_id = cur.fetchone()['id']
            
            # Даём стартовый титул [NEWBIE]
            cur.execute("SELECT id FROM titles WHERE name = '[NEWBIE]'")
            newbie_title = cur.fetchone()
            if newbie_title:
                cur.execute(
                    "INSERT INTO user_titles (user_id, title_id) VALUES (%s, %s)",
                    (user_id, newbie_title['id'])
                )
            
            # Инициализация заданий
            cur.execute("SELECT id FROM tasks")
            tasks = cur.fetchall()
            for task in tasks:
                cur.execute(
                    "INSERT INTO user_tasks (user_id, task_id, progress, completed) VALUES (%s, %s, 0, FALSE)",
                    (user_id, task['id'])
                )
            
            conn.commit()
            
            token = generate_token()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'user': {
                        'id': user_id,
                        'username': username,
                        'coins': 100,
                        'isGuest': False,
                        'isAdmin': False
                    },
                    'token': token
                })
            }
        
        # Вход
        elif action == 'login':
            username = body.get('username', '').strip()
            password = body.get('password', '')
            
            if not username or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Укажи имя и пароль'})
                }
            
            password_hash = hash_password(password)
            
            cur.execute(
                "SELECT id, username, coins, is_guest, is_admin, time_spent FROM users WHERE username = %s AND password_hash = %s",
                (username, password_hash)
            )
            user = cur.fetchone()
            
            if not user:
                cur.close()
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверное имя или пароль'})
                }
            
            # Обновление времени активности
            cur.execute("UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = %s", (user['id'],))
            conn.commit()
            
            token = generate_token()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'user': {
                        'id': user['id'],
                        'username': user['username'],
                        'coins': user['coins'],
                        'isGuest': user['is_guest'],
                        'isAdmin': user['is_admin'],
                        'timeSpent': user['time_spent']
                    },
                    'token': token
                })
            }
        
        # Вход как гость
        elif action == 'guest':
            guest_name = f"Гость{secrets.randbelow(9999):04d}"
            
            cur.execute(
                "INSERT INTO users (username, password_hash, is_guest, coins) VALUES (%s, %s, TRUE, %s) RETURNING id",
                (guest_name, '', 100)
            )
            user_id = cur.fetchone()['id']
            
            # Даём стартовый титул
            cur.execute("SELECT id FROM titles WHERE name = '[NEWBIE]'")
            newbie_title = cur.fetchone()
            if newbie_title:
                cur.execute(
                    "INSERT INTO user_titles (user_id, title_id) VALUES (%s, %s)",
                    (user_id, newbie_title['id'])
                )
            
            # Инициализация заданий
            cur.execute("SELECT id FROM tasks")
            tasks = cur.fetchall()
            for task in tasks:
                cur.execute(
                    "INSERT INTO user_tasks (user_id, task_id, progress, completed) VALUES (%s, %s, 0, FALSE)",
                    (user_id, task['id'])
                )
            
            conn.commit()
            
            token = generate_token()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'user': {
                        'id': user_id,
                        'username': guest_name,
                        'coins': 100,
                        'isGuest': True,
                        'isAdmin': False
                    },
                    'token': token
                })
            }
        
        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неизвестное действие'})
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }