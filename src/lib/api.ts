// API клиент для работы с бэкендом
const API_URLS = {
  auth: 'https://functions.poehali.dev/8885ce5a-f0d2-4474-a764-4d28d86afc46',
  game: 'https://functions.poehali.dev/3fa3e575-8f46-44d1-ae69-1ae6fa8fb1cc',
  chat: 'https://functions.poehali.dev/89a045df-cb20-4b23-a309-3234e859bdd8',
  admin: 'https://functions.poehali.dev/63254041-9aa4-41b3-8950-8cd75747d44c',
};

export const api = {
  // Регистрация
  register: async (username: string, password: string) => {
    const res = await fetch(API_URLS.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', username, password }),
    });
    return res.json();
  },

  // Вход
  login: async (username: string, password: string) => {
    const res = await fetch(API_URLS.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password }),
    });
    return res.json();
  },

  // Вход как гость
  guestLogin: async () => {
    const res = await fetch(API_URLS.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'guest' }),
    });
    return res.json();
  },

  // Получить титулы
  getTitles: async (userId: number) => {
    const res = await fetch(`${API_URLS.game}/titles?userId=${userId}`);
    return res.json();
  },

  // Купить титул
  buyTitle: async (userId: number, titleId: number) => {
    const res = await fetch(`${API_URLS.game}/buy-title`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, titleId }),
    });
    return res.json();
  },

  // Получить задания
  getTasks: async (userId: number) => {
    const res = await fetch(`${API_URLS.game}/tasks?userId=${userId}`);
    return res.json();
  },

  // Обновить время
  updateTime: async (userId: number, minutes: number) => {
    const res = await fetch(`${API_URLS.game}/update-time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, minutes }),
    });
    return res.json();
  },

  // Выполнить действие
  doAction: async (userId: number, actionType: string, value: number = 1) => {
    const res = await fetch(`${API_URLS.game}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, actionType, value }),
    });
    return res.json();
  },

  // Получить сообщения чата
  getMessages: async (sinceId?: number) => {
    const url = sinceId 
      ? `${API_URLS.chat}?sinceId=${sinceId}` 
      : API_URLS.chat;
    const res = await fetch(url);
    return res.json();
  },

  // Отправить сообщение
  sendMessage: async (userId: number, username: string, message: string) => {
    const res = await fetch(API_URLS.chat, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username, message }),
    });
    return res.json();
  },

  // Админ: получить онлайн пользователей
  getOnlineUsers: async (adminId: number) => {
    const res = await fetch(`${API_URLS.admin}/online?adminId=${adminId}`);
    return res.json();
  },

  // Админ: выдать монеты
  giveCoins: async (adminId: number, targetUserId: number, amount: number) => {
    const res = await fetch(`${API_URLS.admin}/give-coins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, targetUserId, amount }),
    });
    return res.json();
  },

  // Админ: статистика
  getStats: async (adminId: number) => {
    const res = await fetch(`${API_URLS.admin}/stats?adminId=${adminId}`);
    return res.json();
  },
};
