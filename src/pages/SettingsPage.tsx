import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type PrintTemplate = {
  id: number;
  name: string;
  template_type: string;
  content: string;
  is_default: boolean;
};

type BackupSettings = {
  backup_type: 'local' | 'ftp';
  ftp_host?: string;
  ftp_port?: number;
  ftp_user?: string;
  ftp_password?: string;
  ftp_path?: string;
  schedule_cron?: string;
  is_active: boolean;
};

export default function SettingsPage() {
  const [printTemplates, setPrintTemplates] = useState<PrintTemplate[]>([
    {
      id: 1,
      name: 'Стандартная квитанция',
      template_type: 'order',
      content: `<div class="receipt">
  <h2>Квитанция приёма устройства №{{order_number}}</h2>
  <div><strong>Клиент:</strong> {{client_name}}</div>
  <div><strong>Телефон:</strong> {{phone}}</div>
  <div><strong>Устройство:</strong> {{device}}</div>
  <div><strong>Неисправность:</strong> {{malfunction}}</div>
  <div><strong>Ориентировочная стоимость:</strong> {{price}} руб.</div>
  <div><strong>Предоплата:</strong> {{prepayment}} руб.</div>
  <div><strong>Дата приёма:</strong> {{date}}</div>
</div>`,
      is_default: true,
    },
  ]);

  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
    backup_type: 'local',
    is_active: false,
  });

  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PrintTemplate | null>(null);

  const handleSaveTemplate = (formData: Partial<PrintTemplate>) => {
    if (editingTemplate) {
      setPrintTemplates(
        printTemplates.map((t) => (t.id === editingTemplate.id ? { ...t, ...formData } : t))
      );
      toast.success('Шаблон обновлён');
    } else {
      const newTemplate: PrintTemplate = {
        id: printTemplates.length + 1,
        name: formData.name || 'Новый шаблон',
        template_type: formData.template_type || 'order',
        content: formData.content || '',
        is_default: false,
      };
      setPrintTemplates([...printTemplates, newTemplate]);
      toast.success('Шаблон создан');
    }
    setIsTemplateDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm('Удалить этот шаблон?')) {
      setPrintTemplates(printTemplates.filter((t) => t.id !== id));
      toast.success('Шаблон удалён');
    }
  };

  const handleBackupNow = () => {
    toast.success('Резервная копия создана!');
  };

  const handleSaveBackupSettings = () => {
    toast.success('Настройки резервного копирования сохранены');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Настройки</h1>

      <Tabs defaultValue="print-templates" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="print-templates">Печатные формы</TabsTrigger>
          <TabsTrigger value="backup">Резервное копирование</TabsTrigger>
        </TabsList>

        {/* Print Templates Tab */}
        <TabsContent value="print-templates">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Печатные формы</CardTitle>
                <Button
                  onClick={() => {
                    setEditingTemplate(null);
                    setIsTemplateDialogOpen(true);
                  }}
                >
                  <Icon name="Plus" size={16} className="mr-2" />
                  Добавить шаблон
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>По умолчанию</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {printTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{template.template_type}</TableCell>
                      <TableCell>{template.is_default ? 'Да' : 'Нет'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTemplate(template);
                              setIsTemplateDialogOpen(true);
                            }}
                          >
                            <Icon name="Edit" size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                            disabled={template.is_default}
                          >
                            <Icon name="Trash2" size={16} className="text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">
                  <Icon name="Info" size={16} className="inline mr-2" />
                  Доступные переменные
                </h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    <code className="bg-blue-100 px-1 rounded">{'{{order_number}}'}</code> - Номер заказа
                  </p>
                  <p>
                    <code className="bg-blue-100 px-1 rounded">{'{{client_name}}'}</code> - ФИО клиента
                  </p>
                  <p>
                    <code className="bg-blue-100 px-1 rounded">{'{{phone}}'}</code> - Телефон
                  </p>
                  <p>
                    <code className="bg-blue-100 px-1 rounded">{'{{device}}'}</code> - Устройство
                  </p>
                  <p>
                    <code className="bg-blue-100 px-1 rounded">{'{{malfunction}}'}</code> - Неисправность
                  </p>
                  <p>
                    <code className="bg-blue-100 px-1 rounded">{'{{price}}'}</code> - Ориентировочная цена
                  </p>
                  <p>
                    <code className="bg-blue-100 px-1 rounded">{'{{prepayment}}'}</code> - Предоплата
                  </p>
                  <p>
                    <code className="bg-blue-100 px-1 rounded">{'{{date}}'}</code> - Дата
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Tab */}
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Резервное копирование</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <Button onClick={handleBackupNow} variant="default">
                  <Icon name="Download" size={16} className="mr-2" />
                  Создать резервную копию сейчас
                </Button>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label>Тип резервного копирования</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={backupSettings.backup_type === 'local'}
                        onChange={() =>
                          setBackupSettings({ ...backupSettings, backup_type: 'local' })
                        }
                      />
                      <span>Локально</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={backupSettings.backup_type === 'ftp'}
                        onChange={() => setBackupSettings({ ...backupSettings, backup_type: 'ftp' })}
                      />
                      <span>FTP сервер</span>
                    </label>
                  </div>
                </div>

                {backupSettings.backup_type === 'ftp' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ftp_host">Хост</Label>
                        <Input
                          id="ftp_host"
                          value={backupSettings.ftp_host || ''}
                          onChange={(e) =>
                            setBackupSettings({ ...backupSettings, ftp_host: e.target.value })
                          }
                          placeholder="ftp.example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ftp_port">Порт</Label>
                        <Input
                          id="ftp_port"
                          type="number"
                          value={backupSettings.ftp_port || 21}
                          onChange={(e) =>
                            setBackupSettings({
                              ...backupSettings,
                              ftp_port: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="ftp_user">Пользователь</Label>
                        <Input
                          id="ftp_user"
                          value={backupSettings.ftp_user || ''}
                          onChange={(e) =>
                            setBackupSettings({ ...backupSettings, ftp_user: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="ftp_password">Пароль</Label>
                        <Input
                          id="ftp_password"
                          type="password"
                          value={backupSettings.ftp_password || ''}
                          onChange={(e) =>
                            setBackupSettings({ ...backupSettings, ftp_password: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="ftp_path">Путь на сервере</Label>
                        <Input
                          id="ftp_path"
                          value={backupSettings.ftp_path || ''}
                          onChange={(e) =>
                            setBackupSettings({ ...backupSettings, ftp_path: e.target.value })
                          }
                          placeholder="/backups"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="schedule">Расписание (cron)</Label>
                  <Input
                    id="schedule"
                    value={backupSettings.schedule_cron || ''}
                    onChange={(e) =>
                      setBackupSettings({ ...backupSettings, schedule_cron: e.target.value })
                    }
                    placeholder="0 2 * * * (каждый день в 2:00)"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Формат: минута час день месяц день_недели
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="backup_active"
                    checked={backupSettings.is_active}
                    onChange={(e) =>
                      setBackupSettings({ ...backupSettings, is_active: e.target.checked })
                    }
                  />
                  <Label htmlFor="backup_active">Включить автоматическое резервное копирование</Label>
                </div>

                <Button onClick={handleSaveBackupSettings}>Сохранить настройки</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Editor Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Редактирование шаблона' : 'Новый шаблон'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSaveTemplate({
                name: formData.get('name') as string,
                template_type: formData.get('template_type') as string,
                content: formData.get('content') as string,
              });
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="name">Название шаблона</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingTemplate?.name}
                required
                placeholder="Название шаблона"
              />
            </div>
            <div>
              <Label htmlFor="template_type">Тип</Label>
              <Input
                id="template_type"
                name="template_type"
                defaultValue={editingTemplate?.template_type || 'order'}
                placeholder="order, invoice, act"
              />
            </div>
            <div>
              <Label htmlFor="content">HTML содержимое</Label>
              <Textarea
                id="content"
                name="content"
                defaultValue={editingTemplate?.content}
                rows={15}
                className="font-mono text-sm"
                placeholder="<div>...</div>"
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit">Сохранить</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
