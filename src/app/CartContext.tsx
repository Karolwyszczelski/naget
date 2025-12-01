"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

export type SeriesId = "stand-up" | "slab-fence" | "addons";

export type CartItemConfig = Record<string, any>;

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  series: SeriesId | string;
  unitPrice: number;
  quantity: number;
  config: CartItemConfig;
  createdAt: string;
};

export type AddItemInput = {
  productId: string;
  name: string;
  series: SeriesId | string;
  unitPrice: number;
  quantity?: number;
  config?: CartItemConfig;
};

type CartContextValue = {
  items: CartItem[];
  totalAmount: number;
  totalQuantity: number;

  addItem: (input: AddItemInput) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "naget-cart-v1";

const CartContext = createContext<CartContextValue | null>(null);

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // 1) Wczytanie koszyka z localStorage przy pierwszym montowaniu providera
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      const loaded: CartItem[] = parsed
        .map((item: any): CartItem | null => {
          if (!item || typeof item !== "object") return null;
          if (!item.productId || !item.name) return null;

          const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
          const unitPrice = Number(item.unitPrice) || 0;

          return {
            id: typeof item.id === "string" ? item.id : generateId(),
            productId: String(item.productId),
            name: String(item.name),
            series: (item.series as any) ?? "stand-up",
            unitPrice,
            quantity,
            config: (item.config as CartItemConfig) ?? {},
            createdAt:
              typeof item.createdAt === "string"
                ? item.createdAt
                : new Date().toISOString(),
          };
        })
        .filter((x): x is CartItem => !!x);

      if (loaded.length) {
        setItems(loaded);
      }
    } catch (error) {
      console.error("Nie udało się odczytać koszyka z localStorage", error);
    }
  }, []);

  // 2) Zapis koszyka do localStorage przy każdej zmianie
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Nie udało się zapisać koszyka do localStorage", error);
    }
  }, [items]);

  // 3) Akcje na koszyku

  const addItem = (input: AddItemInput) => {
    setItems((prev) => {
      const quantity = input.quantity && input.quantity > 0 ? input.quantity : 1;

      const newItem: CartItem = {
        id: generateId(),
        productId: input.productId,
        name: input.name,
        series: input.series,
        unitPrice: input.unitPrice,
        quantity,
        config: input.config ?? {},
        createdAt: new Date().toISOString(),
      };

      // Możesz tu dodać logikę łączenia pozycji po productId+config,
      // na razie każda konfiguracja to osobna pozycja:
      return [...prev, newItem];
    });
  };

  const updateItemQuantity = (id: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(1, Number(quantity) || 1) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const { totalAmount, totalQuantity } = useMemo(() => {
    let amount = 0;
    let qty = 0;

    for (const item of items) {
      const q = Math.max(1, item.quantity || 1);
      qty += q;
      amount += item.unitPrice * q;
    }

    return { totalAmount: amount, totalQuantity: qty };
  }, [items]);

  const value: CartContextValue = useMemo(
    () => ({
      items,
      totalAmount,
      totalQuantity,
      addItem,
      updateItemQuantity,
      removeItem,
      clearCart,
    }),
    [items, totalAmount, totalQuantity]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
