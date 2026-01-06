import { useState, useEffect } from 'react';
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
import OrderEditDialog from '@/components/OrderEditDialog';

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

const API_URL = 'https://functions.poehali.dev/a0a3f940-a595-406d-b57b-f0f76daedcb4';
const SETTINGS_API_URL = 'https://functions.poehali.dev/6123a2c4-f406-4686-ab76-a98c948f8bd8';

type OrderStatus = {
  id: number;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<any>(null);

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

  useEffect(() => {
    fetchStatuses();
    fetchOrders();
  }, [statusFilter]);

  const fetchStatuses = async () => {
    try {
      const response = await fetch(`${SETTINGS_API_URL}?type=statuses`);
      const data = await response.json();
      setStatuses(data || []);
    } catch (error) {
      console.error('Error fetching statuses:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = API_URL;
      
      if (statusFilter !== 'all') {
        const statusMap: Record<string, string> = {
          'Новый': 'new',
          'В работе': 'in_progress',
          'Ожидание запчастей': 'waiting_parts',
          'Готов': 'ready',
          'Выдан': 'completed',
          'Отменён': 'canceled'
        };
        const statusCode = statusMap[statusFilter] || statusFilter;
        url = `${API_URL}?status=${statusCode}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Ошибка загрузки заказов');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = () => {
    setEditingOrder(null);
    setIsDialogOpen(true);
  };

  const handleEditOrder = async (order: Order) => {
    try {
      const response = await fetch(`${API_URL}?id=${order.id}`);
      const fullOrder = await response.json();
      setOrderToEdit(fullOrder);
      setShowEditDialog(true);
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('Ошибка загрузки заказа');
    }
  };

  const handleSaveOrder = async (formData: any) => {
    try {
      if (editingOrder) {
        await fetch(API_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, id: editingOrder.id }),
        });
        toast.success('Заказ обновлён');
      } else {
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        toast.success('Заказ создан');
      }
      setIsDialogOpen(false);
      fetchOrders();
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Ошибка сохранения заказа');
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('Удалить этот заказ?')) return;

    try {
      const response = await fetch(`${API_URL}?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Ошибка удаления заказа');
        return;
      }
      
      toast.success('Заказ удалён');
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Ошибка удаления заказа');
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

    return matchesSearch;
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
        <CardHeader className="py-3">
          <div className="space-y-3">
            <div className="relative">
              <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Поиск по номеру, клиенту, телефону..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon name="LayoutGrid" size={14} />
                Все
              </button>
              {statuses.filter(s => s.is_active).map((status) => (
                <button
                  key={status.id}
                  onClick={() => setStatusFilter(status.name)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    statusFilter === status.name
                      ? 'text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={{
                    backgroundColor: statusFilter === status.name ? status.color : undefined,
                  }}
                >
                  <Icon name={status.icon as any} size={14} />
                  {status.name}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Загрузка...</div>
          ) : filteredOrders.length === 0 ? (
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
          <OrderForm order={editingOrder} onSave={handleSaveOrder} onCancel={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <OrderEditDialog
        order={orderToEdit}
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSave={async (formData) => {
          try {
            await fetch(API_URL, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...formData, id: orderToEdit.id }),
            });
            
            if (formData.items && formData.items.length > 0) {
              await fetch(`${API_URL}?orderId=${orderToEdit.id}&action=items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: formData.items }),
              });
            }
            
            toast.success('Заказ обновлён');
            setShowEditDialog(false);
            fetchOrders();
          } catch (error) {
            console.error('Error saving order:', error);
            toast.error('Ошибка сохранения заказа');
          }
        }}
      />

      {/* Print Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Печать заказа-наряда №{selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-white p-6 border border-slate-200 rounded-lg" id="print-area">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold">ЗАКАЗ-НАРЯД</h2>
                <p className="text-lg">№{selectedOrder?.order_number}</p>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Дата:</strong> {selectedOrder && new Date(selectedOrder.created_at).toLocaleDateString('ru-RU')}
                </p>
                <p>
                  <strong>Клиент:</strong> {selectedOrder?.contractor_name}
                </p>
                <p>
                  <strong>Телефон:</strong> {selectedOrder?.phone}
                </p>
                <p>
                  <strong>Устройство:</strong> {selectedOrder?.device}
                </p>
                <p>
                  <strong>Стоимость:</strong> {selectedOrder?.estimated_price} ₽
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
                Закрыть
              </Button>
              <Button
                onClick={() => {
                  window.print();
                }}
              >
                <Icon name="Printer" size={16} className="mr-2" />
                Печать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}