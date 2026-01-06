import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type OrderEditDialogProps = {
  order: any | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
};

const ORDERS_API = 'https://functions.poehali.dev/a0a3f940-a595-406d-b57b-f0f76daedcb4';
const DIRECTORIES_API = 'https://functions.poehali.dev/9ff1eb5a-8845-48c1-b870-ef4ea34f6d76';

export default function OrderEditDialog({ order, open, onClose, onSave }: OrderEditDialogProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'materials'>('info');
  
  const [formData, setFormData] = useState<any>({
    contractor_name: '',
    phone: '',
    device_type: '',
    brand: '',
    model: '',
    manager_id: null,
    recommendation: '',
    discount_percent: 0,
    discount_amount: 0,
  });

  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [historyComment, setHistoryComment] = useState('');
  
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showServiceSearch, setShowServiceSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open && order) {
      loadOrderData();
      fetchUsers();
      fetchProducts();
      fetchServices();
      fetchStatuses();
    }
  }, [open, order]);

  const loadOrderData = async () => {
    if (!order) return;
    
    // Маппинг кодов статусов в русские названия для отображения
    const statusCodeToNameMap: Record<string, string> = {
      'new': 'Новый',
      'in_progress': 'В работе',
      'waiting_parts': 'Ожидание запчастей',
      'ready': 'Готов',
      'completed': 'Выдан',
      'canceled': 'Отменён'
    };
    
    setFormData({
      ...order,
      status: statusCodeToNameMap[order.status] || order.status || 'Новый',
      manager_id: order.manager_id || null,
      discount_percent: order.discount_percent || 0,
      discount_amount: order.discount_amount || 0,
      recommendation: order.recommendation || '',
    });

    try {
      const itemsRes = await fetch(`${ORDERS_API}?orderId=${order.id}&action=items`);
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setOrderItems(Array.isArray(itemsData) ? itemsData : []);
      }

      const historyRes = await fetch(`${ORDERS_API}?orderId=${order.id}&action=history`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(Array.isArray(historyData) ? historyData : []);
      }
    } catch (error) {
      console.error('Error loading order data:', error);
      setOrderItems([]);
      setHistory([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${DIRECTORIES_API}?type=users`);
      const data = await response.json();
      setUsers(data?.filter((u: any) => u.is_active) || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${DIRECTORIES_API}?type=products`);
      const data = await response.json();
      setProducts(data?.filter((p: any) => p.is_active) || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch(`${DIRECTORIES_API}?type=services`);
      const data = await response.json();
      setServices(data?.filter((s: any) => s.is_active) || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/6123a2c4-f406-4686-ab76-a98c948f8bd8?type=statuses');
      const data = await response.json();
      setStatuses(data?.filter((s: any) => s.is_active) || []);
    } catch (error) {
      console.error('Error fetching statuses:', error);
    }
  };

  const addItem = (item: any, type: 'product' | 'service') => {
    const newItem = {
      id: Date.now(),
      item_type: type,
      item_id: item.id,
      item_name: item.name,
      quantity: 1,
      price: type === 'product' ? item.sale_price : item.price,
      warranty_months: item.warranty_months || 0,
      total: type === 'product' ? item.sale_price : item.price,
    };
    setOrderItems([...orderItems, newItem]);
    setShowProductSearch(false);
    setShowServiceSearch(false);
    setSearchQuery('');
  };

  const updateItem = (id: number, field: string, value: any) => {
    setOrderItems(orderItems.map((item) => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price') {
          updated.total = updated.quantity * updated.price;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: number) => {
    setOrderItems(orderItems.filter((item) => item.id !== id));
  };

  const calculateTotals = () => {
    if (!Array.isArray(orderItems)) {
      return { subtotal: 0, discount: 0, total: 0 };
    }
    const subtotal = orderItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const discount = formData.discount_percent 
      ? subtotal * (formData.discount_percent / 100)
      : formData.discount_amount || 0;
    return { subtotal, discount, total: subtotal - discount };
  };

  const addHistoryComment = async () => {
    if (!historyComment.trim() || !order) return;
    
    try {
      await fetch(`${ORDERS_API}?orderId=${order.id}&action=history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: historyComment,
          action_type: 'comment',
        }),
      });
      setHistoryComment('');
      loadOrderData();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleSave = () => {
    const totals = calculateTotals();
    
    // Маппинг русских названий статусов в коды для базы данных
    const statusMap: Record<string, string> = {
      'Новый': 'new',
      'В работе': 'in_progress',
      'Ожидание запчастей': 'waiting_parts',
      'Готов': 'ready',
      'Выдан': 'completed',
      'Отменён': 'canceled'
    };
    
    const statusCode = statusMap[formData.status] || formData.status || 'new';
    
    onSave({
      ...formData,
      status: statusCode,
      items: orderItems,
      total_amount: totals.total,
      discount_amount: totals.discount,
    });
  };

  const { subtotal, discount, total } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] h-[98vh] p-0">
        <div className="flex flex-col h-full">
          {/* Fixed Header */}
          <div className="border-b bg-white p-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Заказ №{order?.order_number}</h2>
              <div className="flex gap-2">
                <Button onClick={handleSave}>Сохранить</Button>
                <Button variant="outline" onClick={onClose}>Закрыть</Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Left Side - Main Content */}
            <div className="flex-1 overflow-auto p-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab('info')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg',
                    activeTab === 'info'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  Информация о заказе
                </button>
                <button
                  onClick={() => setActiveTab('materials')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg',
                    activeTab === 'materials'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  Работы и материалы
                </button>
              </div>

              {activeTab === 'info' && (
                <div className="space-y-3">
                  {/* КЛИЕНТ */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-slate-600 uppercase border-b pb-1">Клиент</h3>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs">Контрагент *</Label>
                        <Input className="h-7 text-xs" value={formData.contractor_name || ''} onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })} required />
                      </div>
                      <div>
                        <Label className="text-xs">Телефон *</Label>
                        <Input className="h-7 text-xs" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Адрес</Label>
                        <Input className="h-7 text-xs" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* УСТРОЙСТВО */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-slate-600 uppercase border-b pb-1">Устройство</h3>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs">Серийный номер</Label>
                        <Input className="h-7 text-xs" value={formData.serial_number || ''} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">Цвет</Label>
                        <Input className="h-7 text-xs" value={formData.color || ''} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">Защитный код</Label>
                        <Input className="h-7 text-xs" type="password" value={formData.security_code || ''} onChange={(e) => setFormData({ ...formData, security_code: e.target.value })} />
                      </div>
                      <div className="flex items-center space-x-2 pt-4">
                        <input type="checkbox" checked={formData.device_turns_on || false} onChange={(e) => setFormData({ ...formData, device_turns_on: e.target.checked })} className="h-3 w-3" />
                        <span className="text-xs">Включается</span>
                      </div>
                      <div className="col-span-4">
                        <Label className="text-xs">Внешний вид</Label>
                        <Textarea className="text-xs min-h-[50px]" value={formData.appearance || ''} onChange={(e) => setFormData({ ...formData, appearance: e.target.value })} rows={2} />
                      </div>
                      <div className="col-span-4">
                        <Label className="text-xs">Неисправность *</Label>
                        <Textarea className="text-xs min-h-[50px]" value={formData.malfunction || ''} onChange={(e) => setFormData({ ...formData, malfunction: e.target.value })} rows={2} required />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Причина поломки</Label>
                        <Input className="h-7 text-xs" value={formData.failure_reason || ''} onChange={(e) => setFormData({ ...formData, failure_reason: e.target.value })} />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Комплектация</Label>
                        <Input className="h-7 text-xs" value={formData.accessories || ''} onChange={(e) => setFormData({ ...formData, accessories: e.target.value })} />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">Что ремонтируем?</Label>
                        <Textarea className="text-xs min-h-[50px]" value={formData.repair_description || ''} onChange={(e) => setFormData({ ...formData, repair_description: e.target.value })} rows={2} />
                      </div>
                      <div className="flex items-center space-x-2 pt-4">
                        <input type="checkbox" checked={formData.return_defective_parts || false} onChange={(e) => setFormData({ ...formData, return_defective_parts: e.target.checked })} className="h-3 w-3" />
                        <span className="text-xs">Возврат деталей</span>
                      </div>
                    </div>
                  </div>

                  {/* ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-slate-600 uppercase border-b pb-1">Дополнительно</h3>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs">Статус *</Label>
                        <Select value={formData.status || 'Новый'} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Выберите статус" />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((status) => (
                              <SelectItem key={status.id} value={status.name}>{status.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Менеджер</Label>
                        <Select value={formData.manager_id?.toString() || ''} onValueChange={(value) => setFormData({ ...formData, manager_id: parseInt(value) })}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Выберите" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>{user.full_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Цена (₽)</Label>
                        <Input className="h-7 text-xs" type="number" value={formData.estimated_price || ''} onChange={(e) => setFormData({ ...formData, estimated_price: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">Предоплата (₽)</Label>
                        <Input className="h-7 text-xs" type="number" value={formData.prepayment || ''} onChange={(e) => setFormData({ ...formData, prepayment: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">Крайний срок</Label>
                        <Input className="h-7 text-xs" type="date" value={formData.deadline_date || ''} onChange={(e) => setFormData({ ...formData, deadline_date: e.target.value })} />
                      </div>
                      <div className="col-span-4">
                        <Label className="text-xs">Комментарий приёмщика</Label>
                        <Textarea className="text-xs min-h-[50px]" value={formData.receiver_comment || ''} onChange={(e) => setFormData({ ...formData, receiver_comment: e.target.value })} rows={2} />
                      </div>
                      <div className="col-span-4">
                        <Label className="text-xs">Рекомендация клиенту</Label>
                        <Textarea className="text-xs min-h-[50px]" value={formData.recommendation || ''} onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })} rows={2} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'materials' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowProductSearch(!showProductSearch)}
                    >
                      <Icon name="Plus" size={14} className="mr-1" />
                      Добавить товар
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowServiceSearch(!showServiceSearch)}
                    >
                      <Icon name="Plus" size={14} className="mr-1" />
                      Добавить работу
                    </Button>
                  </div>

                  {showProductSearch && (
                    <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                      <Input
                        placeholder="Поиск товара..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-xs"
                      />
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {products
                          .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .slice(0, 10)
                          .map((product) => (
                            <button
                              key={product.id}
                              onClick={() => addItem(product, 'product')}
                              className="w-full text-left p-2 hover:bg-white rounded text-xs"
                            >
                              <div className="font-medium">{product.name}</div>
                              <div className="text-slate-500">{product.sale_price} ₽</div>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {showServiceSearch && (
                    <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                      <Input
                        placeholder="Поиск работы..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-xs"
                      />
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {services
                          .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .slice(0, 10)
                          .map((service) => (
                            <button
                              key={service.id}
                              onClick={() => addItem(service, 'service')}
                              className="w-full text-left p-2 hover:bg-white rounded text-xs"
                            >
                              <div className="font-medium">{service.name}</div>
                              <div className="text-slate-500">{service.price} ₽</div>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(orderItems) && orderItems.length > 0 && (
                    <div className="bg-white rounded-lg border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="text-left p-2 font-semibold">Наименование</th>
                            <th className="text-center p-2 font-semibold w-20">Кол-во</th>
                            <th className="text-center p-2 font-semibold w-20">Гарантия</th>
                            <th className="text-right p-2 font-semibold w-24">Цена</th>
                            <th className="text-right p-2 font-semibold w-24">Сумма</th>
                            <th className="w-8"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderItems.map((item) => (
                            <tr key={item.id} className="border-b">
                              <td className="p-1.5">{item.item_name}</td>
                              <td className="p-1.5">
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                                  className="w-full text-center text-xs h-7"
                                  step="0.01"
                                />
                              </td>
                              <td className="p-1.5 text-center">{item.warranty_months} мес</td>
                              <td className="p-1.5">
                                <Input
                                  type="number"
                                  value={item.price}
                                  onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value))}
                                  className="w-full text-right text-xs h-7"
                                />
                              </td>
                              <td className="p-1.5 text-right font-medium">{(Number(item.total) || 0).toFixed(2)}</td>
                              <td className="p-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(item.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Icon name="Trash2" size={12} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="bg-slate-50 p-3 rounded-lg space-y-2 max-w-md ml-auto">
                    <div className="flex justify-between text-xs">
                      <span>Итого товаров и услуг:</span>
                      <span className="font-medium">{(Number(subtotal) || 0).toFixed(2)} ₽</span>
                    </div>
                    
                    <div className="flex gap-2 items-center">
                      <Label className="text-xs">Скидка:</Label>
                      <Input
                        type="number"
                        placeholder="%"
                        value={formData.discount_percent || ''}
                        onChange={(e) => setFormData({ ...formData, discount_percent: parseFloat(e.target.value) || 0, discount_amount: 0 })}
                        className="w-16 text-xs h-7"
                      />
                      <span className="text-xs">или</span>
                      <Input
                        type="number"
                        placeholder="₽"
                        value={formData.discount_amount || ''}
                        onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0, discount_percent: 0 })}
                        className="w-20 text-xs h-7"
                      />
                    </div>
                    
                    {discount > 0 && (
                      <div className="flex justify-between text-xs text-red-600">
                        <span>Скидка:</span>
                        <span>-{(Number(discount) || 0).toFixed(2)} ₽</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm font-bold border-t pt-2">
                      <span>К оплате:</span>
                      <span>{(Number(total) || 0).toFixed(2)} ₽</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Рекомендация клиенту</Label>
                    <Textarea
                      value={formData.recommendation || ''}
                      onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                      rows={3}
                      placeholder="Введите рекомендации..."
                      className="text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - History */}
            <div className="w-80 border-l bg-slate-50 overflow-auto p-4">
              <h3 className="text-sm font-bold mb-3">История изменений</h3>
              <div className="space-y-2">
                {Array.isArray(history) && history.map((item) => (
                  <div key={item.id} className="bg-white border rounded-lg p-2 shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-xs font-medium text-slate-700">{item.action_type}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(item.created_at).toLocaleString('ru-RU', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                    <div className="text-xs text-slate-600">{item.description}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t">
                <Label className="text-xs">Добавить комментарий</Label>
                <Textarea
                  value={historyComment}
                  onChange={(e) => setHistoryComment(e.target.value)}
                  rows={3}
                  placeholder="Введите комментарий..."
                  className="text-xs mt-1"
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={addHistoryComment} className="text-xs h-7">
                    <Icon name="Send" size={12} className="mr-1" />
                    Отправить
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}