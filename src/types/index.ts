export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type WilayaCode = string; // 01–58

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  store_name: string | null;
  phone: string | null;
  yalidine_api_id: string | null;
  yalidine_api_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  wilaya: WilayaCode;
  commune: string;
  address: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  client_id: string;
  reference: string;
  status: OrderStatus;
  total_amount: number;
  delivery_fee: number;
  notes: string | null;
  tracking_number: string | null;
  otp_code: string | null;
  otp_expires_at: string | null;
  otp_verified_at: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  items?: OrderItem[];
}

export interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  delivered_orders: number;
  total_revenue: number;
  orders_today: number;
}
