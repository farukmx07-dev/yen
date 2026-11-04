import CheckoutPageBoundary from '@/components/checkout/CheckoutPageBoundary';
import CheckoutRedirectWatcher from '@/components/checkout/CheckoutRedirectWatcher';

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <CheckoutPageBoundary>
      <CheckoutRedirectWatcher />
      {children}
    </CheckoutPageBoundary>
  );
}
