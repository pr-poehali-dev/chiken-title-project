import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Title {
  id: string;
  name: string;
  price: number;
  owned: boolean;
}

interface Task {
  id: string;
  name: string;
  reward: number;
  progress: number;
  maxProgress: number;
  completed: boolean;
}

export default function Index() {
  const [coins, setCoins] = useState(100);
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);
  const [showBuyDialog, setShowBuyDialog] = useState(false);

  const [titles, setTitles] = useState<Title[]>([
    { id: '1', name: '[NEWBIE]', price: 0, owned: true },
    { id: '2', name: '[VIP]', price: 500, owned: false },
    { id: '3', name: '[ADMIN]', price: 1000, owned: false },
    { id: '4', name: '[SNIPER]', price: 750, owned: false },
    { id: '5', name: '[LEGEND]', price: 2000, owned: false },
    { id: '6', name: '[KING]', price: 3000, owned: false },
    { id: '7', name: '[TASK-MASTER]', price: 1500, owned: false },
    { id: '8', name: '[CHEATER]', price: 999, owned: false },
    { id: '9', name: '[CREATOR]', price: 5000, owned: false },
    { id: '10', name: '[COLLAB]', price: 800, owned: false },
    { id: '11', name: '[SAF ADMIN]', price: 2500, owned: false },
    { id: '12', name: '[SAT ADMIN]', price: 2500, owned: false },
    { id: '13', name: '[TROLLER]', price: 666, owned: false },
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', name: 'Провести 15 минут на сайте', reward: 50, progress: 0, maxProgress: 15, completed: false },
    { id: '2', name: 'Посетить магазин титулов', reward: 20, progress: 0, maxProgress: 1, completed: false },
    { id: '3', name: 'Открыть все вкладки', reward: 30, progress: 0, maxProgress: 4, completed: false },
    { id: '4', name: 'Купить первый титул', reward: 100, progress: 0, maxProgress: 1, completed: false },
    { id: '5', name: 'Провести 30 минут на сайте', reward: 100, progress: 0, maxProgress: 30, completed: false },
    { id: '6', name: 'Посмотреть все титулы', reward: 25, progress: 0, maxProgress: 13, completed: false },
    { id: '7', name: 'Провести 1 час на сайте', reward: 200, progress: 0, maxProgress: 60, completed: false },
    { id: '8', name: 'Собрать 1000 ТитулКоинов', reward: 150, progress: 0, maxProgress: 1000, completed: false },
    { id: '9', name: 'Купить 3 титула', reward: 250, progress: 0, maxProgress: 3, completed: false },
    { id: '10', name: 'Провести 2 часа на сайте', reward: 400, progress: 0, maxProgress: 120, completed: false },
    { id: '11', name: 'Купить 5 титулов', reward: 500, progress: 0, maxProgress: 5, completed: false },
    { id: '12', name: 'Собрать 5000 ТитулКоинов', reward: 750, progress: 0, maxProgress: 5000, completed: false },
    { id: '13', name: 'Купить легендарный титул', reward: 300, progress: 0, maxProgress: 1, completed: false },
    { id: '14', name: 'Провести 5 часов на сайте', reward: 1000, progress: 0, maxProgress: 300, completed: false },
    { id: '15', name: 'Купить все титулы', reward: 2000, progress: 0, maxProgress: 13, completed: false },
    { id: '16', name: 'Выполнить 10 заданий', reward: 300, progress: 0, maxProgress: 10, completed: false },
    { id: '17', name: 'Собрать 10000 ТитулКоинов', reward: 1500, progress: 0, maxProgress: 10000, completed: false },
    { id: '18', name: 'Провести 10 часов на сайте', reward: 2500, progress: 0, maxProgress: 600, completed: false },
    { id: '19', name: 'Посетить сайт 5 дней подряд', reward: 400, progress: 0, maxProgress: 5, completed: false },
    { id: '20', name: 'Посетить сайт 10 дней подряд', reward: 800, progress: 0, maxProgress: 10, completed: false },
  ]);

  const handleBuyTitle = (title: Title) => {
    setSelectedTitle(title);
    setShowBuyDialog(true);
  };

  const confirmBuy = () => {
    if (selectedTitle && coins >= selectedTitle.price) {
      setCoins(coins - selectedTitle.price);
      setTitles(titles.map(t => 
        t.id === selectedTitle.id ? { ...t, owned: true } : t
      ));
      setShowBuyDialog(false);
      setSelectedTitle(null);
    }
  };

  const handleCopyTitle = (title: Title, e: React.MouseEvent) => {
    e.preventDefault();
    if (title.owned) {
      navigator.clipboard.writeText(title.name);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-purple-900/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Icon name="Crown" size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ЧикенТитул
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/50 rounded-lg px-4 py-2 flex items-center gap-2">
              <Icon name="Coins" size={20} className="text-yellow-400" />
              <span className="font-bold text-yellow-400">{coins}</span>
              <span className="text-yellow-400/70 text-sm">ТитулКоинов</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="titles" className="w-full">
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

          {/* Titles Tab */}
          <TabsContent value="titles" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {titles.map((title) => (
                <Card 
                  key={title.id} 
                  className={`bg-slate-900/50 border-2 backdrop-blur-sm transition-all hover:scale-105 ${
                    title.owned ? 'border-green-500/50' : 'border-purple-900/50'
                  }`}
                  style={{ userSelect: title.owned ? 'text' : 'none' }}
                  onCopy={(e) => !title.owned && e.preventDefault()}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 
                          className={`text-xl font-bold mb-2 ${
                            title.owned ? 'text-purple-400 cursor-pointer' : 'text-gray-500'
                          }`}
                          onClick={(e) => handleCopyTitle(title, e)}
                          style={{ 
                            userSelect: title.owned ? 'text' : 'none',
                            WebkitUserSelect: title.owned ? 'text' : 'none',
                            MozUserSelect: title.owned ? 'text' : 'none',
                            msUserSelect: title.owned ? 'text' : 'none'
                          }}
                          onMouseDown={(e) => !title.owned && e.preventDefault()}
                        >
                          {title.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Icon name="Coins" size={16} className="text-yellow-400" />
                          <span className="text-yellow-400 font-bold">{title.price}</span>
                        </div>
                      </div>
                      {title.owned && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                          Куплен
                        </Badge>
                      )}
                    </div>
                    
                    {!title.owned && (
                      <Button 
                        onClick={() => handleBuyTitle(title)}
                        disabled={coins < title.price}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icon name="ShoppingCart" size={16} className="mr-2" />
                        Купить
                      </Button>
                    )}
                    
                    {title.owned && (
                      <p className="text-sm text-green-400 text-center">
                        Нажми на титул, чтобы скопировать
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-6">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {tasks.map((task) => (
                  <Card 
                    key={task.id} 
                    className={`bg-slate-900/50 border backdrop-blur-sm ${
                      task.completed ? 'border-green-500/50' : 'border-purple-900/50'
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2 text-purple-300">
                            {task.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Icon name="Gift" size={16} className="text-yellow-400" />
                            <span className="text-yellow-400 font-bold">+{task.reward}</span>
                            <span className="text-yellow-400/70 text-sm">ТитулКоинов</span>
                          </div>
                        </div>
                        {task.completed && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                            <Icon name="Check" size={14} className="mr-1" />
                            Выполнено
                          </Badge>
                        )}
                      </div>
                      
                      {!task.completed && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-400">
                            <span>Прогресс</span>
                            <span>{task.progress} / {task.maxProgress}</span>
                          </div>
                          <Progress 
                            value={(task.progress / task.maxProgress) * 100} 
                            className="h-2"
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-6">
            <Card className="bg-slate-900/50 border-purple-900/50 backdrop-blur-sm">
              <div className="p-6">
                <div className="flex items-center justify-center h-[500px] text-gray-500">
                  <div className="text-center">
                    <Icon name="MessageSquare" size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Чат будет доступен после регистрации</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Buy Confirmation Dialog */}
      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent className="bg-slate-900 border-purple-900/50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-purple-400">
              Подтверждение покупки
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Вы хотите приобрести этот титул?
            </DialogDescription>
          </DialogHeader>
          
          {selectedTitle && (
            <div className="py-6">
              <div className="bg-slate-800/50 border border-purple-900/50 rounded-lg p-4 mb-4">
                <p className="text-2xl font-bold text-center text-purple-400 mb-2">
                  {selectedTitle.name}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Icon name="Coins" size={20} className="text-yellow-400" />
                  <span className="text-yellow-400 font-bold text-xl">{selectedTitle.price}</span>
                  <span className="text-yellow-400/70">ТитулКоинов</span>
                </div>
              </div>
              
              <div className="bg-slate-800/50 border border-purple-900/50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Ваш баланс:</span>
                  <div className="flex items-center gap-2">
                    <Icon name="Coins" size={16} className="text-yellow-400" />
                    <span className="text-yellow-400 font-bold">{coins}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-400">После покупки:</span>
                  <div className="flex items-center gap-2">
                    <Icon name="Coins" size={16} className="text-yellow-400" />
                    <span className="text-yellow-400 font-bold">{coins - selectedTitle.price}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowBuyDialog(false)}
              className="border-purple-900/50"
            >
              Отмена
            </Button>
            <Button 
              onClick={confirmBuy}
              disabled={selectedTitle ? coins < selectedTitle.price : true}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Купить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
