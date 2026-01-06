import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';

type OrderFormProps = {
  order: any | null;
  onSave: (data: any) => void;
  onCancel: () => void;
};

export default function OrderForm({ order, onSave, onCancel }: OrderFormProps) {
  const [formData, setFormData] = useState({
    contractor_name: order?.contractor_name || '',
    phone: order?.phone || '',
    address: order?.address || '',
    advertising_source: order?.advertising_source || '',
    serial_number: order?.serial_number || '',
    device_type: order?.device_type || '',
    brand: order?.brand || '',
    model: order?.model || '',
    color: order?.color || '',
    accessories: order?.accessories || [],
    appearance: order?.appearance || '',
    malfunction: order?.malfunction || '',
    security_code: order?.security_code || '',
    device_turns_on: order?.device_turns_on || false,
    failure_reason: order?.failure_reason || '',
    repair_description: order?.repair_description || '',
    return_defective_parts: order?.return_defective_parts || false,
    estimated_price: order?.estimated_price || '',
    prepayment: order?.prepayment || '',
    deadline_date: order?.deadline_date || '',
    deadline_time: order?.deadline_time || '',
    manager: order?.manager || '',
    receiver_comment: order?.receiver_comment || '',
  });

  const [appearancePhotos, setAppearancePhotos] = useState<string[]>([]);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, appearance_photos: appearancePhotos });
  };

  const accessories = [
    'Зарядное устройство',
    'Наушники',
    'Чехол',
    'Коробка',
    'Документы',
    'SIM-лоток',
  ];

  const advertisingSources = ['Рекомендация', 'Яндекс', 'Google', 'Социальные сети', 'Сайт', 'Повторное обращение'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* КЛИЕНТ */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">КЛИЕНТ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contractor_name">Контрагент (ФИО) *</Label>
            <Input
              id="contractor_name"
              value={formData.contractor_name}
              onChange={(e) => handleChange('contractor_name', e.target.value)}
              placeholder="Иванов Иван Иванович"
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Телефон *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+7 (999) 123-45-67"
              required
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="address">Адрес</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="г. Москва, ул. Примерная, д. 1"
            />
          </div>
          <div>
            <Label htmlFor="advertising_source">Рекламный источник</Label>
            <Select value={formData.advertising_source} onValueChange={(v) => handleChange('advertising_source', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите источник" />
              </SelectTrigger>
              <SelectContent>
                {advertisingSources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* УСТРОЙСТВА И НЕИСПРАВНОСТИ */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">УСТРОЙСТВО И НЕИСПРАВНОСТИ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="serial_number">Серийный номер / IMEI</Label>
            <Input
              id="serial_number"
              value={formData.serial_number}
              onChange={(e) => handleChange('serial_number', e.target.value)}
              placeholder="123456789012345"
            />
          </div>
          <div>
            <Label htmlFor="device_type">Тип устройства *</Label>
            <Select value={formData.device_type} onValueChange={(v) => handleChange('device_type', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Смартфон</SelectItem>
                <SelectItem value="tablet">Планшет</SelectItem>
                <SelectItem value="laptop">Ноутбук</SelectItem>
                <SelectItem value="watch">Часы</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="brand">Марка *</Label>
            <Input
              id="brand"
              value={formData.brand}
              onChange={(e) => handleChange('brand', e.target.value)}
              placeholder="Apple, Samsung, Xiaomi..."
              required
            />
          </div>
          <div>
            <Label htmlFor="model">Модель *</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => handleChange('model', e.target.value)}
              placeholder="iPhone 13 Pro"
              required
            />
          </div>
          <div>
            <Label htmlFor="color">Цвет</Label>
            <Input
              id="color"
              value={formData.color}
              onChange={(e) => handleChange('color', e.target.value)}
              placeholder="Чёрный"
            />
          </div>
          <div>
            <Label>Комплектация</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {accessories.map((acc) => (
                <div key={acc} className="flex items-center space-x-2">
                  <Checkbox
                    id={`acc-${acc}`}
                    checked={formData.accessories.includes(acc)}
                    onCheckedChange={(checked) => {
                      const newAccessories = checked
                        ? [...formData.accessories, acc]
                        : formData.accessories.filter((a: string) => a !== acc);
                      handleChange('accessories', newAccessories);
                    }}
                  />
                  <label htmlFor={`acc-${acc}`} className="text-sm">
                    {acc}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="appearance">Внешний вид</Label>
            <Textarea
              id="appearance"
              value={formData.appearance}
              onChange={(e) => handleChange('appearance', e.target.value)}
              placeholder="Описание внешнего вида устройства..."
              rows={3}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="malfunction">Неисправность *</Label>
            <Textarea
              id="malfunction"
              value={formData.malfunction}
              onChange={(e) => handleChange('malfunction', e.target.value)}
              placeholder="Описание неисправности..."
              rows={3}
              required
            />
          </div>
          <div>
            <Label htmlFor="security_code">Защитный код</Label>
            <Input
              id="security_code"
              type="password"
              value={formData.security_code}
              onChange={(e) => handleChange('security_code', e.target.value)}
              placeholder="****"
            />
          </div>
          <div className="flex items-center space-x-2 pt-6">
            <Checkbox
              id="device_turns_on"
              checked={formData.device_turns_on}
              onCheckedChange={(checked) => handleChange('device_turns_on', checked)}
            />
            <label htmlFor="device_turns_on" className="text-sm font-medium">
              Устройство включается
            </label>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="failure_reason">Причина поломки</Label>
            <Input
              id="failure_reason"
              value={formData.failure_reason}
              onChange={(e) => handleChange('failure_reason', e.target.value)}
              placeholder="Упало, попала влага..."
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="repair_description">Что ремонтируем?</Label>
            <Textarea
              id="repair_description"
              value={formData.repair_description}
              onChange={(e) => handleChange('repair_description', e.target.value)}
              placeholder="Замена экрана, батареи..."
              rows={2}
            />
          </div>
          <div className="flex items-center space-x-2 md:col-span-2">
            <Checkbox
              id="return_defective_parts"
              checked={formData.return_defective_parts}
              onCheckedChange={(checked) => handleChange('return_defective_parts', checked)}
            />
            <label htmlFor="return_defective_parts" className="text-sm font-medium">
              Требуется возврат неисправных деталей
            </label>
          </div>
        </div>
      </div>

      {/* ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="estimated_price">Ориентировочная цена (₽)</Label>
            <Input
              id="estimated_price"
              type="number"
              value={formData.estimated_price}
              onChange={(e) => handleChange('estimated_price', e.target.value)}
              placeholder="5000"
            />
          </div>
          <div>
            <Label htmlFor="prepayment">Предоплата (₽)</Label>
            <Input
              id="prepayment"
              type="number"
              value={formData.prepayment}
              onChange={(e) => handleChange('prepayment', e.target.value)}
              placeholder="1000"
            />
          </div>
          <div>
            <Label htmlFor="deadline_date">Крайний срок (дата)</Label>
            <Input
              id="deadline_date"
              type="date"
              value={formData.deadline_date}
              onChange={(e) => handleChange('deadline_date', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="deadline_time">Крайний срок (время)</Label>
            <Input
              id="deadline_time"
              type="time"
              value={formData.deadline_time}
              onChange={(e) => handleChange('deadline_time', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="manager">Менеджер</Label>
            <Input
              id="manager"
              value={formData.manager}
              onChange={(e) => handleChange('manager', e.target.value)}
              placeholder="Текущий пользователь"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="receiver_comment">Комментарий приёмщика</Label>
            <Textarea
              id="receiver_comment"
              value={formData.receiver_comment}
              onChange={(e) => handleChange('receiver_comment', e.target.value)}
              placeholder="Дополнительные заметки..."
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit">
          <Icon name="Save" size={16} className="mr-2" />
          Сохранить
        </Button>
      </div>
    </form>
  );
}
