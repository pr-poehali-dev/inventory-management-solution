import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useAuth, User, UserRole } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const UserManagement = () => {
  const { users, addUser, updateUser, deleteUser, currentUser } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as UserRole;

    if (!username || !email || !password || !role) {
      toast.error('Заполните все поля');
      return;
    }

    if (users.some(u => u.username === username)) {
      toast.error('Пользователь с таким логином уже существует');
      return;
    }

    addUser({ username, email, password, role });
    toast.success('Пользователь добавлен');
    setIsAddDialogOpen(false);
    e.currentTarget.reset();
  };

  const handleEditUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as UserRole;

    const updates: Partial<Omit<User, 'id'>> = {
      username,
      email,
      role,
    };

    if (password) {
      updates.password = password;
    }

    updateUser(editingUser.id, updates);
    toast.success('Пользователь обновлён');
    setIsEditDialogOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error('Нельзя удалить свой аккаунт');
      return;
    }

    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      deleteUser(userId);
      toast.success('Пользователь удалён');
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const getRoleBadge = (role: UserRole) => {
    if (role === 'admin') {
      return <Badge variant="default">Администратор</Badge>;
    }
    return <Badge variant="secondary">Пользователь</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Управление пользователями</h2>
          <p className="text-muted-foreground mt-1">Добавление, редактирование и удаление пользователей</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Icon name="UserPlus" size={18} />
              Добавить пользователя
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый пользователь</DialogTitle>
              <DialogDescription>Создайте учетную запись для нового пользователя</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="add-username">Логин</Label>
                <Input id="add-username" name="username" placeholder="username" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-email">Email</Label>
                <Input id="add-email" name="email" type="email" placeholder="user@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-password">Пароль</Label>
                <Input id="add-password" name="password" type="password" placeholder="••••••••" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-role">Роль</Label>
                <Select name="role" required>
                  <SelectTrigger id="add-role">
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Администратор</SelectItem>
                    <SelectItem value="user">Пользователь</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Создать пользователя</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список пользователей</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Логин</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                        title="Редактировать"
                      >
                        <Icon name="Pencil" size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.id === currentUser?.id}
                        title="Удалить"
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) setEditingUser(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактирование пользователя</DialogTitle>
            <DialogDescription>Измените данные пользователя</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Логин</Label>
              <Input
                id="edit-username"
                name="username"
                defaultValue={editingUser?.username}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                defaultValue={editingUser?.email}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Новый пароль (оставьте пустым, чтобы не менять)</Label>
              <Input
                id="edit-password"
                name="password"
                type="password"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Роль</Label>
              <Select name="role" defaultValue={editingUser?.role} required>
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Администратор</SelectItem>
                  <SelectItem value="user">Пользователь</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Сохранить изменения</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
