import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  const stats = [
    { title: 'Новые заказы', value: '24', icon: 'ClipboardList', color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'В работе', value: '18', icon: 'Wrench', color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Готово к выдаче', value: '7', icon: 'CheckCircle', color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Выручка за день', value: '₽45,780', icon: 'TrendingUp', color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Добро пожаловать, {user?.username || 'Пользователь'}!
        </h1>
        <p className="text-slate-600 mt-1">
          Сегодня {new Date().toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon name={stat.icon} size={24} className={stat.color} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Последние заказы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: '2024-001', client: 'Иванов И.И.', device: 'iPhone 13 Pro', status: 'new' },
                { id: '2024-002', client: 'Петров П.П.', device: 'Samsung Galaxy S21', status: 'in_progress' },
                { id: '2024-003', client: 'Сидорова А.А.', device: 'MacBook Pro', status: 'ready' },
              ].map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">{order.client}</p>
                    <p className="text-sm text-slate-600">{order.device}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">№{order.id}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'new'
                          ? 'bg-blue-100 text-blue-700'
                          : order.status === 'in_progress'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {order.status === 'new' ? 'Новый' : order.status === 'in_progress' ? 'В работе' : 'Готов'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Задачи на сегодня</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { task: 'Проверить наличие запчастей', priority: 'high' },
                { task: 'Связаться с клиентом по заказу №2024-001', priority: 'medium' },
                { task: 'Провести инвентаризацию склада', priority: 'low' },
                { task: 'Обработать возвраты', priority: 'medium' },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{item.task}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      item.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : item.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.priority === 'high' ? 'Высокий' : item.priority === 'medium' ? 'Средний' : 'Низкий'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
