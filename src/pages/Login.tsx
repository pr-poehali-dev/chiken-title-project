import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  username: string;
  coins: number;
  isGuest: boolean;
  isAdmin: boolean;
}

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = isRegister 
        ? await api.register(username, password)
        : await api.login(username, password);

      if (result.error) {
        toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
      } else {
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('token', result.token);
        onLogin(result.user);
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось подключиться', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      const result = await api.guestLogin();
      if (result.error) {
        toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
      } else {
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('token', result.token);
        onLogin(result.user);
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось подключиться', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Анимированный фон */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Эмодзи курицы */}
      <div className="absolute top-10 right-10 text-6xl animate-bounce">🐔</div>
      <div className="absolute bottom-10 left-10 text-6xl animate-bounce delay-500">💦</div>

      <Card className="w-full max-w-md bg-slate-900/80 border-2 border-purple-500/50 backdrop-blur-xl shadow-2xl shadow-purple-500/20 relative z-10">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Icon name="Crown" size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2 animate-pulse">
              ЧикенТитул
            </h1>
            <p className="text-gray-400">Система титулов и заданий</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-purple-300 mb-2 block">Имя пользователя</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-slate-800/50 border-purple-500/50 text-white focus:border-purple-400"
                placeholder="Введи имя..."
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-purple-300 mb-2 block">Пароль</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-800/50 border-purple-500/50 text-white focus:border-purple-400"
                placeholder="Введи пароль..."
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg shadow-purple-500/50"
            >
              {loading ? 'Загрузка...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRegister(!isRegister)}
              className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
            >
              {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Регистрация'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-purple-500/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-900 text-gray-400">или</span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleGuest}
              disabled={loading}
              className="w-full bg-slate-800/50 border border-purple-500/30 text-purple-300 hover:bg-slate-700/50"
            >
              <Icon name="User" size={16} className="mr-2" />
              Войти как гость
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}