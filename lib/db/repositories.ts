import {
  generateId,
  now,
  peekLogById,
  peekLogBySessionId,
  peekCollection,
  readCollection,
  readSettings,
  updateCollection,
  writeSettings,
  removeDocumentsFromCollection,
  clearCollectionInDb,
  upsertLogDocument,
} from './store';
import { normalizeIp } from '../ipUtils';
import { isDeletableEmptyLog } from '../logQualify';
import { normalizeProductImages } from '../productImages';
import type {
  Address,
  Admin,
  AdminActionLog,
  Cart,
  Category,
  Log,
  Order,
  Product,
  ProductPopulated,
  Settings,
  User,
} from './types';
import { normalizeSettings, mergeSettingsUpdate } from '@/lib/settingsUtils';
import { isLiveForStats } from '@/lib/liveVisitorStats';

function sortByDateDesc<T extends { createdAt?: string; updatedAt?: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt || 0).getTime() -
      new Date(a.updatedAt || a.createdAt || 0).getTime()
  );
}

function sortProductsByOrder(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const ao = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const bo = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function sortByUpdatedDesc<T extends { updatedAt?: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  );
}

export function populateProduct(product: Product, categories: Category[]): ProductPopulated {
  const { image, images } = normalizeProductImages(product);
  const category = categories.find((c) => c._id === product.category);
  return {
    ...product,
    image,
    images,
    category: category || product.category,
  };
}

export function populateProducts(products: Product[], categories?: Category[]): ProductPopulated[] {
  const cats = categories ?? [];
  return products.map((p) => populateProduct(p, cats));
}

export function populateOrder(order: Order, products: Product[]) {
  return {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      product: (products.find((p) => p._id === item.product) || item.product) as Product | string,
    })),
  };
}

