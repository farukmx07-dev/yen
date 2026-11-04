'use client';

interface ThreeDSecureShellProps {
  onClose: () => void;
  children: React.ReactNode;
  outerClassName?: string;
}

export default function ThreeDSecureShell({ onClose, children, outerClassName }: ThreeDSecureShellProps) {
  return (
    <div className={`min-h-screen px-2 py-3 sm:px-3 ${outerClassName ?? 'bg-[#ececec]'}`}>
      <div className="mx-auto w-full max-w-[420px] overflow-hidden bg-white shadow-md">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <span className="text-[17px] font-normal text-gray-900">3D Secure</span>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-gray-500 hover:text-gray-800"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
