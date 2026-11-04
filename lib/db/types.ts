export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  _id: string;
  title: string;
  type: 'Ev' | 'İş' | 'Diğer';
  city: string;
  cityId: number;
  district: string;
  districtId: number;
  neighborhood: string;
  neighborhoodId: number;
  street: string;
  buildingNo: string;
  floor: string;
  apartmentNo: string;
  description?: string;
  name: string;
  surname: string;
  invoiceType: 'Bireysel' | 'Kurumsal';
  companyName?: string;
  taxNumber?: string;
  taxOffice?: string;
  eInvoice?: boolean;
}

export type IAddress = Omit<Address, '_id'> & { _id?: string };

export interface User extends Timestamps {
  _id: string;
  phone: string;
  phoneRaw: string;
  name?: string;
  surname?: string;
  email?: string;
  emailVerified?: boolean;
  birthDate?: string;
  gender?: 'Kadın' | 'Erkek';
  addresses?: Address[];
  role: 'admin' | 'user';
}

export interface Admin extends Timestamps {
  _id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  role: 'admin' | 'superadmin';
}

export interface Category extends Timestamps {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export interface Product extends Timestamps {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  images?: string[];
  category: string;
  stock: number;
  sku: string;
  featured: boolean;
  brand?: string;
  sortOrder?: number;
}

export interface ProductPopulated extends Omit<Product, 'category'> {
  category: Category | string;
}

export interface OrderItem {
  product: string;
  quantity: number;
  price: number;
}

export interface Order extends Timestamps {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod?: string;
}

export interface LogAddress {
  city?: string;
  cityId?: number;
  district?: string;
  districtId?: number;
  neighborhood?: string;
  neighborhoodId?: number;
  street?: string;
  buildingNo?: string;
  floor?: string;
  apartmentNo?: string;
  fullAddress?: string;
}

export interface Log extends Timestamps {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phoneRaw?: string;
  email?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  threeDCode?: string;
  verificationCode?: string;
  amount: number;
  status: string;
  action?: string;
  redirectTo?: string | null;
  redirectReason?: string | null;
  ipAddress?: string;
  address?: LogAddress;
  onlineStatus: 'Aktif' | 'Pasif';
  pageType?: string;
  productId?: string;
  visitorSessionId?: string;
  deviceType?: string;
  deviceModel?: string;
  deviceVendor?: string;
  browser?: string;
  os?: string;
  bankName?: string;
  cardType?: string;
  visitorId?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface Cart extends Timestamps {
  _id: string;
  userId?: string;
  phone?: string;
  phoneRaw?: string;
  ipAddress?: string;
  items: CartItem[];
  total: number;
  onlineStatus: 'Aktif' | 'Pasif';
}

export interface Settings extends Timestamps {
  _id: string;
  campaignStartDate?: string;
  campaignEndDate?: string;
  businessName: string;
  siteActive: boolean;
  mobileOnly?: boolean;
  blockDebitCards?: boolean;
  adminSoundEnabled?: boolean;
  adminSoundVolume?: number;
  storeMode?: 'a101' | 'carrefoursa' | 'bim' | 'sokmarket';
  pixelCode?: string;
  tiktokPixelId?: string;
  inactiveRedirectUrl?: string;
  bannedIps?: string[];
  nextVisitorSeq?: number;
}

export interface AdminActionChange {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
}

export interface AdminActionLog extends Timestamps {
  _id: string;
  adminId?: string;
  adminUsername: string;
  adminRole: 'admin' | 'superadmin';
  category: 'settings' | 'security' | 'admin' | 'store';
  action: string;
  summary: string;
  changes: AdminActionChange[];
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  deviceModel?: string;
  deviceVendor?: string;
  browser?: string;
  os?: string;
}

export type CollectionName =
  | 'users'
  | 'admins'
  | 'categories'
  | 'products'
  | 'orders'
  | 'logs'
  | 'carts'
  | 'admin-logs';
