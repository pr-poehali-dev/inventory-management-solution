import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type OrderStatus = {
  id: number;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
};

const API_URL = 'https://functions.poehali.dev/6123a2c4-f406-4686-ab76-a98c948f8bd8';

export default function StatusesSettings() {
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<OrderStatus | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#6B7280',
    icon: 'Circle',
    sort_order: 0,
    is_active: true
  });

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?type=statuses`);
      const data = await response.json();
      setStatuses(data || []);
    } catch (error) {
      console.error('Error loading statuses:', error);
      toast.error('Ошибка загрузки статусов');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      if (editingStatus) {
        await fetch(`${API_URL}?type=statuses&id=${editingStatus.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        toast.success('Статус обновлён');
      } else {
        await fetch(`${API_URL}?type=statuses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        toast.success('Статус добавлен');
      }
      setIsDialogOpen(false);
      setEditingStatus(null);
      loadStatuses();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Ошибка сохранения');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот статус?')) return;
    
    try {
      const response = await fetch(`${API_URL}?type=statuses&id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Ошибка удаления');
        return;
      }
      
      toast.success('Статус удалён');
      loadStatuses();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Ошибка удаления');
    }
  };

  const openEditDialog = (status: OrderStatus) => {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      color: status.color,
      icon: status.icon,
      sort_order: status.sort_order,
      is_active: status.is_active
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingStatus(null);
    setFormData({
      name: '',
      color: '#6B7280',
      icon: 'Circle',
      sort_order: 0,
      is_active: true
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Статусы заказов</h1>
        <Button onClick={openCreateDialog} className="h-8 text-xs">
          <Icon name="Plus" size={14} className="mr-1" />
          Добавить
        </Button>
      </div>

      <Card>
        <CardContent className="py-3">
          {loading ? (
            <div className="text-center py-6 text-sm text-slate-500">Загрузка...</div>
          ) : statuses.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-500">Нет статусов</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="h-9">
                  <TableHead className="text-xs py-2 w-16">Иконка</TableHead>
                  <TableHead className="text-xs py-2">Название</TableHead>
                  <TableHead className="text-xs py-2 w-24">Цвет</TableHead>
                  <TableHead className="text-xs py-2 w-24 text-center">Порядок</TableHead>
                  <TableHead className="text-xs py-2 w-24 text-center">Активен</TableHead>
                  <TableHead className="text-right text-xs py-2 w-24">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statuses.map((status) => (
                  <TableRow key={status.id} className="h-10">
                    <TableCell className="py-1">
                      <div className="flex items-center justify-center">
                        <Icon name={status.icon as any} size={18} style={{ color: status.color }} />
                      </div>
                    </TableCell>
                    <TableCell className="text-xs py-1 font-medium">{status.name}</TableCell>
                    <TableCell className="text-xs py-1">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded" style={{ backgroundColor: status.color }} />
                        <span className="text-xs font-mono">{status.color}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs py-1 text-center">{status.sort_order}</TableCell>
                    <TableCell className="text-xs py-1 text-center">
                      {status.is_active ? '✓' : '—'}
                    </TableCell>
                    <TableCell className="text-right py-1">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(status)} className="h-7 w-7 p-0">
                          <Icon name="Edit" size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(status.id)} className="h-7 w-7 p-0">
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">{editingStatus ? 'Редактирование' : 'Создание'} статуса</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Название *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 h-8 text-xs"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Цвет</Label>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Порядок сортировки</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Иконка (из lucide-react)</Label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="mt-1 h-8 text-xs"
                placeholder="Circle, CheckCircle, XCircle..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4"
              />
              <Label className="text-xs">Активен</Label>
            </div>
            <div className="flex gap-2 justify-end pt-3">
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
