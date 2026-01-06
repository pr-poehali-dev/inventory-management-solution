import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type DirectoryType = 'contractors' | 'products' | 'services' | 'devices' | 'accessories' | 'malfunctions' | 'units' | 'money';

type DirectoryItem = {
  id: number;
  name: string;
  [key: string]: string | number | boolean;
};

const directoryConfig: Record<string, { title: string; fields: { name: string; label: string; type: string }[] }> = {
  'directories-contractors': {
    title: 'Контрагенты',
    fields: [
      { name: 'surname', label: 'Фамилия', type: 'text' },
      { name: 'name', label: 'Имя', type: 'text' },
      { name: 'patronymic', label: 'Отчество', type: 'text' },
      { name: 'phone', label: 'Телефон', type: 'tel' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'address', label: 'Адрес', type: 'textarea' },
    ],
  },
  'directories-products': {
    title: 'Товары',
    fields: [
      { name: 'name', label: 'Наименование', type: 'text' },
      { name: 'article', label: 'Артикул', type: 'text' },
      { name: 'barcode', label: 'Штрих-код', type: 'text' },
      { name: 'category', label: 'Категория', type: 'text' },
      { name: 'retail_price', label: 'Цена розничная', type: 'number' },
      { name: 'wholesale_price', label: 'Цена оптовая', type: 'number' },
      { name: 'discount_price', label: 'Цена скидочная', type: 'number' },
      { name: 'purchase_price', label: 'Цена закупочная', type: 'number' },
      { name: 'warranty_months', label: 'Гарантия (месяцы)', type: 'number' },
      { name: 'description', label: 'Описание', type: 'textarea' },
    ],
  },
  'directories-services': {
    title: 'Работы',
    fields: [
      { name: 'name', label: 'Наименование', type: 'text' },
      { name: 'article', label: 'Артикул', type: 'text' },
      { name: 'price', label: 'Цена', type: 'number' },
      { name: 'warranty_months', label: 'Гарантия (месяцы)', type: 'number' },
      { name: 'description', label: 'Описание', type: 'textarea' },
    ],
  },
  'directories-devices': {
    title: 'Типы устройств',
    fields: [{ name: 'name', label: 'Наименование', type: 'text' }],
  },
  'directories-accessories': {
    title: 'Комплектации',
    fields: [{ name: 'name', label: 'Наименование', type: 'text' }],
  },
  'directories-malfunctions': {
    title: 'Неисправности',
    fields: [
      { name: 'name', label: 'Наименование', type: 'text' },
      { name: 'description', label: 'Описание', type: 'textarea' },
    ],
  },
  'directories-units': {
    title: 'Единицы измерения',
    fields: [
      { name: 'name', label: 'Наименование', type: 'text' },
      { name: 'short_name', label: 'Краткое обозначение', type: 'text' },
    ],
  },
  'directories-money': {
    title: 'Денежные статьи',
    fields: [
      { name: 'name', label: 'Наименование', type: 'text' },
      { name: 'category', label: 'Категория (income/expense)', type: 'text' },
    ],
  },
};

type DirectoriesPageProps = {
  activeDirectory: string;
};

