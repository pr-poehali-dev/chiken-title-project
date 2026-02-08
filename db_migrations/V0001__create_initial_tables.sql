-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_guest BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    coins INTEGER DEFAULT 100,
    time_spent INTEGER DEFAULT 0,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица титулов
CREATE TABLE IF NOT EXISTS titles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- Таблица купленных титулов
CREATE TABLE IF NOT EXISTS user_titles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title_id INTEGER REFERENCES titles(id),
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, title_id)
);

-- Таблица заданий
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) NOT NULL,
    reward INTEGER NOT NULL,
    max_progress INTEGER NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- Таблица прогресса заданий
CREATE TABLE IF NOT EXISTS user_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    task_id INTEGER REFERENCES tasks(id),
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    UNIQUE(user_id, task_id)
);

-- Таблица сообщений чата
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    username VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица транзакций монет
CREATE TABLE IF NOT EXISTS coin_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_titles_user ON user_titles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id);

-- Вставка титулов
INSERT INTO titles (name, description, price, sort_order) VALUES
('[NEWBIE]', 'Стартовый титул для новичков', 0, 1),
('[VIP]', 'Элитный статус для избранных', 2000, 2),
('[ADMIN]', 'Титул администратора сообщества', 5000, 3),
('[SNIPER]', 'Для метких и быстрых игроков', 3500, 4),
('[LEGEND]', 'Легендарный титул для героев', 10000, 5),
('[KING]', 'Королевский титул власти', 15000, 6),
('[TASK-MASTER]', 'Мастер выполнения заданий', 7500, 7),
('[CHEATER]', 'Загадочный титул нарушителя', 4999, 8),
('[CREATOR]', 'Титул создателя контента', 25000, 9),
('[COLLAB]', 'Для любителей сотрудничества', 4000, 10),
('[SAF ADMIN]', 'Специальный админ-титул', 12500, 11),
('[SAT ADMIN]', 'Технический админ-титул', 12500, 12),
('[TROLLER]', 'Титул мастера троллинга', 3333, 13)
ON CONFLICT (name) DO NOTHING;

