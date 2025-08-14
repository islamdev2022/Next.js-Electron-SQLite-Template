// types/electron.d.ts
export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  image_path?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ImageUploadData {
  name: string;
  buffer: Buffer;
}

export interface ImageResponse {
  success: boolean;
  path: string;
  filename: string;
}

export interface ImageData {
  data: string; // base64 data URL
  exists: boolean;
}

export interface ElectronAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  send: (channel: string, ...args: any[]) => void;
  on: (channel: string, cb: (...args: any[]) => void) => void;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; id: number }>;
  getProducts: () => Promise<Product[]>;
  deleteProduct: (id: number) => Promise<{ success: boolean; changes: number }>;
  uploadImage: (imageData: ImageUploadData) => Promise<ImageResponse>;
  getImage: (imagePath: string) => Promise<ImageData | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
