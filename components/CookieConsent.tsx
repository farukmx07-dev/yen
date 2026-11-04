'use client';

import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    setIsVisible(false);
  };

  const handlePersonalize = () => {
    // Open cookie settings modal (can be implemented later)
    console.log('Open cookie settings');
  };

  if (!isVisible) return null;

  return (
    <div className="modal-overlay bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="modal-content bg-white rounded-xl sm:rounded-2xl shadow-2xl transform animate-fadeInUp border-2 border-gray-100 overflow-hidden w-full max-w-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-a101-teal to-a101-tealLight text-white px-4 sm:px-6 py-3 sm:py-4 md:py-5 rounded-t-xl sm:rounded-t-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
          <h3 className="font-black text-lg sm:text-xl md:text-2xl relative z-10 drop-shadow-lg">A-101 HEP UCUZ</h3>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 bg-gradient-to-b from-white to-gray-50/50">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 mb-4 sm:mb-6">Çerez Kullanımı</h2>
          <p className="text-gray-700 leading-relaxed mb-6 sm:mb-8 text-sm sm:text-base md:text-lg">
            Alışveriş deneyiminizi iyileştirmek ve hizmetlerimizi daha iyi hale getirmek için yasal düzenlemelere uygun çerezler (cookies) kullanıyoruz. Kabul Et'e tıklayarak tüm çerezleri kabul edebilirsiniz. Çerez tercihlerinizi düzenlemek için Ayarlar'a tıklayınız. Detaylı bilgi almak için{' '}
            <a href="#" className="text-a101-teal underline font-black hover:text-a101-darkBlue transition-colors duration-300">
              Çerez Aydınlatma Metnini
            </a>{' '}
            okuyabilirsiniz.
          </p>
        </div>

        {/* Buttons */}
        <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8 flex flex-col sm:flex-row gap-2 sm:gap-3 bg-white">
          <button
            onClick={handleReject}
            className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl font-black text-xs sm:text-sm md:text-base hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            REDDET
          </button>
          <button
            onClick={handlePersonalize}
            className="flex-1 bg-gradient-to-r from-a101-lightBlue to-a101-teal text-white px-4 sm:px-6 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl font-black text-xs sm:text-sm md:text-base hover:from-a101-teal hover:to-a101-lightBlue transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            KİŞİSELLEŞTİR
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 bg-gradient-to-r from-a101-teal to-a101-tealLight text-white px-4 sm:px-6 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl font-black text-xs sm:text-sm md:text-base hover:from-a101-tealLight hover:to-a101-teal transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            KABUL ET
          </button>
        </div>
      </div>
    </div>
  );
}