-- Вставка заданий
INSERT INTO tasks (name, description, task_type, reward, max_progress, sort_order) VALUES
('Провести 15 минут на сайте', 'Проведи время изучая функции сайта', 'time', 200, 15, 1),
('Провести 30 минут на сайте', 'Половина часа активности', 'time', 500, 30, 2),
('Провести 1 час на сайте', 'Целый час на ЧикенТитул', 'time', 1200, 60, 3),
('Провести 2 часа на сайте', 'Два часа преданности', 'time', 2500, 120, 4),
('Провести 5 часов на сайте', 'Пять часов увлечения', 'time', 7000, 300, 5),
('Провести 10 часов на сайте', 'Десять часов мастерства', 'time', 15000, 600, 6),
('Провести 24 часа на сайте', 'Суточный марафон', 'time', 35000, 1440, 7),
('Купить первый титул', 'Соверши свою первую покупку', 'purchase', 500, 1, 8),
('Купить 3 титула', 'Собери коллекцию из 3 титулов', 'purchase', 1500, 3, 9),
('Купить 5 титулов', 'Половина коллекции', 'purchase', 3000, 5, 10),
('Купить 8 титулов', 'Серьезный коллекционер', 'purchase', 5500, 8, 11),
('Купить все титулы', 'Полная коллекция титулов', 'purchase', 10000, 13, 12),
('Купить легендарный титул', 'Приобрети титул LEGEND', 'special_purchase', 2000, 1, 13),
('Купить королевский титул', 'Стань королем', 'special_purchase', 3000, 1, 14),
('Купить титул создателя', 'Самый дорогой титул', 'special_purchase', 5000, 1, 15),
('Собрать 1000 ТитулКоинов', 'Накопи первую тысячу', 'coins', 800, 1000, 16),
('Собрать 5000 ТитулКоинов', 'Пять тысяч на счету', 'coins', 3000, 5000, 17),
('Собрать 10000 ТитулКоинов', 'Десять тысяч богатства', 'coins', 6000, 10000, 18),
('Собрать 25000 ТитулКоинов', 'Четверть сотни тысяч', 'coins', 15000, 25000, 19),
('Собрать 50000 ТитулКоинов', 'Половина сотни тысяч', 'coins', 30000, 50000, 20),
('Собрать 100000 ТитулКоинов', 'Стотысячный магнат', 'coins', 75000, 100000, 21),
('Посетить магазин титулов', 'Открой вкладку с титулами', 'action', 150, 1, 22),
('Открыть все вкладки', 'Изучи весь интерфейс', 'action', 300, 3, 23),
('Посмотреть все титулы', 'Ознакомься с каждым титулом', 'action', 250, 13, 24),
('Написать первое сообщение в чат', 'Поздоровайся с сообществом', 'chat', 200, 1, 25),
('Написать 10 сообщений в чат', 'Активный участник чата', 'chat', 800, 10, 26),
('Написать 50 сообщений в чат', 'Завсегдатай чата', 'chat', 3000, 50, 27),
('Написать 100 сообщений в чат', 'Чат-мастер', 'chat', 6500, 100, 28),
('Написать 500 сообщений в чат', 'Король общения', 'chat', 25000, 500, 29),
('Выполнить 5 заданий', 'Заверши пять любых заданий', 'complete', 1000, 5, 30),
('Выполнить 10 заданий', 'Десять выполненных заданий', 'complete', 2500, 10, 31),
('Выполнить 20 заданий', 'Двадцать побед', 'complete', 5500, 20, 32),
('Выполнить 30 заданий', 'Тридцать достижений', 'complete', 10000, 30, 33),
('Выполнить 50 заданий', 'Половина сотни заданий', 'complete', 20000, 50, 34),
('Выполнить все задания', 'Абсолютный чемпион', 'complete', 50000, 60, 35),
('Посетить сайт 3 дня подряд', 'Три дня верности', 'visit', 1500, 3, 36),
('Посетить сайт 7 дней подряд', 'Недельная полоса', 'visit', 4000, 7, 37),
('Посетить сайт 14 дней подряд', 'Две недели подряд', 'visit', 9000, 14, 38),
('Посетить сайт 30 дней подряд', 'Месячный марафон', 'visit', 20000, 30, 39),
('Посетить сайт 60 дней подряд', 'Два месяца преданности', 'visit', 45000, 60, 40),
('Посетить сайт 100 дней подряд', 'Сотня дней верности', 'visit', 100000, 100, 41),
('Скопировать свой первый титул', 'Используй купленный титул', 'special', 300, 1, 42),
('Получить подарок от админа', 'Админ подарил тебе монеты', 'special', 500, 1, 43),
('Увидеть админа онлайн', 'Застань создателя на сайте', 'special', 1000, 1, 44),
('Быть в топ-10 по монетам', 'Войди в десятку богатейших', 'special', 5000, 1, 45),
('Быть первым в рейтинге', 'Стань самым богатым игроком', 'special', 15000, 1, 46),
('Зайти в полночь', 'Посети сайт ровно в 00:00', 'special_time', 2000, 1, 47),
('Зайти в 6 утра', 'Ранняя пташка', 'special_time', 1500, 1, 48),
('Зайти в полдень', 'Обеденный перерыв', 'special_time', 1000, 1, 49),
('Зайти во все времена суток', 'Полный цикл активности', 'special_time', 8000, 4, 50),
('Поставить реакцию в чате', 'Отреагируй на сообщение', 'social', 200, 1, 51),
('Получить 10 реакций', 'Твои сообщения оценили', 'social', 1200, 10, 52),
('Получить 50 реакций', 'Популярный участник', 'social', 5000, 50, 53),
('Ответить на 20 сообщений', 'Активный собеседник', 'social', 3000, 20, 54),
('Найти пасхалку курицы', 'Обнаружь скрытую курицу', 'secret', 5000, 1, 55),
('Найти водяной пистолет', 'Найди спрятанное оружие', 'secret', 4000, 1, 56),
('Открыть секретную комбинацию', 'Введи секретный код', 'secret', 10000, 1, 57),
('Разгадать загадку создателя', 'Реши головоломку от админа', 'secret', 15000, 1, 58),
('Не покидать сайт 3 часа', 'Три часа без перерыва', 'extreme', 5000, 180, 59),
('Заработать 10000 за день', 'Десять тысяч за сутки', 'extreme', 8000, 10000, 60)
ON CONFLICT DO NOTHING;
