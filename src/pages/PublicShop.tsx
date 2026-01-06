import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const API_URL = 'https://functions.poehali.dev/ab255459-3f5e-417e-bc1c-6cfd39b319b0';

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  quantity: number;
  image: string;
  description: string;
};

type CartItem = {
  product: Product;
  quantity: number;
};

const PublicShop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_URL}?action=products`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      toast.error('Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_URL}?action=categories`);
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Ошибка загрузки категорий', error);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesSearch =
      searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        toast.error('Недостаточно товара на складе');
        return;
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    toast.success('Товар добавлен в корзину');
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
    toast.success('Товар удалён из корзины');
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (quantity > product.quantity) {
      toast.error('Недостаточно товара на складе');
      return;
    }

    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const customerName = formData.get('customerName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;

    if (!customerName || !email || !phone) {
      toast.error('Заполните все поля');
      return;
    }

    const orderItems = cart.map((item) => ({
      id: item.product.id,
      quantity: item.quantity,
    }));

    try {
      const response = await fetch(`${API_URL}?action=order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          email,
          phone,
          items: orderItems,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Заказ ${data.orderId} успешно оформлен!`);
        setCart([]);
        setIsCheckoutOpen(false);
        setIsCartOpen(false);
        loadProducts();
      } else {
        toast.error(data.error || 'Ошибка оформления заказа');
      }
    } catch (error) {
      toast.error('Ошибка связи с сервером');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Icon name="ShoppingBag" className="text-primary-foreground" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold">Интернет-магазин</h1>
                <p className="text-xs text-muted-foreground">LiveSklad Store</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="relative gap-2"
              onClick={() => setIsCartOpen(true)}
            >
              <Icon name="ShoppingCart" size={20} />
              Корзина
              {cart.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                  {getTotalItems()}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Каталог товаров</h2>
            <p className="text-muted-foreground">
              Товары в наличии • Актуальные остатки со склада
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Icon
                name="Search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <Input
                placeholder="Поиск товаров..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Все категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <Card className="py-16">
              <CardContent className="text-center">
                <Icon
                  name="Loader2"
                  size={64}
                  className="mx-auto text-muted-foreground mb-4 animate-spin"
                />
                <p className="text-muted-foreground">Загрузка товаров...</p>
              </CardContent>
            </Card>
          ) : filteredProducts.length === 0 ? (
            <Card className="py-16">
              <CardContent className="text-center">
                <Icon
                  name="PackageOpen"
                  size={64}
                  className="mx-auto text-muted-foreground mb-4"
                />
                <h3 className="text-xl font-semibold mb-2">Товары не найдены</h3>
                <p className="text-muted-foreground">
                  Попробуйте изменить параметры поиска
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-4">
                Найдено товаров: <span className="font-semibold">{filteredProducts.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="overflow-hidden hover-scale group"
                  >
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge className="absolute top-3 right-3">
                        {product.quantity} шт
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                        <h3 className="font-semibold text-lg line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">
                            {product.price.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button
                        className="w-full gap-2"
                        onClick={() => addToCart(product)}
                        disabled={product.quantity === 0}
                      >
                        <Icon name="ShoppingCart" size={18} />
                        В корзину
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="ShoppingCart" size={24} />
              Корзина
            </DialogTitle>
            <DialogDescription>
              {cart.length === 0
                ? 'Ваша корзина пуста'
                : `Товаров в корзине: ${getTotalItems()}`}
            </DialogDescription>
          </DialogHeader>

          {cart.length === 0 ? (
            <div className="py-12 text-center">
              <Icon
                name="ShoppingCart"
                size={64}
                className="mx-auto text-muted-foreground mb-4"
              />
              <p className="text-muted-foreground">Добавьте товары в корзину</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-4 p-4 border rounded-lg"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold">{item.product.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.product.price.toLocaleString('ru-RU')} ₽
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateCartQuantity(item.product.id, item.quantity - 1)
                        }
                      >
                        <Icon name="Minus" size={14} />
                      </Button>
                      <span className="font-mono font-semibold w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateCartQuantity(item.product.id, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.product.quantity}
                      >
                        <Icon name="Plus" size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.product.id)}
                        className="ml-auto"
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {(item.product.price * item.quantity).toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-lg">
                  <span className="font-medium">Итого:</span>
                  <span className="font-bold text-2xl">
                    {getTotalPrice().toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCartOpen(false)}
                  className="flex-1"
                >
                  Продолжить покупки
                </Button>
                <Button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="flex-1 gap-2"
                >
                  <Icon name="CreditCard" size={18} />
                  Оформить заказ
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Оформление заказа</DialogTitle>
            <DialogDescription>Заполните контактные данные</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCheckout} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Имя или название компании *</Label>
              <Input
                id="customerName"
                name="customerName"
                placeholder="ООО 'Компания' или Иванов Иван"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@mail.ru"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                required
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg mb-4">
                <span className="font-medium">Сумма заказа:</span>
                <span className="font-bold">
                  {getTotalPrice().toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCheckoutOpen(false)}
              >
                Отмена
              </Button>
              <Button type="submit" className="gap-2">
                <Icon name="Check" size={18} />
                Подтвердить заказ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <footer className="mt-12 border-t bg-muted/30">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© 2024 LiveSklad Store • Интернет-магазин работает через API со складом</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicShop;
