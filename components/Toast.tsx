'use client';

import { useEffect } from 'react';
import { FiX, FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, isVisible, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: <FiCheckCircle className="w-5 h-5" />,
    error: <FiAlertCircle className="w-5 h-5" />,
    info: <FiInfo className="w-5 h-5" />,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    info: 'text-blue-600',
  };

  return (
    <div className="fixed top-4 right-4 left-4 xs:left-auto z-50 animate-fadeInUp safe-area-inset-top pointer-events-none">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 shadow-lg w-full xs:w-auto xs:max-w-md ml-auto pointer-events-auto min-w-0 ${colors[type]}`}>
        <div className={iconColors[type]}>{icons[type]}</div>
        <p className="flex-1 font-semibold text-fluid-sm min-w-0 overflow-wrap-anywhere">{message}</p>
        <button
          onClick={onClose}
          className={`${iconColors[type]} hover:opacity-70 transition-opacity`}
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

