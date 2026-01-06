import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type PrintTemplate = {
  id: number;
  name: string;
  template_type: string;
  content: string;
  is_default: boolean;
};

const API_URL = 'https://functions.poehali.dev/6123a2c4-f406-4686-ab76-a98c948f8bd8';

const DEFAULT_TEMPLATE = `<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px;">
  <h1 style="text-align: center; margin-bottom: 30px;">Заказ-наряд №{{order_number}}</h1>
  
  <div style="margin-bottom: 20px;">
    <strong>Дата создания:</strong> {{created_at}}<br>
    <strong>Клиент:</strong> {{contractor_name}}<br>
    <strong>Телефон:</strong> {{phone}}<br>
    <strong>Адрес:</strong> {{address}}
  </div>
  
  <div style="margin-bottom: 20px;">
    <h3>Устройство</h3>
    <strong>Тип:</strong> {{device_type}}<br>
    <strong>Марка:</strong> {{brand}}<br>
    <strong>Модель:</strong> {{model}}<br>
    <strong>Серийный номер:</strong> {{serial_number}}<br>
    <strong>Цвет:</strong> {{color}}
  </div>
  
  <div style="margin-bottom: 20px;">
    <h3>Неисправность</h3>
    <p>{{malfunction}}</p>
  </div>
  
  <div style="margin-bottom: 20px;">
    <h3>Работы и материалы</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 2px solid #000;">
          <th style="text-align: left; padding: 8px;">Наименование</th>
          <th style="text-align: center; padding: 8px;">Кол-во</th>
          <th style="text-align: right; padding: 8px;">Цена</th>
          <th style="text-align: right; padding: 8px;">Сумма</th>
        </tr>
      </thead>
      <tbody>
        {{#items}}
        <tr style="border-bottom: 1px solid #ccc;">
          <td style="padding: 8px;">{{item_name}}</td>
          <td style="text-align: center; padding: 8px;">{{quantity}}</td>
          <td style="text-align: right; padding: 8px;">{{price}} ₽</td>
          <td style="text-align: right; padding: 8px;">{{total}} ₽</td>
        </tr>
        {{/items}}
      </tbody>
    </table>
  </div>
  
  <div style="margin-top: 30px; text-align: right; font-size: 18px;">
    <strong>Итого к оплате: {{total}} ₽</strong>
  </div>
  
  <div style="margin-top: 40px; display: flex; justify-content: space-between;">
    <div>Мастер: _________________</div>
    <div>Клиент: _________________</div>
  </div>
</div>`;

export default function PrintTemplatesSettings() {
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PrintTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    template_type: 'order',
    content: DEFAULT_TEMPLATE,
    is_default: false
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?type=print-templates`);
      const data = await response.json();
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Ошибка загрузки шаблонов');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      if (editingTemplate) {
        await fetch(`${API_URL}?type=print-templates&id=${editingTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        toast.success('Шаблон обновлён');
      } else {
        await fetch(`${API_URL}?type=print-templates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        toast.success('Шаблон добавлен');
      }
      setIsDialogOpen(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Ошибка сохранения');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот шаблон?')) return;
    
    try {
      const response = await fetch(`${API_URL}?type=print-templates&id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Ошибка удаления');
        return;
      }
      
      toast.success('Шаблон удалён');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Ошибка удаления');
    }
  };

  const openEditDialog = (template: PrintTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      template_type: template.template_type,
      content: template.content,
      is_default: template.is_default
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      template_type: 'order',
      content: DEFAULT_TEMPLATE,
      is_default: false
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Печатные формы</h1>
        <Button onClick={openCreateDialog} className="h-8 text-xs">
          <Icon name="Plus" size={14} className="mr-1" />
          Добавить
        </Button>
      </div>

      <Card>
        <CardContent className="py-3">
          {loading ? (
            <div className="text-center py-6 text-sm text-slate-500">Загрузка...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-500">Нет шаблонов</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="h-9">
                  <TableHead className="text-xs py-2">Название</TableHead>
                  <TableHead className="text-xs py-2 w-32">Тип</TableHead>
                  <TableHead className="text-xs py-2 w-24 text-center">По умолчанию</TableHead>
                  <TableHead className="text-right text-xs py-2 w-24">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id} className="h-10">
                    <TableCell className="text-xs py-1 font-medium">{template.name}</TableCell>
                    <TableCell className="text-xs py-1">{template.template_type}</TableCell>
                    <TableCell className="text-xs py-1 text-center">
                      {template.is_default ? '✓' : '—'}
                    </TableCell>
                    <TableCell className="text-right py-1">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(template)} className="h-7 w-7 p-0">
                          <Icon name="Edit" size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)} className="h-7 w-7 p-0">
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{editingTemplate ? 'Редактирование' : 'Создание'} шаблона</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Название *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 h-8 text-xs"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Тип шаблона</Label>
                <Input
                  value={formData.template_type}
                  onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="h-4 w-4"
              />
              <Label className="text-xs">Использовать по умолчанию</Label>
            </div>
            
            <div>
              <Label className="text-xs mb-2 block">HTML-шаблон</Label>
              <div className="text-xs text-slate-500 mb-2 p-2 bg-slate-50 rounded">
                <strong>Доступные переменные:</strong> {`{{order_number}}`}, {`{{contractor_name}}`}, {`{{phone}}`}, {`{{device_type}}`}, {`{{brand}}`}, {`{{model}}`}, {`{{malfunction}}`}, {`{{total}}`} и др.<br/>
                <strong>Цикл для товаров:</strong> {`{{#items}}...{{/items}}`}
              </div>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="text-xs font-mono min-h-[400px]"
                placeholder="Введите HTML-код шаблона..."
              />
            </div>
            
            <div className="flex gap-2 justify-end pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-8 text-xs">
                Отмена
              </Button>
              <Button onClick={handleSave} className="h-8 text-xs">Сохранить</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
