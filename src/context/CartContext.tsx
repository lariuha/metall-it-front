import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useEffect,
} from "react";

export type CartItem = {
  id: number;
  name: string;
  quantity: number;
  availableSuppliers?: { name: string; price: number }[];
  selectedSupplierName?: string;
};

export type OrderItem = {
  productId: number;
  productName: string;
  quantity: number;
  supplierName: string;
  supplierPrice: number;
  itemTotal: number;
};

export type Order = {
  id: string; // Уникальный ID заказа
  date: string; // Дата оформления заказа
  items: OrderItem[];
  totalAmount: number;
};

interface CartContextType {
  items: CartItem[];
  orders: Order[]; // Добавляем состояние для заказов
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  selectSupplierForItem: (itemId: number, supplierName?: string) => void;
  placeOrder: () => void; // Добавляем функцию для оформления заказа
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Добавляем интерфейс для пропсов CartProvider
interface CartProviderProps {
  children: ReactNode;
  onCheckoutSuccess: () => void; // Добавляем пропс для функции навигации
}

export const CartProvider = ({ children, onCheckoutSuccess }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem("cartItems");
    let loadedItems: CartItem[] = savedCart ? JSON.parse(savedCart) : [];

    loadedItems = loadedItems.map(item => {
      if (item.availableSuppliers && item.availableSuppliers.length > 0) {
        // Находим поставщика с наименьшей ценой
        const cheapestSupplier = item.availableSuppliers.reduce((minSupplier, currentSupplier) => {
          return (currentSupplier.price < minSupplier.price) ? currentSupplier : minSupplier;
        }, item.availableSuppliers[0]);

        // Если текущий selectedSupplierName отсутствует или не является самым дешевым,
        // или если он равен 'undefined' (после загрузки из localStorage, если не было выбрано)
        // то устанавливаем его на самого дешевого поставщика
        if (!item.selectedSupplierName || item.selectedSupplierName !== cheapestSupplier.name) {
          return { ...item, selectedSupplierName: cheapestSupplier.name };
        }
      }
      return item;
    });

    return loadedItems;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    // Загружаем заказы из localStorage при инициализации
    const savedOrders = localStorage.getItem("orders");
    return savedOrders ? JSON.parse(savedOrders) : [];
  });

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    // Сохраняем заказы в localStorage при их изменении
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  const addToCart = (product: CartItem) => {
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.id === product.id
        // При добавлении нового товара, мы его добавляем отдельно, даже если ID совпадает,
        // если нет выбранного поставщика.
        // Если же поставщик уже выбран (например, при повторном добавлении той же позиции),
        // то проверяем по ID и выбранному поставщику.
        && item.selectedSupplierName === product.selectedSupplierName
      );

      if (existingItemIndex > -1) {
        // Если товар найден, обновляем его количество
        const newItems = [...prevItems];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + product.quantity,
        };
        return newItems;
      }

      let itemToAdd = { ...product };
      if (itemToAdd.availableSuppliers && itemToAdd.availableSuppliers.length > 0) {
        // Если поставщик не выбран, выбираем самого дешевого
        if (!itemToAdd.selectedSupplierName) {
            const cheapestSupplier = itemToAdd.availableSuppliers.reduce((minSupplier, currentSupplier) => {
                return (currentSupplier.price < minSupplier.price) ? currentSupplier : minSupplier;
            }, itemToAdd.availableSuppliers[0]);
            itemToAdd.selectedSupplierName = cheapestSupplier.name;
        }
      }
      
      return [...prevItems, itemToAdd];
    });
  };

  const removeFromCart = (productId: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setItems((prevItems) => {
      const updatedItems = prevItems
        .map((item) => (item.id === productId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0); // Удаляем товар, если количество <= 0
      return updatedItems;
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const selectSupplierForItem = (itemId: number, supplierName?: string) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, selectedSupplierName: supplierName } : item
      )
    );
  };

  const placeOrder = () => {
    if (items.length === 0) {
      alert("Корзина пуста. Невозможно оформить заказ.");
      return;
    }

    const newOrderItems: OrderItem[] = [];
    let orderTotal = 0;

    // Проверяем, что для всех товаров выбран поставщик перед оформлением заказа
    const allItemsHaveSuppliers = items.every(item => item.selectedSupplierName);
    if (!allItemsHaveSuppliers) {
      alert("Пожалуйста, выберите поставщика для всех товаров в корзине.");
      return;
    }

    items.forEach((item) => {
      const selectedSupplier = item.availableSuppliers?.find(
        (s) => s.name === item.selectedSupplierName
      );

      if (selectedSupplier) {
        const itemTotal = selectedSupplier.price * item.quantity;
        newOrderItems.push({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          supplierName: selectedSupplier.name,
          supplierPrice: selectedSupplier.price,
          itemTotal: itemTotal,
        });
        orderTotal += itemTotal;
      }
    });

    if (newOrderItems.length === 0) {
        alert("Не удалось оформить заказ. Проверьте выбранных поставщиков.");
        return;
    }

    const newOrder: Order = {
      id: `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Простой уникальный ID
      date: new Date().toLocaleString(),
      items: newOrderItems,
      totalAmount: parseFloat(orderTotal.toFixed(2)),
    };

    setOrders((prevOrders) => [...prevOrders, newOrder]);
    clearCart(); // Очищаем корзину после оформления заказа
    // alert("Заказ успешно оформлен!");
    onCheckoutSuccess(); // <-- Вызываем переданную функцию для навигации
  };

  return (
    <CartContext.Provider
      value={{
        items,
        orders,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        selectSupplierForItem,
        placeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};