export default function DirectoriesPage({ activeDirectory }: DirectoriesPageProps) {
  const [items, setItems] = useState<DirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DirectoryItem | null>(null);

  const config = directoryConfig[activeDirectory];

  useEffect(() => {
    loadData();
  }, [activeDirectory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const typeMap: Record<string, string> = {
        'directories-contractors': 'contractors',
        'directories-products': 'products',
        'directories-services': 'services',
        'directories-devices': 'devices',
        'directories-accessories': 'accessories',
        'directories-malfunctions': 'malfunctions',
        'directories-units': 'units',
        'directories-money': 'money',
      };
      const type = typeMap[activeDirectory];
      if (type) {
        const response = await fetch(`https://functions.poehali.dev/9ff1eb5a-8845-48c1-b870-ef4ea34f6d76?type=${type}`);
        const data = await response.json();
        setItems(data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Ошибка загрузки данных');
    }
    setLoading(false);
  };

  const handleSave = async (formData: Record<string, any>) => {
    try {
      const typeMap: Record<string, string> = {
        'directories-contractors': 'contractors',
        'directories-products': 'products',
        'directories-services': 'services',
        'directories-devices': 'devices',
        'directories-accessories': 'accessories',
        'directories-malfunctions': 'malfunctions',
        'directories-units': 'units',
        'directories-money': 'money',
      };
      const type = typeMap[activeDirectory];
      
      // Добавляем is_active для новых записей
      const dataToSend = editingItem ? formData : { ...formData, is_active: true };
      
      if (editingItem) {
        await fetch(`https://functions.poehali.dev/9ff1eb5a-8845-48c1-b870-ef4ea34f6d76?type=${type}&id=${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        });
        toast.success('Запись обновлена');
      } else {
        await fetch(`https://functions.poehali.dev/9ff1eb5a-8845-48c1-b870-ef4ea34f6d76?type=${type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        });
        toast.success('Запись добавлена');
      }
      setIsDialogOpen(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Ошибка сохранения');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Удалить эту запись?')) {
      try {
        const typeMap: Record<string, string> = {
          'directories-contractors': 'contractors',
          'directories-products': 'products',
          'directories-services': 'services',
          'directories-devices': 'devices',
          'directories-accessories': 'accessories',
          'directories-malfunctions': 'malfunctions',
          'directories-units': 'units',
          'directories-money': 'money',
        };
        const type = typeMap[activeDirectory];
        
        await fetch(`https://functions.poehali.dev/9ff1eb5a-8845-48c1-b870-ef4ea34f6d76?type=${type}&id=${id}`, {
          method: 'DELETE',
        });
        toast.success('Запись удалена');
        loadData();
      } catch (error) {
        console.error('Error deleting:', error);
        toast.error('Ошибка удаления');
      }
    }
  };

  const openEditDialog = (item: DirectoryItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  if (!config) {
    return <div>Справочник не найден</div>;
  }

  const filteredItems = items.filter((item) =>
    Object.values(item).some((value) => String(value).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">{config.title}</h1>
        <Button onClick={openCreateDialog}>
          <Icon name="Plus" size={16} className="mr-2" />
          Добавить
        </Button>
      </div>

      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-3">
          {loading ? (
            <div className="text-center py-6 text-sm text-slate-500">Загрузка...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-500">
              {searchQuery ? 'Ничего не найдено' : 'Нет записей'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="h-9">
                  <TableHead className="text-xs py-2">ID</TableHead>
                  {config.fields.slice(0, 3).map((field) => (
                    <TableHead key={field.name} className="text-xs py-2">{field.label}</TableHead>
                  ))}
                  <TableHead className="text-right text-xs py-2">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="h-10">
                    <TableCell className="font-medium text-xs py-1">{item.id}</TableCell>
                    {config.fields.slice(0, 3).map((field) => (
                      <TableCell key={field.name} className="text-xs py-1">{String(item[field.name] || '-')}</TableCell>
                    ))}
                    <TableCell className="text-right py-1">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)} className="h-7 w-7 p-0">
                          <Icon name="Edit" size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="h-7 w-7 p-0">
                          <Icon name="Trash2" size={14} className="text-red-600" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{editingItem ? 'Редактирование' : 'Создание'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data: Record<string, any> = {};
              formData.forEach((value, key) => {
                const stringValue = value.toString().trim();
                // Если поле пустое, не добавляем его (используется DEFAULT из БД)
                if (stringValue === '') {
                  return;
                }
                // Находим конфигурацию поля для определения типа
                const fieldConfig = config.fields.find(f => f.name === key);
                if (fieldConfig?.type === 'number') {
                  data[key] = parseFloat(stringValue) || null;
                } else {
                  data[key] = stringValue;
                }
              });
              handleSave(data);
            }}
            className="space-y-3"
          >
            {config.fields.map((field) => (
              <div key={field.name}>
                <Label htmlFor={field.name} className="text-xs">{field.label}</Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    id={field.name}
                    name={field.name}
                    defaultValue={editingItem ? String(editingItem[field.name] || '') : ''}
                    className="mt-1 text-xs min-h-[60px]"
                    rows={2}
                  />
                ) : (
                  <Input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    defaultValue={editingItem ? String(editingItem[field.name] || '') : ''}
                    className="mt-1 h-8 text-xs"
                  />
                )}
              </div>
            ))}
            <div className="flex gap-2 justify-end pt-3">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-8 text-xs">
                Отмена
              </Button>
              <Button type="submit" className="h-8 text-xs">Сохранить</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}