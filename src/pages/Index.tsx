import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minQuantity: number;
  price: number;
  supplier: string;
};

type Order = {
  id: string;
  customerName: string;
  items: number;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  date: string;
  itemsList?: {id: string, quantity: number}[];
};

type Supplier = {
  id: string;
  name: string;
  contact: string;
  email: string;
  products: number;
  rating: number;
};

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [selectedItems, setSelectedItems] = useState<{id: string, quantity: number}[]>([]);

  const inventoryData: InventoryItem[] = [
    { id: '1', name: 'Ноутбук Dell XPS 13', sku: 'LAP-001', category: 'Электроника', quantity: 5, minQuantity: 10, price: 89990, supplier: 'TechSupply' },
    { id: '2', name: 'Клавиатура Logitech MX', sku: 'KEY-002', category: 'Аксессуары', quantity: 45, minQuantity: 20, price: 8990, supplier: 'OfficeWorld' },
    { id: '3', name: 'Монитор Samsung 27"', sku: 'MON-003', category: 'Электроника', quantity: 8, minQuantity: 15, price: 24990, supplier: 'TechSupply' },
    { id: '4', name: 'Мышь Wireless', sku: 'MOU-004', category: 'Аксессуары', quantity: 3, minQuantity: 25, price: 1990, supplier: 'OfficeWorld' },
    { id: '5', name: 'USB-C Кабель', sku: 'CAB-005', category: 'Кабели', quantity: 120, minQuantity: 50, price: 590, supplier: 'CablesPro' },
  ];

  const [ordersData, setOrdersData] = useState<Order[]>([
    { id: 'ORD-1001', customerName: 'ООО "Технологии"', items: 3, total: 125970, status: 'processing', date: '2024-01-06', itemsList: [{id: '1', quantity: 1}, {id: '3', quantity: 2}] },
    { id: 'ORD-1002', customerName: 'ИП Иванов', items: 5, total: 45950, status: 'completed', date: '2024-01-05', itemsList: [{id: '2', quantity: 5}] },
    { id: 'ORD-1003', customerName: 'ООО "Офис+"', items: 12, total: 298680, status: 'pending', date: '2024-01-06', itemsList: [{id: '1', quantity: 3}, {id: '3', quantity: 9}] },
    { id: 'ORD-1004', customerName: 'ООО "Старт"', items: 2, total: 51980, status: 'processing', date: '2024-01-04', itemsList: [{id: '3', quantity: 2}] },
  ]);

  const suppliersData: Supplier[] = [
    { id: 'SUP-001', name: 'TechSupply', contact: '+7 495 123-45-67', email: 'sales@techsupply.ru', products: 156, rating: 4.8 },
    { id: 'SUP-002', name: 'OfficeWorld', contact: '+7 812 987-65-43', email: 'info@officeworld.ru', products: 89, rating: 4.5 },
    { id: 'SUP-003', name: 'CablesPro', contact: '+7 495 555-12-34', email: 'orders@cablespro.ru', products: 234, rating: 4.9 },
  ];

  const lowStockItems = inventoryData.filter(item => item.quantity < item.minQuantity);
  const totalInventoryValue = inventoryData.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const pendingOrders = ordersData.filter(order => order.status === 'pending').length;

  const getStatusBadge = (status: Order['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, label: 'Ожидает' },
      processing: { variant: 'default' as const, label: 'В работе' },
      completed: { variant: 'outline' as const, label: 'Выполнен' },
      cancelled: { variant: 'destructive' as const, label: 'Отменён' },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleAddProduct = () => {
    toast.success('Товар добавлен в инвентарь');
    setIsAddDialogOpen(false);
  };

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    setOrdersData(prev => 
      prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    toast.success('Статус заказа обновлён');
  };

  const handleCreateOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (selectedItems.length === 0) {
      toast.error('Добавьте хотя бы один товар');
      return;
    }

    const total = selectedItems.reduce((sum, item) => {
      const product = inventoryData.find(p => p.id === item.id);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    const newOrder: Order = {
      id: `ORD-${1005 + ordersData.length}`,
      customerName: formData.get('customerName') as string,
      items: selectedItems.reduce((sum, item) => sum + item.quantity, 0),
      total,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      itemsList: [...selectedItems],
    };
    setOrdersData(prev => [newOrder, ...prev]);
    toast.success('Заказ успешно создан');
    setIsCreateOrderDialogOpen(false);
    setSelectedItems([]);
  };

  const handleAddItemToOrder = (itemId: string) => {
    const existing = selectedItems.find(i => i.id === itemId);
    if (existing) {
      setSelectedItems(prev => 
        prev.map(i => i.id === itemId ? {...i, quantity: i.quantity + 1} : i)
      );
    } else {
      setSelectedItems(prev => [...prev, {id: itemId, quantity: 1}]);
    }
  };

  const handleRemoveItemFromOrder = (itemId: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== itemId));
  };

  const handleUpdateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItemFromOrder(itemId);
    } else {
      setSelectedItems(prev => 
        prev.map(i => i.id === itemId ? {...i, quantity} : i)
      );
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setSelectedItems([]);
    setIsEditOrderDialogOpen(true);
  };

  const handleUpdateOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingOrder) return;
    
    const formData = new FormData(e.currentTarget);
    
    if (selectedItems.length === 0) {
      toast.error('Добавьте хотя бы один товар');
      return;
    }

    const total = selectedItems.reduce((sum, item) => {
      const product = inventoryData.find(p => p.id === item.id);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    const updatedOrder: Order = {
      ...editingOrder,
      customerName: formData.get('customerName') as string,
      items: selectedItems.reduce((sum, item) => sum + item.quantity, 0),
      total,
      itemsList: [...selectedItems],
    };

    setOrdersData(prev => prev.map(o => o.id === editingOrder.id ? updatedOrder : o));
    toast.success('Заказ успешно обновлён');
    setIsEditOrderDialogOpen(false);
    setEditingOrder(null);
    setSelectedItems([]);
  };

  const handlePrintOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Разрешите всплывающие окна для печати');
      return;
    }

    const itemsDetails = order.itemsList?.map(item => {
      const product = inventoryData.find(p => p.id === item.id);
      return product ? {
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        price: product.price,
        sum: product.price * item.quantity
      } : null;
    }).filter(Boolean) || [];

    const totalSum = order.total;
    const totalQuantity = order.items;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Расходная накладная ${order.id}</title>
        <style>
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            color: #000;
            line-height: 1.2;
            margin: 0;
            padding: 15px;
          }
          .document-header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .document-title {
            font-size: 16pt;
            font-weight: bold;
            margin: 5px 0;
          }
          .document-number {
            font-size: 13pt;
            margin: 5px 0;
          }
          .organization-block {
            margin-bottom: 15px;
            border: 1px solid #000;
            padding: 10px;
          }
          .org-row {
            display: grid;
            grid-template-columns: 150px 1fr;
            margin: 3px 0;
            font-size: 10pt;
          }
          .org-label {
            font-weight: bold;
          }
          .org-value {
            border-bottom: 1px solid #000;
            min-height: 18px;
          }
          .parties-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
          }
          .party-block {
            border: 1px solid #000;
            padding: 8px;
          }
          .party-title {
            font-weight: bold;
            text-align: center;
            margin-bottom: 8px;
            font-size: 11pt;
          }
          .party-row {
            margin: 4px 0;
            font-size: 9pt;
          }
          .party-label {
            font-weight: bold;
            display: inline-block;
            width: 80px;
          }
          .party-value {
            border-bottom: 1px solid #000;
            display: inline-block;
            flex: 1;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 9pt;
          }
          th {
            background: #f0f0f0;
            border: 1px solid #000;
            padding: 6px 4px;
            text-align: center;
            font-weight: bold;
            font-size: 9pt;
          }
          td {
            border: 1px solid #000;
            padding: 6px 4px;
          }
          .text-center {
            text-align: center;
          }
          .text-right {
            text-align: right;
          }
          .text-left {
            text-align: left;
          }
          .goods-table th:nth-child(1) { width: 30px; }
          .goods-table th:nth-child(2) { width: 250px; }
          .goods-table th:nth-child(3) { width: 80px; }
          .goods-table th:nth-child(4) { width: 60px; }
          .goods-table th:nth-child(5) { width: 80px; }
          .goods-table th:nth-child(6) { width: 100px; }
          .total-row {
            font-weight: bold;
            background: #f9f9f9;
          }
          .signatures-section {
            margin-top: 20px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
          }
          .signature-block {
            margin: 15px 0;
          }
          .signature-title {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 10pt;
          }
          .signature-line {
            display: grid;
            grid-template-columns: 120px 1fr 150px;
            gap: 10px;
            align-items: center;
            margin: 8px 0;
            font-size: 9pt;
          }
          .signature-label {
            font-weight: bold;
          }
          .signature-field {
            border-bottom: 1px solid #000;
            height: 20px;
          }
          .stamp-area {
            border: 1px dashed #666;
            height: 80px;
            margin: 10px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            font-size: 9pt;
          }
          .footer-note {
            font-size: 8pt;
            color: #666;
            margin-top: 20px;
            text-align: center;
            border-top: 1px solid #ccc;
            padding-top: 10px;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="document-header">
          <div class="document-title">РАСХОДНАЯ НАКЛАДНАЯ</div>
          <div class="document-number">№ ${order.id} от ${new Date(order.date).toLocaleDateString('ru-RU')}</div>
        </div>

        <div class="organization-block">
          <div class="org-row">
            <div class="org-label">Организация:</div>
            <div class="org-value">ООО "LiveSklad"</div>
          </div>
          <div class="org-row">
            <div class="org-label">ИНН/КПП:</div>
            <div class="org-value">7700000000 / 770001001</div>
          </div>
          <div class="org-row">
            <div class="org-label">Адрес:</div>
            <div class="org-value">г. Москва, ул. Складская, д. 1</div>
          </div>
          <div class="org-row">
            <div class="org-label">Телефон:</div>
            <div class="org-value">+7 (495) 123-45-67</div>
          </div>
        </div>

        <div class="parties-section">
          <div class="party-block">
            <div class="party-title">Поставщик (Грузоотправитель)</div>
            <div class="party-row">
              <span class="party-label">Организация:</span>
              <span class="party-value">ООО "LiveSklad"</span>
            </div>
            <div class="party-row">
              <span class="party-label">Адрес:</span>
              <span class="party-value">г. Москва, ул. Складская, д. 1</span>
            </div>
            <div class="party-row">
              <span class="party-label">ИНН:</span>
              <span class="party-value">7700000000</span>
            </div>
          </div>
          
          <div class="party-block">
            <div class="party-title">Покупатель (Грузополучатель)</div>
            <div class="party-row">
              <span class="party-label">Организация:</span>
              <span class="party-value">${order.customerName}</span>
            </div>
            <div class="party-row">
              <span class="party-label">Адрес:</span>
              <span class="party-value">_______________________</span>
            </div>
            <div class="party-row">
              <span class="party-label">ИНН:</span>
              <span class="party-value">_______________________</span>
            </div>
          </div>
        </div>

        <table class="goods-table">
          <thead>
            <tr>
              <th rowspan="2">№</th>
              <th rowspan="2">Наименование товара</th>
              <th rowspan="2">Артикул</th>
              <th rowspan="2">Ед.<br>изм.</th>
              <th colspan="2">Количество</th>
              <th rowspan="2">Цена,<br>руб.</th>
              <th rowspan="2">Сумма,<br>руб.</th>
            </tr>
            <tr>
              <th>По<br>накладной</th>
              <th>По<br>факту</th>
            </tr>
          </thead>
          <tbody>
            ${itemsDetails.map((item: any, idx: number) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td class="text-left">${item.name}</td>
                <td class="text-center">${item.sku}</td>
                <td class="text-center">шт</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-center"></td>
                <td class="text-right">${item.price.toLocaleString('ru-RU')}</td>
                <td class="text-right">${item.sum.toLocaleString('ru-RU')}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="4" class="text-right">ИТОГО:</td>
              <td class="text-center">${totalQuantity}</td>
              <td class="text-center"></td>
              <td class="text-right">×</td>
              <td class="text-right">${totalSum.toLocaleString('ru-RU')}</td>
            </tr>
            <tr class="total-row">
              <td colspan="7" class="text-right">Всего к оплате:</td>
              <td class="text-right">${totalSum.toLocaleString('ru-RU')}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin: 10px 0; font-size: 10pt;">
          <strong>Всего наименований:</strong> ${itemsDetails.length}, 
          <strong>на сумму:</strong> ${totalSum.toLocaleString('ru-RU')} руб.
        </div>

        <div class="signatures-section">
          <div>
            <div class="signature-block">
              <div class="signature-title">Отпуск разрешил:</div>
              <div class="signature-line">
                <span class="signature-label">Должность:</span>
                <span class="signature-field"></span>
                <span class="signature-field"></span>
              </div>
              <div style="text-align: right; font-size: 8pt; margin-top: -5px;">(подпись, расшифровка)</div>
            </div>

            <div class="signature-block">
              <div class="signature-title">Отпустил:</div>
              <div class="signature-line">
                <span class="signature-label">Кладовщик:</span>
                <span class="signature-field"></span>
                <span class="signature-field"></span>
              </div>
              <div style="text-align: right; font-size: 8pt; margin-top: -5px;">(подпись, расшифровка)</div>
            </div>
          </div>

          <div>
            <div class="signature-block">
              <div class="signature-title">Груз получил:</div>
              <div class="signature-line">
                <span class="signature-label">Должность:</span>
                <span class="signature-field"></span>
                <span class="signature-field"></span>
              </div>
              <div style="text-align: right; font-size: 8pt; margin-top: -5px;">(подпись, расшифровка)</div>
              <div style="margin-top: 10px; font-size: 9pt;">
                Дата получения: "____" ____________ ${new Date().getFullYear()} г.
              </div>
            </div>

            <div class="stamp-area">
              М.П.
            </div>
          </div>
        </div>

        <div class="footer-note">
          Документ сформирован автоматически в системе LiveSklad | ${new Date().toLocaleString('ru-RU')}
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Icon name="Package" className="text-primary-foreground" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">LiveSklad</h1>
              <p className="text-xs text-muted-foreground">Система управления</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'dashboard', icon: 'LayoutDashboard', label: 'Дашборд' },
            { id: 'inventory', icon: 'Package', label: 'Инвентарь' },
            { id: 'orders', icon: 'ShoppingCart', label: 'Заказы' },
            { id: 'suppliers', icon: 'Truck', label: 'Поставщики' },
            { id: 'analytics', icon: 'BarChart3', label: 'Аналитика' },
            { id: 'settings', icon: 'Settings', label: 'Настройки' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <Icon name={item.icon} size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
              А
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-sidebar-foreground">Администратор</p>
              <p className="text-xs text-muted-foreground">admin@livesklad.ru</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Дашборд</h2>
                <p className="text-muted-foreground mt-1">Обзор основных показателей склада</p>
              </div>
              <Button className="gap-2">
                <Icon name="Plus" size={18} />
                Быстрое действие
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover-scale">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Товаров в наличии</CardTitle>
                  <Icon name="Package" className="text-primary" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{inventoryData.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Всего позиций</p>
                </CardContent>
              </Card>

              <Card className="hover-scale">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Низкие остатки</CardTitle>
                  <Icon name="AlertTriangle" className="text-[hsl(var(--warning))]" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[hsl(var(--warning))]">{lowStockItems.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Требуют пополнения</p>
                </CardContent>
              </Card>

              <Card className="hover-scale">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Стоимость склада</CardTitle>
                  <Icon name="DollarSign" className="text-[hsl(var(--success))]" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{(totalInventoryValue / 1000).toFixed(0)}K ₽</div>
                  <p className="text-xs text-muted-foreground mt-1">Общая стоимость</p>
                </CardContent>
              </Card>

              <Card className="hover-scale">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Заказов в ожидании</CardTitle>
                  <Icon name="Clock" className="text-secondary" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{pendingOrders}</div>
                  <p className="text-xs text-muted-foreground mt-1">Требуют обработки</p>
                </CardContent>
              </Card>
            </div>

            {lowStockItems.length > 0 && (
              <Card className="border-[hsl(var(--warning))] bg-[hsl(var(--warning))]/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon name="AlertTriangle" className="text-[hsl(var(--warning))]" size={24} />
                    <CardTitle>Критические уровни товаров</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-card rounded-lg">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-semibold text-[hsl(var(--warning))]">
                            {item.quantity} / {item.minQuantity}
                          </p>
                          <Button size="sm" variant="outline" className="mt-2">
                            Создать заказ
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Последние заказы</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ordersData.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors">
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-sm text-muted-foreground">{order.id}</p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Топ поставщики</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {suppliersData.map((supplier) => (
                      <div key={supplier.id} className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors">
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          <p className="text-sm text-muted-foreground">{supplier.products} товаров</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name="Star" className="text-[hsl(var(--warning))]" size={16} fill="currentColor" />
                          <span className="font-semibold">{supplier.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Инвентарь</h2>
                <p className="text-muted-foreground mt-1">Управление товарами на складе</p>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Icon name="Plus" size={18} />
                    Добавить товар
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Новый товар</DialogTitle>
                    <DialogDescription>Добавьте товар в инвентарь склада</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Название товара</Label>
                      <Input placeholder="Например: Ноутбук Dell XPS 13" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>SKU</Label>
                        <Input placeholder="LAP-001" />
                      </div>
                      <div className="space-y-2">
                        <Label>Категория</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="electronics">Электроника</SelectItem>
                            <SelectItem value="accessories">Аксессуары</SelectItem>
                            <SelectItem value="cables">Кабели</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Количество</Label>
                        <Input type="number" placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <Label>Мин. остаток</Label>
                        <Input type="number" placeholder="0" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Цена (₽)</Label>
                      <Input type="number" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Поставщик</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliersData.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddProduct} className="w-full">Добавить товар</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      placeholder="Поиск по названию или SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Icon name="Filter" size={18} />
                    Фильтры
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Товар</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Категория</TableHead>
                      <TableHead>Остаток</TableHead>
                      <TableHead>Цена</TableHead>
                      <TableHead>Поставщик</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryData.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.quantity < item.minQuantity && (
                              <Icon name="AlertCircle" className="text-[hsl(var(--warning))]" size={16} />
                            )}
                            <span className={`font-mono font-semibold ${item.quantity < item.minQuantity ? 'text-[hsl(var(--warning))]' : ''}`}>
                              {item.quantity}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{item.price.toLocaleString('ru-RU')} ₽</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.supplier}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Icon name="MoreVertical" size={18} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Заказы</h2>
                <p className="text-muted-foreground mt-1">Управление заказами клиентов</p>
              </div>
              <Dialog open={isCreateOrderDialogOpen} onOpenChange={setIsCreateOrderDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Icon name="Plus" size={18} />
                    Создать заказ
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Новый заказ</DialogTitle>
                    <DialogDescription>Создайте заказ для клиента</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateOrder} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Название клиента</Label>
                      <Input id="customerName" name="customerName" placeholder="ООО 'Компания'" required />
                    </div>

                    <div className="space-y-2">
                      <Label>Товары в заказе</Label>
                      {selectedItems.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
                          Товары не добавлены. Выберите из списка ниже.
                        </div>
                      ) : (
                        <div className="space-y-2 border rounded-lg p-3">
                          {selectedItems.map(item => {
                            const product = inventoryData.find(p => p.id === item.id);
                            if (!product) return null;
                            return (
                              <div key={item.id} className="flex items-center justify-between gap-3 p-2 bg-muted/50 rounded">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{product.name}</p>
                                  <p className="text-xs text-muted-foreground">{product.price.toLocaleString('ru-RU')} ₽</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleUpdateItemQuantity(item.id, item.quantity - 1)}
                                  >
                                    <Icon name="Minus" size={14} />
                                  </Button>
                                  <span className="font-mono font-semibold w-8 text-center">{item.quantity}</span>
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                                  >
                                    <Icon name="Plus" size={14} />
                                  </Button>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleRemoveItemFromOrder(item.id)}
                                  >
                                    <Icon name="Trash2" size={14} />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                          <div className="pt-2 border-t mt-2 flex justify-between items-center">
                            <span className="font-medium">Итого:</span>
                            <span className="font-mono font-bold text-lg">
                              {selectedItems.reduce((sum, item) => {
                                const product = inventoryData.find(p => p.id === item.id);
                                return sum + (product ? product.price * item.quantity : 0);
                              }, 0).toLocaleString('ru-RU')} ₽
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Доступные товары</Label>
                      <div className="border rounded-lg max-h-64 overflow-y-auto">
                        {inventoryData.map(item => (
                          <div 
                            key={item.id} 
                            className="flex items-center justify-between p-3 hover:bg-muted/50 border-b last:border-b-0"
                          >
                            <div>
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.price.toLocaleString('ru-RU')} ₽ • В наличии: {item.quantity}
                              </p>
                            </div>
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAddItemToOrder(item.id)}
                              disabled={selectedItems.some(i => i.id === item.id)}
                            >
                              {selectedItems.some(i => i.id === item.id) ? 'Добавлен' : 'Добавить'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={selectedItems.length === 0}>
                      Создать заказ
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isEditOrderDialogOpen} onOpenChange={(open) => {
                setIsEditOrderDialogOpen(open);
                if (!open) {
                  setEditingOrder(null);
                  setSelectedItems([]);
                }
              }}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Редактирование заказа {editingOrder?.id}</DialogTitle>
                    <DialogDescription>Измените данные заказа</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdateOrder} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="editCustomerName">Название клиента</Label>
                      <Input 
                        id="editCustomerName" 
                        name="customerName" 
                        placeholder="ООО 'Компания'" 
                        defaultValue={editingOrder?.customerName}
                        required 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Товары в заказе</Label>
                      {selectedItems.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
                          Товары не добавлены. Выберите из списка ниже.
                        </div>
                      ) : (
                        <div className="space-y-2 border rounded-lg p-3">
                          {selectedItems.map(item => {
                            const product = inventoryData.find(p => p.id === item.id);
                            if (!product) return null;
                            return (
                              <div key={item.id} className="flex items-center justify-between gap-3 p-2 bg-muted/50 rounded">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{product.name}</p>
                                  <p className="text-xs text-muted-foreground">{product.price.toLocaleString('ru-RU')} ₽</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleUpdateItemQuantity(item.id, item.quantity - 1)}
                                  >
                                    <Icon name="Minus" size={14} />
                                  </Button>
                                  <span className="font-mono font-semibold w-8 text-center">{item.quantity}</span>
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                                  >
                                    <Icon name="Plus" size={14} />
                                  </Button>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleRemoveItemFromOrder(item.id)}
                                  >
                                    <Icon name="Trash2" size={14} />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                          <div className="pt-2 border-t mt-2 flex justify-between items-center">
                            <span className="font-medium">Итого:</span>
                            <span className="font-mono font-bold text-lg">
                              {selectedItems.reduce((sum, item) => {
                                const product = inventoryData.find(p => p.id === item.id);
                                return sum + (product ? product.price * item.quantity : 0);
                              }, 0).toLocaleString('ru-RU')} ₽
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Доступные товары</Label>
                      <div className="border rounded-lg max-h-64 overflow-y-auto">
                        {inventoryData.map(item => (
                          <div 
                            key={item.id} 
                            className="flex items-center justify-between p-3 hover:bg-muted/50 border-b last:border-b-0"
                          >
                            <div>
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.price.toLocaleString('ru-RU')} ₽ • В наличии: {item.quantity}
                              </p>
                            </div>
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAddItemToOrder(item.id)}
                              disabled={selectedItems.some(i => i.id === item.id)}
                            >
                              {selectedItems.some(i => i.id === item.id) ? 'Добавлен' : 'Добавить'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={selectedItems.length === 0}>
                      Сохранить изменения
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Select value={orderStatusFilter} onValueChange={(value) => setOrderStatusFilter(value as Order['status'] | 'all')}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Все заказы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все заказы</SelectItem>
                      <SelectItem value="pending">Ожидает</SelectItem>
                      <SelectItem value="processing">В работе</SelectItem>
                      <SelectItem value="completed">Выполнен</SelectItem>
                      <SelectItem value="cancelled">Отменён</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1" />
                  <div className="text-sm text-muted-foreground">
                    Показано: <span className="font-semibold">{ordersData.filter(order => orderStatusFilter === 'all' || order.status === orderStatusFilter).length}</span> из <span className="font-semibold">{ordersData.length}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Номер заказа</TableHead>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Товаров</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersData
                      .filter(order => orderStatusFilter === 'all' || order.status === orderStatusFilter)
                      .map((order) => (
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono font-semibold">{order.id}</TableCell>
                        <TableCell className="font-medium">{order.customerName}</TableCell>
                        <TableCell>{order.items}</TableCell>
                        <TableCell className="font-mono font-semibold">{order.total.toLocaleString('ru-RU')} ₽</TableCell>
                        <TableCell>
                          <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value as Order['status'])}>
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Ожидает</SelectItem>
                              <SelectItem value="processing">В работе</SelectItem>
                              <SelectItem value="completed">Выполнен</SelectItem>
                              <SelectItem value="cancelled">Отменён</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{order.date}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditOrder(order)}
                              title="Редактировать"
                            >
                              <Icon name="Pencil" size={18} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handlePrintOrder(order)}
                              title="Печать"
                            >
                              <Icon name="Printer" size={18} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Поставщики</h2>
                <p className="text-muted-foreground mt-1">База данных поставщиков</p>
              </div>
              <Button className="gap-2">
                <Icon name="Plus" size={18} />
                Добавить поставщика
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliersData.map((supplier) => (
                <Card key={supplier.id} className="hover-scale">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{supplier.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{supplier.products} товаров</p>
                      </div>
                      <div className="flex items-center gap-1 bg-[hsl(var(--warning))]/10 px-2 py-1 rounded">
                        <Icon name="Star" className="text-[hsl(var(--warning))]" size={14} fill="currentColor" />
                        <span className="text-sm font-semibold">{supplier.rating}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="Phone" size={16} className="text-muted-foreground" />
                      <span>{supplier.contact}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="Mail" size={16} className="text-muted-foreground" />
                      <span>{supplier.email}</span>
                    </div>
                    <div className="pt-2">
                      <Button variant="outline" className="w-full" size="sm">
                        Просмотреть детали
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Аналитика</h2>
              <p className="text-muted-foreground mt-1">Статистика и отчеты</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Движение товаров</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                    <div className="text-center">
                      <Icon name="BarChart3" size={48} className="mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">График движения товаров</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Распределение по категориям</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                    <div className="text-center">
                      <Icon name="PieChart" size={48} className="mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Диаграмма категорий</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Топ-5 товаров</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {inventoryData.slice(0, 5).map((item, idx) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                          </div>
                        </div>
                        <p className="font-mono font-semibold">{item.quantity}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Выручка по месяцам</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                    <div className="text-center">
                      <Icon name="TrendingUp" size={48} className="mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">График выручки</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Настройки</h2>
              <p className="text-muted-foreground mt-1">Конфигурация системы</p>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
              <TabsList>
                <TabsTrigger value="general">Общие</TabsTrigger>
                <TabsTrigger value="categories">Категории</TabsTrigger>
                <TabsTrigger value="users">Пользователи</TabsTrigger>
                <TabsTrigger value="notifications">Уведомления</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Основные настройки</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Название компании</Label>
                      <Input defaultValue="ООО 'Моя компания'" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email для уведомлений</Label>
                      <Input type="email" defaultValue="admin@company.ru" />
                    </div>
                    <div className="space-y-2">
                      <Label>Телефон</Label>
                      <Input defaultValue="+7 (495) 123-45-67" />
                    </div>
                    <Button>Сохранить изменения</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="categories" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Категории товаров</CardTitle>
                      <Button size="sm" className="gap-2">
                        <Icon name="Plus" size={16} />
                        Добавить
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {['Электроника', 'Аксессуары', 'Кабели', 'Мебель', 'Канцелярия'].map((cat) => (
                        <div key={cat} className="flex items-center justify-between p-3 hover:bg-muted rounded-lg">
                          <span className="font-medium">{cat}</span>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Icon name="Pencil" size={16} />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Icon name="Trash2" size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Пользователи системы</CardTitle>
                      <Button size="sm" className="gap-2">
                        <Icon name="UserPlus" size={16} />
                        Пригласить
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Пользователь</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Роль</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Администратор</TableCell>
                          <TableCell>admin@livesklad.ru</TableCell>
                          <TableCell><Badge>Админ</Badge></TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Icon name="MoreVertical" size={18} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Настройки уведомлений</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 hover:bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">Критические остатки товаров</p>
                        <p className="text-sm text-muted-foreground">Уведомление при низком уровне товара</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5" />
                    </div>
                    <div className="flex items-center justify-between p-3 hover:bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">Новые заказы</p>
                        <p className="text-sm text-muted-foreground">Уведомление о новых заказах</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5" />
                    </div>
                    <div className="flex items-center justify-between p-3 hover:bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">Автоматическое создание заказов</p>
                        <p className="text-sm text-muted-foreground">Автоматически создавать заказы при критических остатках</p>
                      </div>
                      <input type="checkbox" className="w-5 h-5" />
                    </div>
                    <Button>Сохранить настройки</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;