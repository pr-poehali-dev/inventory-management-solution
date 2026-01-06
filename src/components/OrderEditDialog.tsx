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
  const [activeTab, setActiveTab] = useState<'info' | 'materials' | 'history'>('info');
  const [activeInfoTab, setActiveInfoTab] = useState<'general' | 'materials-work'>('general');
  
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
  
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showServiceSearch, setShowServiceSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open && order) {
      loadOrderData();
      fetchUsers();
      fetchProducts();
      fetchServices();
    }
  }, [open, order]);

  const loadOrderData = async () => {
    if (!order) return;
    
    setFormData({
      ...order,
      manager_id: order.manager_id || null,
      discount_percent: order.discount_percent || 0,
      discount_amount: order.discount_amount || 0,
      recommendation: order.recommendation || '',
    });

    try {
      const itemsRes = await fetch(`${ORDERS_API}/${order.id}/items`);
      const itemsData = await itemsRes.json();
      setOrderItems(itemsData || []);

      const historyRes = await fetch(`${ORDERS_API}/${order.id}/history`);
      const historyData = await historyRes.json();
      setHistory(historyData || []);
    } catch (error) {
      console.error('Error loading order data:', error);
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
      await fetch(`${ORDERS_API}/${order.id}/history`, {
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
    onSave({
      ...formData,
      items: orderItems,
      total_amount: totals.total,
      discount_amount: totals.discount,
    });
  };

  const { subtotal, discount, total } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[95vh] p-0">
        <div className="flex flex-col h-full">
          {/* Fixed Header */}
          <div className="border-b bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Заказ №{order?.order_number}</h2>
              <div className="flex gap-2">
                <Button onClick={handleSave}>Сохранить</Button>
                <Button variant="outline" onClick={onClose}>Закрыть</Button>
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-3 text-sm bg-slate-50 p-3 rounded-lg">
              <div>
                <div className="text-slate-500 text-xs">Контрагент</div>
                <div className="font-medium">{formData.contractor_name}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Телефон</div>
                <div className="font-medium">{formData.phone}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Тип устройства</div>
                <div className="font-medium">{formData.device_type}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Марка</div>
                <div className="font-medium">{formData.brand}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Модель</div>
                <div className="font-medium">{formData.model}</div>
              </div>
            </div>

            <div className="flex gap-2 border-b">
              <button
                onClick={() => setActiveTab('info')}
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'info'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                )}
              >
                Редактирование заказа
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'history'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                )}
              >
                История
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'info' && (
              <div>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setActiveInfoTab('general')}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-lg',
                      activeInfoTab === 'general'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    Информация о заказе
                  </button>
                  <button
                    onClick={() => setActiveInfoTab('materials-work')}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-lg',
                      activeInfoTab === 'materials-work'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    Работы и материалы
                  </button>
                </div>

                {activeInfoTab === 'general' && (
                  <div className="space-y-4 max-w-3xl">
                    <div>
                      <Label>Менеджер</Label>
                      <Select
                        value={formData.manager_id?.toString() || ''}
                        onValueChange={(value) => setFormData({ ...formData, manager_id: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите менеджера" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.full_name} ({user.position})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Рекомендация клиенту</Label>
                      <Textarea
                        value={formData.recommendation || ''}
                        onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                        rows={4}
                        placeholder="Введите рекомендации для клиента..."
                      />
                    </div>
                  </div>
                )}

                {activeInfoTab === 'materials-work' && (
                  <div className="space-y-4">
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
                        />
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {products
                            .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .slice(0, 10)
                            .map((product) => (
                              <button
                                key={product.id}
                                onClick={() => addItem(product, 'product')}
                                className="w-full text-left p-2 hover:bg-white rounded text-sm"
                              >
                                <div className="font-medium">{product.name}</div>
                                <div className="text-xs text-slate-500">{product.sale_price} ₽</div>
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
                        />
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {services
                            .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .slice(0, 10)
                            .map((service) => (
                              <button
                                key={service.id}
                                onClick={() => addItem(service, 'service')}
                                className="w-full text-left p-2 hover:bg-white rounded text-sm"
                              >
                                <div className="font-medium">{service.name}</div>
                                <div className="text-xs text-slate-500">{service.price} ₽</div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-white rounded-lg border overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="text-left p-2 text-xs font-semibold">Наименование</th>
                            <th className="text-center p-2 text-xs font-semibold w-20">Кол-во</th>
                            <th className="text-center p-2 text-xs font-semibold w-24">Гарантия</th>
                            <th className="text-right p-2 text-xs font-semibold w-28">Цена, руб</th>
                            <th className="text-right p-2 text-xs font-semibold w-28">Сумма</th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderItems.map((item) => (
                            <tr key={item.id} className="border-b">
                              <td className="p-2 text-sm">{item.item_name}</td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                                  className="w-full text-center text-sm"
                                  step="0.01"
                                />
                              </td>
                              <td className="p-2 text-center text-sm">{item.warranty_months} мес</td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  value={item.price}
                                  onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value))}
                                  className="w-full text-right text-sm"
                                />
                              </td>
                              <td className="p-2 text-right text-sm font-medium">{item.total.toFixed(2)}</td>
                              <td className="p-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(item.id)}
                                >
                                  <Icon name="Trash2" size={14} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg space-y-2 max-w-md ml-auto">
                      <div className="flex justify-between text-sm">
                        <span>Итого товаров и услуг:</span>
                        <span className="font-medium">{subtotal.toFixed(2)} ₽</span>
                      </div>
                      
                      <div className="flex gap-2 items-center">
                        <Label className="text-sm">Скидка:</Label>
                        <Input
                          type="number"
                          placeholder="%"
                          value={formData.discount_percent || ''}
                          onChange={(e) => setFormData({ ...formData, discount_percent: parseFloat(e.target.value) || 0, discount_amount: 0 })}
                          className="w-20 text-sm"
                        />
                        <span className="text-sm">или</span>
                        <Input
                          type="number"
                          placeholder="₽"
                          value={formData.discount_amount || ''}
                          onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0, discount_percent: 0 })}
                          className="w-24 text-sm"
                        />
                      </div>
                      
                      {discount > 0 && (
                        <div className="flex justify-between text-sm text-red-600">
                          <span>Скидка:</span>
                          <span>-{discount.toFixed(2)} ₽</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-base font-bold border-t pt-2">
                        <span>К оплате:</span>
                        <span>{total.toFixed(2)} ₽</span>
                      </div>
                    </div>

                    <div>
                      <Label>Рекомендация клиенту</Label>
                      <Textarea
                        value={formData.recommendation || ''}
                        onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                        rows={3}
                        placeholder="Введите рекомендации..."
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4 max-w-3xl">
                <div className="space-y-3">
                  {Array.isArray(history) && history.map((item) => (
                    <div key={item.id} className="bg-white border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium">{item.action_type}</div>
                        <div className="text-xs text-slate-500">
                          {new Date(item.created_at).toLocaleString('ru-RU')}
                        </div>
                      </div>
                      <div className="text-sm text-slate-600">{item.description}</div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <Label>Добавить комментарий</Label>
                  <Textarea
                    value={historyComment}
                    onChange={(e) => setHistoryComment(e.target.value)}
                    rows={3}
                    placeholder="Введите комментарий..."
                  />
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={addHistoryComment}>
                      <Icon name="Send" size={14} className="mr-1" />
                      Отправить
                    </Button>
                    <Button size="sm" variant="outline">
                      <Icon name="Paperclip" size={14} className="mr-1" />
                      Прикрепить файл
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}