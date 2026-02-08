import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  username: string;
  coins: number;
  isGuest: boolean;
  isAdmin: boolean;
}

interface IndexProps {
  user: User;
  onLogout: () => void;
}

interface Title {
  id: number;
  name: string;
  description: string;
  price: number;
  owned: boolean;
}

interface Task {
  id: number;
  name: string;
  description: string;
  task_type: string;
  reward: number;
  max_progress: number;
  progress: number;
  completed: boolean;
}

interface Message {
  id: number;
  userId: number;
  username: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
}

export default function Index({ user, onLogout }: IndexProps) {
  const [coins, setCoins] = useState(user.coins);
  const [titles, setTitles] = useState<Title[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [currentTab, setCurrentTab] = useState('titles');
  const [adminPanel, setAdminPanel] = useState(false);
  const [adminAmount, setAdminAmount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const { toast } = useToast();

  // Загрузка данных
  const loadTitles = useCallback(async () => {
    try {
      const data = await api.getTitles(user.id);
      setTitles(data);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить титулы', variant: 'destructive' });
    }
  }, [user.id, toast]);

  const loadTasks = useCallback(async () => {
    try {
      const data = await api.getTasks(user.id);
      setTasks(data);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить задания', variant: 'destructive' });
    }
  }, [user.id, toast]);

  const loadMessages = useCallback(async () => {
    try {
      const data = await api.getMessages();
      setMessages(data);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить чат', variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => {
    loadTitles();
    loadTasks();
    loadMessages();
  }, [loadTitles, loadTasks, loadMessages]);

  // Обновление времени каждую минуту
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await api.updateTime(user.id, 1);
        if (result.coins) setCoins(result.coins);
        if (result.completedTasks?.length > 0) {
          result.completedTasks.forEach((task: { name: string; reward: number }) => {
            toast({ title: '✅ Задание выполнено!', description: `${task.name} (+${task.reward} монет)` });
          });
          loadTasks();
        }
      } catch (error) {
        console.error('Update time error:', error);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [user.id, toast, loadTasks]);

  // Обновление чата каждые 3 секунды
  useEffect(() => {
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const handleBuyTitle = async () => {
    if (!selectedTitle) return;
    try {
      const result = await api.buyTitle(user.id, selectedTitle.id);
      if (result.error) {
        toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
      } else {
        setCoins(result.coins);
        toast({ title: '🎉 Поздравляем!', description: result.message });
        loadTitles();
        loadTasks();
        setShowBuyDialog(false);
        setSelectedTitle(null);
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось купить титул', variant: 'destructive' });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const result = await api.sendMessage(user.id, user.username, newMessage);
      if (result.success) {
        setMessages([...messages, result.message]);
        setNewMessage('');
        if (result.coins) setCoins(result.coins);
        if (result.completedTasks?.length > 0) {
          result.completedTasks.forEach((task: { name: string; reward: number }) => {
            toast({ title: '✅ Задание выполнено!', description: `${task.name} (+${task.reward} монет)` });
          });
          loadTasks();
        }
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast({ title: 'Ошибка', description: 'Не удалось отправить', variant: 'destructive' });
    }
  };

  const handleTabChange = async (value: string) => {
    setCurrentTab(value);
    try {
      await api.doAction(user.id, 'action', 1);
    } catch (error) {
      console.error('Action error:', error);
    }
  };

  const handleAdminGiveCoins = async (targetId: number) => {
    try {
      const result = await api.giveCoins(user.id, targetId, adminAmount);
      if (result.success) {
        toast({ title: '✅ Успешно', description: result.message });
        setAdminAmount(0);
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось выдать монеты', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-purple-900/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Icon name="Crown" size={24} />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ЧикенТитул
            </h1>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/50 rounded-lg px-4 py-2 flex items-center gap-2">
              <Icon name="Coins" size={20} className="text-yellow-400" />
              <span className="font-bold text-yellow-400">{coins}</span>
            </div>
            <Badge className="bg-purple-600 text-white">{user.username}</Badge>
            {user.isAdmin && (
              <Button size="sm" onClick={() => setAdminPanel(!adminPanel)} variant="secondary">
                <Icon name="Shield" size={16} className="mr-1" />
                Админ
              </Button>
            )}
            <Button size="sm" onClick={onLogout} variant="outline">
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {adminPanel && user.isAdmin && (
          <Card className="bg-red-900/20 border-red-500/50 p-6 mb-6">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Админ-панель</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Input
                  type="number"
                  value={adminAmount}
                  onChange={(e) => setAdminAmount(Number(e.target.value))}
                  placeholder="Количество монет"
                  className="mb-2"
                />
                <Button onClick={() => handleAdminGiveCoins(user.id)}>Выдать себе</Button>
              </div>
            </div>
          </Card>
        )}

        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 bg-slate-900 border border-purple-900/50">
            <TabsTrigger value="titles" className="data-[state=active]:bg-purple-600">
              <Icon name="Award" size={16} className="mr-2" />
              Титулы
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-purple-600">
              <Icon name="ListChecks" size={16} className="mr-2" />
              Задания
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-purple-600">
              <Icon name="MessageSquare" size={16} className="mr-2" />
              Чат
            </TabsTrigger>
          </TabsList>

          <TabsContent value="titles" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {titles.map((title) => (
                <Card key={title.id} className={`bg-slate-900/50 border-2 backdrop-blur-sm transition-all hover:scale-105 ${title.owned ? 'border-green-500/50' : 'border-purple-900/50'}`}>
                  <div className="p-6">
                    <h3 className={`text-xl font-bold mb-2 ${title.owned ? 'text-purple-400' : 'text-gray-500'}`} style={{userSelect: title.owned ? 'text' : 'none'}}>{title.name}</h3>
                    <p className="text-sm text-gray-400 mb-3">{title.description}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon name="Coins" size={16} className="text-yellow-400" />
                      <span className="text-yellow-400 font-bold">{title.price}</span>
                    </div>
                    {title.owned ? (
                      <Badge className="bg-green-500/20 text-green-400">Куплен</Badge>
                    ) : (
                      <Button onClick={() => { setSelectedTitle(title); setShowBuyDialog(true); }} disabled={coins < title.price} className="w-full">Купить</Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <ScrollArea className="h-[600px]">
              <div className="space-y-4 pr-4">
                {tasks.map((task) => (
                  <Card key={task.id} className={`bg-slate-900/50 border ${task.completed ? 'border-green-500/50' : 'border-purple-900/50'}`}>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-1 text-purple-300">{task.name}</h3>
                      <p className="text-sm text-gray-400 mb-3">{task.description}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <Icon name="Gift" size={16} className="text-yellow-400" />
                        <span className="text-yellow-400 font-bold">+{task.reward}</span>
                      </div>
                      {!task.completed && (
                        <>
                          <div className="flex justify-between text-sm text-gray-400 mb-2">
                            <span>Прогресс</span>
                            <span>{task.progress} / {task.max_progress}</span>
                          </div>
                          <Progress value={(task.progress / task.max_progress) * 100} className="h-2" />
                        </>
                      )}
                      {task.completed && (
                        <Badge className="bg-green-500/20 text-green-400"><Icon name="Check" size={14} className="mr-1" />Выполнено</Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <Card className="bg-slate-900/50 border-purple-900/50">
              <div className="p-6">
                <ScrollArea className="h-[400px] mb-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className="mb-3 p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-bold ${msg.isAdmin ? 'text-red-400' : 'text-purple-400'}`}>{msg.username}</span>
                        {msg.isAdmin && <Badge className="bg-red-500/20 text-red-400">ADMIN</Badge>}
                      </div>
                      <p className="text-gray-300">{msg.message}</p>
                    </div>
                  ))}
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Написать сообщение..."
                    className="flex-1 bg-slate-800"
                    maxLength={500}
                  />
                  <Button type="submit" disabled={!newMessage.trim()}>
                    <Icon name="Send" size={16} />
                  </Button>
                </form>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent className="bg-slate-900 border-purple-900/50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-purple-400">Подтверждение покупки</DialogTitle>
            <DialogDescription>Вы хотите приобрести этот титул?</DialogDescription>
          </DialogHeader>
          {selectedTitle && (
            <div className="py-6">
              <div className="bg-slate-800/50 border border-purple-900/50 rounded-lg p-4 mb-4">
                <p className="text-2xl font-bold text-center text-purple-400 mb-2">{selectedTitle.name}</p>
                <p className="text-sm text-gray-400 text-center mb-3">{selectedTitle.description}</p>
                <div className="flex items-center justify-center gap-2">
                  <Icon name="Coins" size={20} className="text-yellow-400" />
                  <span className="text-yellow-400 font-bold text-xl">{selectedTitle.price}</span>
                </div>
              </div>
              <div className="bg-slate-800/50 border border-purple-900/50 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Ваш баланс:</span>
                  <span className="text-yellow-400 font-bold">{coins}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-gray-400">После покупки:</span>
                  <span className="text-yellow-400 font-bold">{coins - selectedTitle.price}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBuyDialog(false)}>Отмена</Button>
            <Button onClick={handleBuyTitle} disabled={!selectedTitle || coins < selectedTitle.price}>Купить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}