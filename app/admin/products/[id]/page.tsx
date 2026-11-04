'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminProductForm, { ProductFormData } from '@/components/admin/AdminProductForm';
import { getProductImages } from '@/lib/productImages';

interface Category {
  _id: string;
  name: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    images: [],
    category: '',
    stock: '',
    sku: '',
    featured: false,
    brand: '',
  });

  useEffect(() => {
    fetchCategories();
    fetchProduct();
  }, [productId]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      if (data.success) {
        const product = data.data;
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: product.price?.toString() || '',
          images: getProductImages(product),
          category: product.category?._id || product.category || '',
          stock: product.stock?.toString() || '',
          sku: product.sku || '',
          featured: product.featured || false,
          brand: product.brand || '',
        });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock, 10),
          image: formData.images[0],
          images: formData.images,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/admin/products');
      } else {
        alert('Hata: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Ürün güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <AdminProductForm
      title="Ürün Düzenle"
      formData={formData}
      setFormData={setFormData}
      categories={categories}
      loading={loading}
      submitLabel="Güncelle"
      loadingLabel="Güncelleniyor..."
      onSubmit={handleSubmit}
    />
  );
}
