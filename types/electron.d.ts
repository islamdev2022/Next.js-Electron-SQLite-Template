// types/electron.d.ts
export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

export interface ElectronAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  send: (channel: string, ...args: any[]) => void;
  on: (channel: string, cb: (...args: any[]) => void) => void;
  addProduct: (product: Omit<Product, 'id'>) => Promise<{ success: boolean; id: number }>;
  getProducts: () => Promise<Product[]>;
  deleteProduct: (id: number) => Promise<{ success: boolean; changes: number }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