export const categoriesDb = {
  async findAll(): Promise<Category[]> {
    return sortByDateDesc(await readCollection<Category>('categories'));
  },

  async findById(id: string): Promise<Category | null> {
    const items = await readCollection<Category>('categories');
    return items.find((c) => c._id === id) ?? null;
  },

  async findBySlug(slug: string): Promise<Category | null> {
    const items = await readCollection<Category>('categories');
    return items.find((c) => c.slug === slug) ?? null;
  },

  async create(data: Omit<Category, '_id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const timestamp = now();
    const category: Category = {
      _id: generateId(),
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await updateCollection<Category>('categories', (items) => [...items, category]);
    return category;
  },

  async updateById(id: string, data: Partial<Category>): Promise<Category | null> {
    let updated: Category | null = null;
    await updateCollection<Category>('categories', (items) =>
      items.map((item) => {
        if (item._id !== id) return item;
        updated = { ...item, ...data, _id: item._id, updatedAt: now() };
        return updated;
      })
    );
    return updated;
  },

  async deleteById(id: string): Promise<Category | null> {
    let removed: Category | null = null;
    await updateCollection<Category>('categories', (items) =>
      items.filter((item) => {
        if (item._id === id) {
          removed = item;
          return false;
        }
        return true;
      })
    );
    return removed;
  },

  async count(): Promise<number> {
    return (await readCollection<Category>('categories')).length;
  },
};

export const productsDb = {
  async findAll(): Promise<Product[]> {
    const items = await readCollection<Product>('products');

    if (items.some((p) => p.sortOrder == null)) {
      const sorted = sortByDateDesc(items);
      const normalized = sorted.map((item, index) => ({
        ...item,
        sortOrder: index,
      }));
      await updateCollection<Product>('products', () => normalized);
      return normalized;
    }

    return sortProductsByOrder(items);
  },

  async findAllPopulated(): Promise<ProductPopulated[]> {
    const [products, categories] = await Promise.all([
      productsDb.findAll(),
      categoriesDb.findAll(),
    ]);
    return populateProducts(products, categories);
  },

  async findById(id: string): Promise<Product | null> {
    const items = await readCollection<Product>('products');
    return items.find((p) => p._id === id) ?? null;
  },

  async findByIdPopulated(id: string): Promise<ProductPopulated | null> {
    const product = await productsDb.findById(id);
    if (!product) return null;
    const categories = await categoriesDb.findAll();
    return populateProduct(product, categories);
  },

  async findBySku(sku: string): Promise<Product | null> {
    const items = await readCollection<Product>('products');
    return items.find((p) => p.sku === sku) ?? null;
  },

  async create(data: Partial<Product> & Pick<Product, 'name' | 'description' | 'price' | 'category' | 'sku'>): Promise<Product> {
    const timestamp = now();
    const { image, images } = normalizeProductImages(data);
    let product: Product | null = null;

    await updateCollection<Product>('products', (items) => {
      const sorted = sortProductsByOrder(items);
      const reindexed = sorted.map((item, index) => ({
        ...item,
        sortOrder: index + 1,
      }));

      product = {
        _id: generateId(),
        stock: 0,
        featured: false,
        sortOrder: 0,
        ...data,
        image,
        images,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      return [product, ...reindexed];
    });

    return product!;
  },

  async reorder(id: string, direction: 'up' | 'down'): Promise<Product[]> {
    let result: Product[] = [];

    await updateCollection<Product>('products', (items) => {
      const sorted = sortProductsByOrder(items);
      const index = sorted.findIndex((p) => p._id === id);
      if (index === -1) {
        result = sorted;
        return items;
      }

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= sorted.length) {
        result = sorted;
        return items;
      }

      const next = [...sorted];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

      const timestamp = now();
      result = next.map((item, order) => ({
        ...item,
        sortOrder: order,
        updatedAt: item._id === id || item._id === sorted[targetIndex]._id ? timestamp : item.updatedAt,
      }));

      return result;
    });

    return result;
  },

  async setOrder(orderedIds: string[]): Promise<Product[]> {
    let result: Product[] = [];

    await updateCollection<Product>('products', (items) => {
      const map = new Map(items.map((p) => [p._id, p]));
      const valid =
        orderedIds.length === items.length && orderedIds.every((id) => map.has(id));

      if (!valid) {
        result = sortProductsByOrder(items);
        return items;
      }

      const timestamp = now();
      result = orderedIds.map((id, order) => ({
        ...map.get(id)!,
        sortOrder: order,
        updatedAt: timestamp,
      }));

      return result;
    });

    return result;
  },

  async updateById(id: string, data: Partial<Product>): Promise<Product | null> {
    let updated: Product | null = null;
    await updateCollection<Product>('products', (items) =>
      items.map((item) => {
        if (item._id !== id) return item;
        const merged = { ...item, ...data, _id: item._id };
        const { image, images } = normalizeProductImages(merged);
        updated = { ...merged, image, images, updatedAt: now() };
        return updated;
      })
    );
    return updated;
  },

  async deleteById(id: string): Promise<Product | null> {
    let removed: Product | null = null;
    await updateCollection<Product>('products', (items) =>
      items.filter((item) => {
        if (item._id === id) {
          removed = item;
          return false;
        }
        return true;
      })
    );
    return removed;
  },

  async count(filter?: (p: Product) => boolean): Promise<number> {
    const items = await readCollection<Product>('products');
    return filter ? items.filter(filter).length : items.length;
  },
};

export const ordersDb = {
  async findAll(): Promise<Order[]> {
    return sortByDateDesc(await readCollection<Order>('orders'));
  },

  async findAllPopulated() {
    const [orders, products] = await Promise.all([ordersDb.findAll(), productsDb.findAll()]);
    return orders.map((o) => populateOrder(o, products));
  },

  async findById(id: string): Promise<Order | null> {
    const items = await readCollection<Order>('orders');
    return items.find((o) => o._id === id) ?? null;
  },

  async findByIdPopulated(id: string) {
    const order = await ordersDb.findById(id);
    if (!order) return null;
    const products = await productsDb.findAll();
    return populateOrder(order, products);
  },

  async create(data: Omit<Order, '_id' | 'orderNumber' | 'createdAt' | 'updatedAt'> & { orderNumber?: string }): Promise<Order> {
    const timestamp = now();
    const order: Order = {
      _id: generateId(),
      ...data,
      orderNumber: data.orderNumber || `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      status: data.status || 'pending',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await updateCollection<Order>('orders', (items) => [...items, order]);
    return order;
  },

  async updateById(id: string, data: Partial<Order>): Promise<Order | null> {
    let updated: Order | null = null;
    await updateCollection<Order>('orders', (items) =>
      items.map((item) => {
        if (item._id !== id) return item;
        updated = { ...item, ...data, _id: item._id, updatedAt: now() };
        return updated;
      })
    );
    return updated;
  },

  async deleteById(id: string): Promise<Order | null> {
    let removed: Order | null = null;
    await updateCollection<Order>('orders', (items) =>
      items.filter((item) => {
        if (item._id === id) {
          removed = item;
          return false;
        }
        return true;
      })
    );
    return removed;
  },

  async count(filter?: (o: Order) => boolean): Promise<number> {
    const items = await readCollection<Order>('orders');
    return filter ? items.filter(filter).length : items.length;
  },

  async totalRevenue(): Promise<number> {
    const items = await readCollection<Order>('orders');
    return items
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  },
};

function phoneMatches(log: Log, cleanPhone: string): boolean {
  if (log.phoneRaw === cleanPhone) return true;
  if (!log.phone) return false;
  const phone = log.phone.replace(/\D/g, '');
  return (
    phone.includes(cleanPhone) ||
    phone.endsWith(cleanPhone) ||
    phone === `0${cleanPhone}` ||
    phone === `90${cleanPhone}`
  );
}

function ipMatches(log: Log, ip: string): boolean {
  if (!log.ipAddress || !ip || ip === 'unknown') return false;
  return normalizeIp(log.ipAddress) === normalizeIp(ip);
}

export const logsDb = {
  async findForLiveStats(): Promise<Log[]> {
    const items = peekCollection<Log>('logs') ?? (await readCollection<Log>('logs'));
    return items.filter(isLiveForStats);
  },

  async find(query: {
    status?: string;
    phone?: string;
    limit?: number;
    skip?: number;
  } = {}): Promise<Log[]> {
    let items = sortByDateDesc(await readCollection<Log>('logs'));

    if (query.status) {
      items = items.filter((l) => l.status === query.status);
    }

    if (query.phone) {
      const cleanPhone = query.phone.replace(/\D/g, '').slice(-10);
      items = items.filter((l) => phoneMatches(l, cleanPhone));
    }

    const skip = query.skip || 0;
    const limit = query.limit ?? 100;
    return items.slice(skip, skip + limit);
  },

  async count(query: { status?: string; phone?: string } = {}): Promise<number> {
    let items = await readCollection<Log>('logs');
    if (query.status) items = items.filter((l) => l.status === query.status);
    if (query.phone) {
      const cleanPhone = query.phone.replace(/\D/g, '').slice(-10);
      items = items.filter((l) => phoneMatches(l, cleanPhone));
    }
    return items.length;
  },

  async findById(id: string): Promise<Log | null> {
    const cached = peekLogById(id);
    if (cached) return cached as Log;

    const items = peekCollection<Log>('logs') ?? (await readCollection<Log>('logs'));
    return items.find((l) => l._id === id) ?? null;
  },

  async findActiveByPhoneOrIp(
    cleanPhone: string | null,
    ipAddress: string,
    options: { visitorSessionId?: string; logId?: string; scope?: 'storefront' | 'admin' } = {}
  ): Promise<Log | null> {
    const scope = options.scope ?? 'storefront';

    const matchesScope = (log: Log) => {
      if (scope === 'admin') return log.pageType === 'admin';
      return log.pageType !== 'admin';
    };

    const items = peekCollection<Log>('logs') ?? (await readCollection<Log>('logs'));

    if (options.logId) {
      const byId = (peekLogById(options.logId) as Log | null) ??
        items.find((l) => l._id === options.logId && matchesScope(l));
      if (byId) return byId;
    }

    const sortedItems = sortByUpdatedDesc(items);
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    const normalizedIp = ipAddress ? normalizeIp(ipAddress) : '';

    if (options.visitorSessionId) {
      const bySession =
        (peekLogBySessionId(options.visitorSessionId) as Log | null) ??
        sortedItems.find(
          (l) => l.visitorSessionId === options.visitorSessionId && matchesScope(l)
        );

      if (bySession) {
        if (bySession.onlineStatus === 'Aktif') return bySession;
        const sessionTs = new Date(bySession.updatedAt || bySession.createdAt).getTime();
        if (sessionTs >= twoHoursAgo) return bySession;
      }

      return null;
    }

    if (normalizedIp && normalizedIp !== 'unknown') {
      const activeByIp = sortedItems.find(
        (l) => l.onlineStatus === 'Aktif' && ipMatches(l, normalizedIp) && matchesScope(l)
      );
      if (activeByIp) return activeByIp;
    }

    if (cleanPhone && cleanPhone.length === 10) {
      const active = sortedItems.find(
        (l) => l.onlineStatus === 'Aktif' && phoneMatches(l, cleanPhone) && matchesScope(l)
      );
      if (active) return active;

      const recent = sortedItems.find(
        (l) =>
          phoneMatches(l, cleanPhone) &&
          new Date(l.updatedAt).getTime() >= twoHoursAgo &&
          matchesScope(l)
      );
      if (recent) return recent;
    }

    if (normalizedIp && normalizedIp !== 'unknown') {
      const active = sortedItems.find(
        (l) => l.onlineStatus === 'Aktif' && ipMatches(l, normalizedIp) && matchesScope(l)
      );
      if (active) return active;

      return (
        sortedItems.find(
          (l) =>
            ipMatches(l, normalizedIp) &&
            new Date(l.updatedAt).getTime() >= twoHoursAgo &&
            matchesScope(l)
        ) ?? null
      );
    }

    return null;
  },

  async findActiveVisitor(phone?: string, ipAddress?: string): Promise<Log | null> {
    const items = sortByUpdatedDesc(await readCollection<Log>('logs'));

    if (phone) {
      const byPhone = items.find(
        (l) => l.onlineStatus === 'Aktif' && l.phone === phone
      );
      if (byPhone) return byPhone;
    }

    if (ipAddress && ipAddress !== 'unknown') {
      return items.find(
        (l) => l.onlineStatus === 'Aktif' && l.ipAddress === ipAddress
      ) ?? null;
    }

    return null;
  },

  async create(data: Omit<Log, '_id' | 'createdAt' | 'updatedAt'>): Promise<Log> {
    const timestamp = now();
    const log: Log = {
      _id: generateId(),
      ...data,
      onlineStatus: data.onlineStatus || 'Aktif',
      amount: data.amount ?? 0,
      status: data.status || 'Bekliyor',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await upsertLogDocument(log);
    return log;
  },

  async touchOnline(id: string): Promise<Log | null> {
    const existing = (peekLogById(id) as Log | null) ?? (await this.findById(id));
    if (!existing) return null;

    const timestamp = now();
    const updated: Log = { ...existing, onlineStatus: 'Aktif', updatedAt: timestamp };
    await upsertLogDocument(updated);
    return updated;
  },

  async updateById(id: string, data: Partial<Log>): Promise<Log | null> {
    const existing = (peekLogById(id) as Log | null) ?? (await this.findById(id));
    if (!existing) return null;

    const updated: Log = { ...existing, ...data, _id: id, updatedAt: now() };
    await upsertLogDocument(updated);
    return updated;
  },

  async deleteAll(): Promise<number> {
    return clearCollectionInDb('logs');
  },

  async deleteEmptyAndCardless(maxDelete = 500): Promise<number> {
    const items = peekCollection<Log>('logs') ?? (await readCollection<Log>('logs'));
    const ids = items
      .filter((log) => isDeletableEmptyLog(log))
      .map((log) => log._id)
      .slice(0, maxDelete);
    return removeDocumentsFromCollection('logs', ids);
  },

  async deleteById(id: string): Promise<boolean> {
    const result = await this.deleteLogEntry(id, { cascade: false });
    return result.deleted;
  },

  async deleteLogEntry(
    id: string,
    options: { cascade?: boolean } = { cascade: true }
  ): Promise<{ deleted: boolean; deletedCount: number }> {
    const items = peekCollection<Log>('logs') ?? (await readCollection<Log>('logs'));
    const target = items.find((item) => item._id === id);
    if (!target) return { deleted: false, deletedCount: 0 };

    const idsToDelete = new Set<string>([id]);

    if (options.cascade) {
      const cleanPhone = target.phone?.replace(/\D/g, '').slice(-10);
      if (cleanPhone && cleanPhone.length >= 10) {
        for (const item of items) {
          if (item.phone?.replace(/\D/g, '').slice(-10) === cleanPhone) {
            idsToDelete.add(item._id);
          }
        }
      } else if (target.ipAddress && target.ipAddress !== 'Unknown' && target.ipAddress !== 'unknown') {
        const cleanIp = target.ipAddress.split(',')[0].trim();
        for (const item of items) {
          if (item.ipAddress?.split(',')[0].trim() === cleanIp) {
            idsToDelete.add(item._id);
          }
        }
      }
    }

    let deletedCount = 0;
    const removed = await removeDocumentsFromCollection('logs', [...idsToDelete]);
    deletedCount = removed;

    return { deleted: removed > 0, deletedCount };
  },

  async findOnlineSince(minutes: number): Promise<Log[]> {
    const since = Date.now() - minutes * 60 * 1000;
    const items = peekCollection<Log>('logs') ?? (await readCollection<Log>('logs'));
    return items.filter((l) => {
      if (l.onlineStatus === 'Pasif') return false;
      const updatedAt = new Date(l.updatedAt || l.createdAt).getTime();
      return updatedAt >= since;
    });
  },
};

export const cartsDb = {
  async findActiveByPhoneOrIp(phoneRaw?: string, ipAddress?: string): Promise<Cart | null> {
    const items = sortByUpdatedDesc(await readCollection<Cart>('carts'));

    if (phoneRaw) {
      const cart = items.find(
        (c) => c.phoneRaw === phoneRaw && c.onlineStatus === 'Aktif'
      );
      if (cart) return cart;
    }

    if (ipAddress && ipAddress !== 'unknown') {
      return (
        items.find(
          (c) => c.ipAddress === ipAddress && c.onlineStatus === 'Aktif'
        ) ?? null
      );
    }

    return null;
  },

  async create(data: Omit<Cart, '_id' | 'createdAt' | 'updatedAt'>): Promise<Cart> {
    const timestamp = now();
    const cart: Cart = {
      _id: generateId(),
      ...data,
      total: data.total ?? 0,
      onlineStatus: data.onlineStatus || 'Aktif',
      items: data.items || [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await updateCollection<Cart>('carts', (items) => [...items, cart]);
    return cart;
  },

  async updateById(id: string, data: Partial<Cart>): Promise<Cart | null> {
    let updated: Cart | null = null;
    await updateCollection<Cart>('carts', (items) =>
      items.map((item) => {
        if (item._id !== id) return item;
        updated = { ...item, ...data, _id: item._id, updatedAt: now() };
        return updated;
      })
    );
    return updated;
  },

  async findActiveWithItemsSince(minutes: number): Promise<Cart[]> {
    const since = Date.now() - minutes * 60 * 1000;
    const items = await readCollection<Cart>('carts');
    return items.filter(
      (c) =>
        c.onlineStatus === 'Aktif' &&
        c.items.length > 0 &&
        new Date(c.updatedAt).getTime() >= since
    );
  },
};

export const usersDb = {
  async findByPhoneRaw(phoneRaw: string): Promise<User | null> {
    const items = await readCollection<User>('users');
    return items.find((u) => u.phoneRaw === phoneRaw) ?? null;
  },

  async upsertByPhoneRaw(
    phoneRaw: string,
    defaults: Partial<User> & { phone: string }
  ): Promise<User> {
    let user: User | null = null;
    const timestamp = now();

    await updateCollection<User>('users', (items) => {
      const index = items.findIndex((u) => u.phoneRaw === phoneRaw);
      if (index >= 0) {
        user = { ...items[index], ...defaults, phoneRaw, updatedAt: timestamp };
        items[index] = user;
        return items;
      }
      user = {
        _id: generateId(),
        role: 'user',
        addresses: [],
        emailVerified: false,
        ...defaults,
        phoneRaw,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      return [...items, user];
    });

    return user!;
  },

  async updateByPhoneRaw(phoneRaw: string, data: Partial<User>): Promise<User | null> {
    let updated: User | null = null;
    await updateCollection<User>('users', (items) =>
      items.map((item) => {
        if (item.phoneRaw !== phoneRaw) return item;
        updated = { ...item, ...data, phoneRaw, updatedAt: now() };
        return updated;
      })
    );
    return updated;
  },

  async deleteByPhoneRaw(phoneRaw: string): Promise<boolean> {
    let deleted = false;
    await updateCollection<User>('users', (items) =>
      items.filter((item) => {
        if (item.phoneRaw === phoneRaw) {
          deleted = true;
          return false;
        }
        return true;
      })
    );
    return deleted;
  },

  async addAddress(phoneRaw: string, address: IAddressInput): Promise<{ user: User; address: Address } | null> {
    const newAddress: Address = {
      _id: generateId(),
      ...address,
      type: address.type || 'Ev',
      invoiceType: address.invoiceType || 'Bireysel',
      eInvoice: address.eInvoice ?? false,
      cityId: address.cityId ?? 0,
      districtId: address.districtId ?? 0,
      neighborhoodId: address.neighborhoodId ?? 0,
      street: address.street || '',
      buildingNo: address.buildingNo || '',
      floor: address.floor || '',
      apartmentNo: address.apartmentNo || '',
    };

    let result: { user: User; address: Address } | null = null;
    await updateCollection<User>('users', (items) =>
      items.map((item) => {
        if (item.phoneRaw !== phoneRaw) return item;
        const addresses = [...(item.addresses || []), newAddress];
        const user = { ...item, addresses, updatedAt: now() };
        result = { user, address: newAddress };
        return user;
      })
    );
    return result;
  },

  async removeAddress(phoneRaw: string, addressId: string): Promise<User | null> {
    let updated: User | null = null;
    await updateCollection<User>('users', (items) =>
      items.map((item) => {
        if (item.phoneRaw !== phoneRaw) return item;
        updated = {
          ...item,
          addresses: (item.addresses || []).filter((a) => a._id !== addressId),
          updatedAt: now(),
        };
        return updated;
      })
    );
    return updated;
  },
};

type IAddressInput = Omit<Address, '_id'>;

export const adminsDb = {
  async findAll(): Promise<Admin[]> {
    const items = await readCollection<Admin>('admins');
    return items.sort((a, b) => a.username.localeCompare(b.username, 'tr'));
  },

  async findById(id: string): Promise<Admin | null> {
    const items = await readCollection<Admin>('admins');
    return items.find((a) => a._id === id) ?? null;
  },

  async findByUsername(username: string): Promise<Admin | null> {
    const items = await readCollection<Admin>('admins');
    return items.find((a) => a.username === username) ?? null;
  },

  async findMaster(): Promise<Admin | null> {
    const items = await readCollection<Admin>('admins');
    return items.find((a) => a.role === 'superadmin') ?? null;
  },

  async create(data: Omit<Admin, '_id' | 'createdAt' | 'updatedAt'>): Promise<Admin> {
    const timestamp = now();
    const admin: Admin = {
      _id: generateId(),
      ...data,
      role: data.role || 'admin',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await updateCollection<Admin>('admins', (items) => [...items, admin]);
    return admin;
  },

  async updateById(id: string, data: Partial<Omit<Admin, '_id' | 'createdAt'>>): Promise<Admin | null> {
    let updated: Admin | null = null;
    await updateCollection<Admin>('admins', (items) =>
      items.map((item) => {
        if (item._id !== id) return item;
        updated = { ...item, ...data, _id: item._id, updatedAt: now() };
        return updated;
      })
    );
    return updated;
  },

  async deleteById(id: string): Promise<boolean> {
    let deleted = false;
    await updateCollection<Admin>('admins', (items) =>
      items.filter((item) => {
        if (item._id === id) {
          deleted = true;
          return false;
        }
        return true;
      })
    );
    return deleted;
  },

  async upsertByUsername(
    username: string,
    data: Omit<Admin, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<Admin> {
    let admin: Admin | null = null;
    const timestamp = now();
    await updateCollection<Admin>('admins', (items) => {
      const index = items.findIndex((a) => a.username === username);
      if (index >= 0) {
        admin = { ...items[index], ...data, username, updatedAt: timestamp };
        items[index] = admin;
        return items;
      }
      admin = {
        _id: generateId(),
        ...data,
        username,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      return [...items, admin];
    });
    return admin!;
  },
};

export const adminActionLogsDb = {
  async find(query: { limit?: number; skip?: number } = {}): Promise<AdminActionLog[]> {
    const items = sortByDateDesc(await readCollection<AdminActionLog>('admin-logs'));
    const skip = query.skip || 0;
    const limit = query.limit ?? 200;
    return items.slice(skip, skip + limit);
  },

  async create(
    data: Omit<AdminActionLog, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<AdminActionLog> {
    const timestamp = now();
    const entry: AdminActionLog = {
      _id: generateId(),
      ...data,
      changes: data.changes || [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await updateCollection<AdminActionLog>('admin-logs', (items) => [...items, entry]);
    return entry;
  },

  async deleteAll(): Promise<number> {
    return clearCollectionInDb('admin-logs');
  },
};

export const settingsDb = {
  async get(): Promise<Settings> {
    return normalizeSettings(await readSettings());
  },

  isIpBanned(settings: Settings, ip: string): boolean {
    const normalized = normalizeIp(ip);
    if (!normalized || normalized === 'unknown') return false;
    return (settings.bannedIps || []).some((banned) => normalizeIp(banned) === normalized);
  },

  async banIp(ip: string): Promise<Settings> {
    const normalized = normalizeIp(ip);
    if (!normalized || normalized === 'unknown') {
      return readSettings();
    }

    const current = await readSettings();
    const bannedIps = [...(current.bannedIps || [])];
    if (!bannedIps.some((banned) => normalizeIp(banned) === normalized)) {
      bannedIps.push(normalized);
    }

    return this.update({ bannedIps });
  },

  async unbanIp(ip: string): Promise<Settings> {
    const normalized = normalizeIp(ip);
    const current = await readSettings();
    const bannedIps = (current.bannedIps || []).filter(
      (banned) => normalizeIp(banned) !== normalized
    );
    return this.update({ bannedIps });
  },

  async update(data: Partial<Settings>): Promise<Settings> {
    const current = normalizeSettings(await readSettings());
    const updated = mergeSettingsUpdate(current, data);
    await writeSettings(updated);
    return updated;
  },
};

export async function getStats() {
  const [totalProducts, totalOrders, totalCategories, totalRevenue, pendingOrders, lowStockProducts] =
    await Promise.all([
      productsDb.count(),
      ordersDb.count(),
      categoriesDb.count(),
      ordersDb.totalRevenue(),
      ordersDb.count((o) => o.status === 'pending'),
      productsDb.count((p) => p.stock < 10),
    ]);

  return {
    totalProducts,
    totalOrders,
    totalCategories,
    totalRevenue,
    pendingOrders,
    lowStockProducts,
  };
}
