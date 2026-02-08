"""API для работы с чатом в реальном времени"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def get_db_connection():
    """Создание подключения к базе данных"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """Обработчик чат API"""
    
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
        body = json.loads(event.get('body', '{}')) if method == 'POST' else {}
        query = event.get('queryStringParameters', {}) or {}
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Получить сообщения
        if method == 'GET':
            limit = int(query.get('limit', 50))
            since_id = query.get('sinceId')
            
            if since_id:
                cur.execute("""
                    SELECT cm.id, cm.user_id, cm.username, cm.message, cm.created_at,
                           u.is_admin
                    FROM chat_messages cm
                    LEFT JOIN users u ON cm.user_id = u.id
                    WHERE cm.id > %s
                    ORDER BY cm.created_at DESC
                    LIMIT %s
                """, (since_id, limit))
            else:
                cur.execute("""
                    SELECT cm.id, cm.user_id, cm.username, cm.message, cm.created_at,
                           u.is_admin
                    FROM chat_messages cm
                    LEFT JOIN users u ON cm.user_id = u.id
                    ORDER BY cm.created_at DESC
                    LIMIT %s
                """, (limit,))
            
            messages = cur.fetchall()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([{
                    'id': m['id'],
                    'userId': m['user_id'],
                    'username': m['username'],
                    'message': m['message'],
                    'isAdmin': m['is_admin'] or False,
                    'createdAt': m['created_at'].isoformat() if m['created_at'] else None
                } for m in reversed(messages)])
            }
        
        # Отправить сообщение
        elif method == 'POST':
            user_id = body.get('userId')
            username = body.get('username')
            message = body.get('message', '').strip()
            
            if not user_id or not username or not message:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'userId, username and message required'})
                }
            
            if len(message) > 500:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Сообщение слишком длинное'})
                }
            
            # Сохранение сообщения
            cur.execute("""
                INSERT INTO chat_messages (user_id, username, message)
                VALUES (%s, %s, %s)
                RETURNING id, created_at
            """, (user_id, username, message))
            
            result = cur.fetchone()
            message_id = result['id']
            created_at = result['created_at']
            
            # Обновление прогресса заданий на чат
            cur.execute("""
                UPDATE user_tasks 
                SET progress = (
                    SELECT COUNT(*) FROM chat_messages WHERE user_id = %s
                )
                WHERE user_id = %s AND task_id IN (
                    SELECT id FROM tasks WHERE task_type = 'chat'
                ) AND completed = FALSE
            """, (user_id, user_id))
            
            # Проверка завершения заданий
            cur.execute("""
                SELECT ut.id, t.reward, t.name
                FROM user_tasks ut
                JOIN tasks t ON ut.task_id = t.id
                WHERE ut.user_id = %s AND ut.completed = FALSE AND ut.progress >= t.max_progress AND t.task_type = 'chat'
            """, (user_id,))
            
            completed_tasks = cur.fetchall()
            total_reward = sum(t['reward'] for t in completed_tasks)
            
            if completed_tasks:
                cur.execute("""
                    UPDATE user_tasks 
                    SET completed = TRUE, completed_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s AND completed = FALSE AND progress >= (
                        SELECT max_progress FROM tasks WHERE tasks.id = user_tasks.task_id
                    ) AND task_id IN (SELECT id FROM tasks WHERE task_type = 'chat')
                """, (user_id,))
                
                cur.execute("UPDATE users SET coins = coins + %s WHERE id = %s", (total_reward, user_id))
                
                for task in completed_tasks:
                    cur.execute(
                        "INSERT INTO coin_transactions (user_id, amount, transaction_type, description) VALUES (%s, %s, 'task_reward', %s)",
                        (user_id, task['reward'], f"Награда за: {task['name']}")
                    )
            
            conn.commit()
            
            # Получение обновленного баланса
            cur.execute("SELECT coins, is_admin FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': {
                        'id': message_id,
                        'userId': user_id,
                        'username': username,
                        'message': message,
                        'isAdmin': user['is_admin'] or False,
                        'createdAt': created_at.isoformat()
                    },
                    'coins': user['coins'],
                    'completedTasks': [{'name': t['name'], 'reward': t['reward']} for t in completed_tasks]
                })
            }
        
        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }