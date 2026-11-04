'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminProductForm, { ProductFormData } from '@/components/admin/AdminProductForm';

interface Category {
  _id: string;
  name: string;
}

const emptyForm: ProductFormData = {
  name: '',
  description: '',
  price: '',
  images: [],
  category: '',
  stock: '',
  sku: '',
  featured: false,
  brand: '',
};

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(emptyForm);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
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
      console.error('Error creating product:', error);
      alert('Ürün oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminProductForm
      title="Yeni Ürün Ekle"
      formData={formData}
      setFormData={setFormData}
      categories={categories}
      loading={loading}
      submitLabel="Kaydet"
      loadingLabel="Kaydediliyor..."
      onSubmit={handleSubmit}
    />
  );
}
