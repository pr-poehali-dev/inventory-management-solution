import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import OrderForm from '@/components/OrderForm';

type Order = {
  id: number;
  order_number: string;
  contractor_name?: string;
  phone?: string;
  device?: string;
  status: string;
  created_at: string;
  estimated_price?: number;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 1,
      order_number: '2024-001',
      contractor_name: 'Иванов Иван Иванович',
      phone: '+7 (999) 123-45-67',
      device: 'iPhone 13 Pro',
      status: 'new',
      created_at: '2024-01-06T10:30:00',
      estimated_price: 5000,
    },
    {
      id: 2,
      order_number: '2024-002',
      contractor_name: 'Петров Петр Петрович',
      phone: '+7 (999) 987-65-43',
      device: 'Samsung Galaxy S21',
      status: 'in_progress',
      created_at: '2024-01-05T14:20:00',
      estimated_price: 3500,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-orange-100 text-orange-700',
    waiting_parts: 'bg-yellow-100 text-yellow-700',
    ready: 'bg-green-100 text-green-700',
    completed: 'bg-slate-100 text-slate-700',
    canceled: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    new: 'Новый',
    in_progress: 'В работе',
    waiting_parts: 'Ожидание запчастей',
    ready: 'Готов к выдаче',
    completed: 'Завершён',
    canceled: 'Отменён',
  };

  const handleCreateOrder = () => {
    setEditingOrder(null);
    setIsDialogOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setIsDialogOpen(true);
  };

  const handleSaveOrder = (formData: any) => {
    if (editingOrder) {
      toast.success('Заказ обновлён');
    } else {
      const newOrder: Order = {
        id: orders.length + 1,
        order_number: `2024-${String(orders.length + 1).padStart(3, '0')}`,
        contractor_name: formData.contractor_name,
        phone: formData.phone,
        device: formData.device,
        status: 'new',
        created_at: new Date().toISOString(),
        estimated_price: parseFloat(formData.estimated_price) || 0,
      };
      setOrders([...orders, newOrder]);
      toast.success('Заказ создан');
    }
    setIsDialogOpen(false);
  };

  const handleDeleteOrder = (id: number) => {
    if (confirm('Удалить этот заказ?')) {
      setOrders(orders.filter((o) => o.id !== id));
      toast.success('Заказ удалён');
    }
  };

  const handlePrint = (order: Order) => {
    setSelectedOrder(order);
    setShowPrintDialog(true);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.contractor_name && order.contractor_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.phone && order.phone.includes(searchQuery));

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">Заказы</h1>
        <Button onClick={handleCreateOrder}>
          <Icon name="Plus" size={16} className="mr-2" />
          Новый заказ
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative flex-1 w-full">
              <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Поиск по номеру, клиенту, телефону..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {searchQuery || statusFilter !== 'all' ? 'Ничего не найдено' : 'Нет заказов'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Номер</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Устройство</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.contractor_name || '-'}</TableCell>
                    <TableCell>{order.phone || '-'}</TableCell>
                    <TableCell>{order.device || '-'}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
                    </TableCell>
                    <TableCell>{order.estimated_price ? `₽${order.estimated_price}` : '-'}</TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditOrder(order)} title="Редактировать">
                          <Icon name="Edit" size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handlePrint(order)} title="Печать">
                          <Icon name="Printer" size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOrder(order.id)}
                          title="Удалить"
                        >
                          <Icon name="Trash2" size={16} className="text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrder ? 'Редактирование заказа' : 'Новый заказ'}</DialogTitle>
          </DialogHeader>
          <OrderForm
            order={editingOrder}
            onSave={handleSaveOrder}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Печать квитанции</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="border rounded-lg p-6 bg-white">
                <h2 className="text-2xl font-bold text-center mb-6">Квитанция приёма устройства</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold">Номер заказа:</span>
                    <span>{selectedOrder.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Дата:</span>
                    <span>{new Date(selectedOrder.created_at).toLocaleString('ru-RU')}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between">
                    <span className="font-semibold">Клиент:</span>
                    <span>{selectedOrder.contractor_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Телефон:</span>
                    <span>{selectedOrder.phone}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between">
                    <span className="font-semibold">Устройство:</span>
                    <span>{selectedOrder.device}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Ориентировочная стоимость:</span>
                    <span>₽{selectedOrder.estimated_price}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
                  Отмена
                </Button>
                <Button onClick={() => window.print()}>
                  <Icon name="Printer" size={16} className="mr-2" />
                  Печать
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
