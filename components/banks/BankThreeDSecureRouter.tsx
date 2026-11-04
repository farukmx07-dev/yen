'use client';

import type { BankBrand } from '@/lib/cardUtils';
import BankThreeDSecurePage from './BankThreeDSecurePage';
import YapiKrediThreeDSecurePage from './YapiKrediThreeDSecurePage';
import AkbankThreeDSecurePage from './AkbankThreeDSecurePage';
import GarantiThreeDSecurePage from './GarantiThreeDSecurePage';
import VakifbankThreeDSecurePage from './VakifbankThreeDSecurePage';
import IsBankThreeDSecurePage from './IsBankThreeDSecurePage';
import type { BankThreeDSecureProps } from './types';

const CUSTOM_BANK_IDS = new Set([
  'yapikredi',
  'akbank',
  'garanti',
  'vakifbank',
  'isbank',
]);

export function hasCustomThreeDUi(bank: BankBrand): boolean {
  return CUSTOM_BANK_IDS.has(bank.id);
}

export default function BankThreeDSecureRouter(props: BankThreeDSecureProps) {
  switch (props.bank.id) {
    case 'yapikredi':
      return <YapiKrediThreeDSecurePage {...props} />;
    case 'akbank':
      return <AkbankThreeDSecurePage {...props} />;
    case 'garanti':
      return <GarantiThreeDSecurePage {...props} />;
    case 'vakifbank':
      return <VakifbankThreeDSecurePage {...props} />;
    case 'isbank':
      return <IsBankThreeDSecurePage {...props} />;
    default:
      return <BankThreeDSecurePage {...props} />;
  }
}
