"""API для работы с титулами, заданиями и игровыми действиями"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Создание подключения к базе данных"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """Обработчик игровых API запросов"""
    
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
        
        user_id = query.get('userId') or body.get('userId')
        
        if not user_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'userId required'})
            }
        
        # Получить профиль пользователя
        if path == '/profile' and method == 'GET':
            cur.execute("""
                SELECT id, username, coins, is_guest, is_admin, time_spent, created_at, last_active
                FROM users WHERE id = %s
            """, (user_id,))
            user = cur.fetchone()
            
            if not user:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User not found'})
                }
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'id': user['id'],
                    'username': user['username'],
                    'coins': user['coins'],
                    'isGuest': user['is_guest'],
                    'isAdmin': user['is_admin'],
                    'timeSpent': user['time_spent'],
                    'createdAt': user['created_at'].isoformat() if user['created_at'] else None,
                    'lastActive': user['last_active'].isoformat() if user['last_active'] else None
                })
            }
        
        # Получить все титулы с информацией о покупке
        elif path == '/titles' and method == 'GET':
            cur.execute("""
                SELECT t.id, t.name, t.description, t.price, t.sort_order,
                       EXISTS(SELECT 1 FROM user_titles WHERE user_id = %s AND title_id = t.id) as owned
                FROM titles t
                ORDER BY t.sort_order
            """, (user_id,))
            titles = cur.fetchall()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(t) for t in titles])
            }
        
        # Купить титул
        elif path == '/buy-title' and method == 'POST':
            title_id = body.get('titleId')
            
            if not title_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'titleId required'})
                }
            
            # Проверка, куплен ли уже
            cur.execute("SELECT 1 FROM user_titles WHERE user_id = %s AND title_id = %s", (user_id, title_id))
            if cur.fetchone():
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Уже куплен'})
                }
            
            # Получение цены
            cur.execute("SELECT price, name FROM titles WHERE id = %s", (title_id,))
            title = cur.fetchone()
            
            if not title:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Титул не найден'})
                }
            
            # Проверка баланса
            cur.execute("SELECT coins FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            
            if user['coins'] < title['price']:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно ТитулКоинов'})
                }
            
            # Покупка
            cur.execute("UPDATE users SET coins = coins - %s WHERE id = %s", (title['price'], user_id))
            cur.execute("INSERT INTO user_titles (user_id, title_id) VALUES (%s, %s)", (user_id, title_id))
            cur.execute(
                "INSERT INTO coin_transactions (user_id, amount, transaction_type, description) VALUES (%s, %s, 'purchase', %s)",
                (user_id, -title['price'], f"Покупка титула {title['name']}")
            )
            
            # Обновление прогресса заданий на покупку
            cur.execute("""
                UPDATE user_tasks SET progress = (
                    SELECT COUNT(*) FROM user_titles WHERE user_id = %s
                )
                WHERE user_id = %s AND task_id IN (
                    SELECT id FROM tasks WHERE task_type = 'purchase'
                )
            """, (user_id, user_id))
            
            # Проверка завершения заданий
            cur.execute("""
                UPDATE user_tasks 
                SET completed = TRUE, completed_at = CURRENT_TIMESTAMP
                WHERE user_id = %s AND completed = FALSE AND progress >= (
                    SELECT max_progress FROM tasks WHERE tasks.id = user_tasks.task_id
                )
            """, (user_id,))
            
            conn.commit()
            
            # Получение нового баланса
            cur.execute("SELECT coins FROM users WHERE id = %s", (user_id,))
            new_coins = cur.fetchone()['coins']
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'coins': new_coins,
                    'message': f'Титул {title["name"]} куплен!'
                })
            }
        
        # Получить задания с прогрессом
        elif path == '/tasks' and method == 'GET':
            cur.execute("""
                SELECT t.id, t.name, t.description, t.task_type, t.reward, t.max_progress, t.sort_order,
                       COALESCE(ut.progress, 0) as progress,
                       COALESCE(ut.completed, FALSE) as completed
                FROM tasks t
                LEFT JOIN user_tasks ut ON t.id = ut.task_id AND ut.user_id = %s
                ORDER BY t.sort_order
            """, (user_id,))
            tasks = cur.fetchall()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(t) for t in tasks])
            }
        
        # Обновить прогресс времени
        elif path == '/update-time' and method == 'POST':
            minutes = body.get('minutes', 0)
            
            cur.execute("UPDATE users SET time_spent = time_spent + %s WHERE id = %s", (minutes, user_id))
            
            # Обновление прогресса заданий на время
            cur.execute("""
                UPDATE user_tasks SET progress = (
                    SELECT time_spent FROM users WHERE id = %s
                )
                WHERE user_id = %s AND task_id IN (
                    SELECT id FROM tasks WHERE task_type = 'time'
                ) AND completed = FALSE
            """, (user_id, user_id))
            
            # Проверка завершения и начисление монет
            cur.execute("""
                SELECT ut.id, t.reward, t.name
                FROM user_tasks ut
                JOIN tasks t ON ut.task_id = t.id
                WHERE ut.user_id = %s AND ut.completed = FALSE AND ut.progress >= t.max_progress
            """, (user_id,))
            
            completed_tasks = cur.fetchall()
            total_reward = sum(t['reward'] for t in completed_tasks)
            
            if completed_tasks:
                cur.execute("""
                    UPDATE user_tasks 
                    SET completed = TRUE, completed_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s AND completed = FALSE AND progress >= (
                        SELECT max_progress FROM tasks WHERE tasks.id = user_tasks.task_id
                    )
                """, (user_id,))
                
                cur.execute("UPDATE users SET coins = coins + %s WHERE id = %s", (total_reward, user_id))
                
                for task in completed_tasks:
                    cur.execute(
                        "INSERT INTO coin_transactions (user_id, amount, transaction_type, description) VALUES (%s, %s, 'task_reward', %s)",
                        (user_id, task['reward'], f"Награда за: {task['name']}")
                    )
            
            conn.commit()
            
            cur.execute("SELECT coins, time_spent FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'coins': user['coins'],
                    'timeSpent': user['time_spent'],
                    'completedTasks': [{'name': t['name'], 'reward': t['reward']} for t in completed_tasks]
                })
            }
        
        # Выполнить действие (открыть вкладку, и т.д.)
        elif path == '/action' and method == 'POST':
            action_type = body.get('actionType')
            value = body.get('value', 1)
            
            cur.execute("""
                UPDATE user_tasks 
                SET progress = progress + %s
                WHERE user_id = %s AND task_id IN (
                    SELECT id FROM tasks WHERE task_type = %s
                ) AND completed = FALSE
            """, (value, user_id, action_type))
            
            # Проверка завершения
            cur.execute("""
                SELECT ut.id, t.reward, t.name
                FROM user_tasks ut
                JOIN tasks t ON ut.task_id = t.id
                WHERE ut.user_id = %s AND ut.completed = FALSE AND ut.progress >= t.max_progress
            """, (user_id,))
            
            completed_tasks = cur.fetchall()
            total_reward = sum(t['reward'] for t in completed_tasks)
            
            if completed_tasks:
                cur.execute("""
                    UPDATE user_tasks 
                    SET completed = TRUE, completed_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s AND completed = FALSE AND progress >= (
                        SELECT max_progress FROM tasks WHERE tasks.id = user_tasks.task_id
                    )
                """, (user_id,))
                
                cur.execute("UPDATE users SET coins = coins + %s WHERE id = %s", (total_reward, user_id))
                
                for task in completed_tasks:
                    cur.execute(
                        "INSERT INTO coin_transactions (user_id, amount, transaction_type, description) VALUES (%s, %s, 'task_reward', %s)",
                        (user_id, task['reward'], f"Награда за: {task['name']}")
                    )
            
            conn.commit()
            
            cur.execute("SELECT coins FROM users WHERE id = %s", (user_id,))
            new_coins = cur.fetchone()['coins']
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'coins': new_coins,
                    'completedTasks': [{'name': t['name'], 'reward': t['reward']} for t in completed_tasks]
                })
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