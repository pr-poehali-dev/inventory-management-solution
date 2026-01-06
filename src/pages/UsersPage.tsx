import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DIRECTORIES_API = 'https://functions.poehali.dev/9ff1eb5a-8845-48c1-b870-ef4ea34f6d76';

interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  position?: string;
  phone?: string;
  is_active: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    role: 'manager',
    position: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${DIRECTORIES_API}?type=users`);
      const data = await response.json();
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        full_name: user.full_name,
        email: user.email || '',
        role: user.role || 'manager',
        position: user.position || '',
        phone: user.phone || '',
        password: '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        full_name: '',
        email: '',
        role: 'manager',
        position: '',
        phone: '',
        password: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const method = editingUser ? 'PUT' : 'POST';
      const url = editingUser
        ? `${DIRECTORIES_API}?type=users&id=${editingUser.id}`
        : `${DIRECTORIES_API}?type=users`;

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      fetchUsers();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await fetch(`${DIRECTORIES_API}?type=users&id=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, is_active: !user.is_active }),
      });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Пользователи</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Icon name="Plus" size={16} className="mr-2" />
          Добавить пользователя
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left p-3 text-sm font-semibold">ФИО</th>
              <th className="text-left p-3 text-sm font-semibold">Логин</th>
              <th className="text-left p-3 text-sm font-semibold">Должность</th>
              <th className="text-left p-3 text-sm font-semibold">Телефон</th>
              <th className="text-left p-3 text-sm font-semibold">Email</th>
              <th className="text-left p-3 text-sm font-semibold">Роль</th>
              <th className="text-left p-3 text-sm font-semibold">Статус</th>
              <th className="text-right p-3 text-sm font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-slate-50">
                <td className="p-3">{user.full_name}</td>
                <td className="p-3 text-slate-600">{user.username}</td>
                <td className="p-3 text-slate-600">{user.position || '—'}</td>
                <td className="p-3 text-slate-600">{user.phone || '—'}</td>
                <td className="p-3 text-slate-600">{user.email || '—'}</td>
                <td className="p-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                    {user.role === 'admin' ? 'Администратор' : user.role === 'manager' ? 'Менеджер' : 'Мастер'}
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {user.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(user)}
                  >
                    <Icon name="Edit" size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(user)}
                  >
                    <Icon name={user.is_active ? 'Ban' : 'Check'} size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Редактировать пользователя' : 'Новый пользователь'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">ФИО *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="username">Логин *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={!!editingUser}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">Должность</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="role">Роль</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="manager">Менеджер</option>
                  <option value="admin">Администратор</option>
                  <option value="master">Мастер</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {!editingUser && (
              <div>
                <Label htmlFor="password">Пароль *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleSave}>Сохранить</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
