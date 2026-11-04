'use client';

import { useEffect, useState } from 'react';
import { FiSearch, FiCheckCircle, FiXCircle, FiTruck } from 'react-icons/fi';
import { getProductImageSrc } from '@/lib/imageUtils';
import { PRODUCT_PLACEHOLDER } from '@/lib/publicAssets';
import { adminCard, adminInput } from '@/lib/adminUi';

interface OrderItem {
  product: {
    _id: string;
    name: string;
    image: string;
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  createdAt: string;
}

const statusColors = {
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  processing: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  shipped: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const statusLabels = {
  pending: 'Beklemede',
  processing: 'İşleniyor',
  shipped: 'Kargoda',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal Edildi',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-white">Siparişler</h1>

      <div className={`${adminCard} space-y-4 p-4`}>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Sipariş ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${adminInput} pl-10`}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'border border-[#2a3142] bg-[#0f1117] text-gray-400 hover:text-white'
            }`}
          >
            Tümü
          </button>
          {Object.entries(statusLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                statusFilter === key
                  ? 'bg-blue-600 text-white'
                  : 'border border-[#2a3142] bg-[#0f1117] text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <div key={order._id} className={`${adminCard} p-6`}>
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-white">Sipariş #{order.orderNumber}</h3>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${statusColors[order.status]}`}
                  >
                    {statusLabels[order.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="mt-4 text-left md:mt-0 md:text-right">
                <p className="text-2xl font-bold text-white">
                  ₺{order.totalAmount.toLocaleString('tr-TR')}
                </p>
                <p className="text-sm text-gray-500">{order.paymentMethod}</p>
              </div>
            </div>

            <div className="mb-4 border-t border-[#2a3142] pt-4">
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div>
                  <p className="mb-1 font-medium text-gray-300">Müşteri Bilgileri</p>
                  <p className="text-gray-400">{order.customerName}</p>
                  <p className="text-gray-400">{order.customerEmail}</p>
                  <p className="text-gray-400">{order.customerPhone}</p>
                </div>
                <div>
                  <p className="mb-1 font-medium text-gray-300">Teslimat Adresi</p>
                  <p className="text-gray-400">{order.address}</p>
                </div>
              </div>
            </div>

            <div className="mb-4 border-t border-[#2a3142] pt-4">
              <p className="mb-2 font-medium text-gray-300">Sipariş Detayları</p>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    {item.product?.image && (
                      <img
                        src={getProductImageSrc(item.product.image) || PRODUCT_PLACEHOLDER}
                        alt={item.product.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {item.product?.name || 'Ürün bulunamadı'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Adet: {item.quantity} × ₺{item.price.toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      ₺{(item.quantity * item.price).toLocaleString('tr-TR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-[#2a3142] pt-4">
              {order.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(order._id, 'processing')}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-500"
                  >
                    <FiCheckCircle />
                    İşleme Al
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                    className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition hover:bg-red-500"
                  >
                    <FiXCircle />
                    İptal Et
                  </button>
                </>
              )}
              {order.status === 'processing' && (
                <button
                  onClick={() => handleStatusUpdate(order._id, 'shipped')}
                  className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm text-white transition hover:bg-purple-500"
                >
                  <FiTruck />
                  Kargoya Ver
                </button>
              )}
              {order.status === 'shipped' && (
                <button
                  onClick={() => handleStatusUpdate(order._id, 'delivered')}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white transition hover:bg-emerald-500"
                >
                  <FiCheckCircle />
                  Teslim Edildi Olarak İşaretle
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className={`${adminCard} py-12 text-center text-gray-500`}>Sipariş bulunamadı</div>
        )}
      </div>
    </div>
  );
}
