const fs = require('fs');
const path = require('path');

const binlerPath = path.join(__dirname, '..', 'binler.txt');
const tsvPath = path.join(__dirname, '..', 'data', 'bank-bins.tsv');
const outPath = path.join(__dirname, '..', 'lib', 'bankBinData.ts');

function resolveBankCode(issuer) {
  const u = (issuer || '').toUpperCase();
  if (!u) return 0;
  if (/ZIRAAT KATILIM/.test(u)) return 10;
  if (/ZIRAAT/.test(u)) return 10;
  if (/HALK BANK/.test(u)) return 12;
  if (/VAKIFLAR|VAKIF BANK/.test(u) && !/KATILIM/.test(u)) return 15;
  if (/VAKIF KATILIM/.test(u)) return 15;
  if (/EKONOMI|TEB|T\.E\.K|FORTIS/.test(u)) return 32;
  if (/AKBANK/.test(u)) return 46;
  if (/SEKERBANK|ŞEKER/.test(u)) return 59;
  if (/GARANTI/.test(u)) return 62;
  if (/IS BANKASI|İŞ BANK/.test(u)) return 64;
  if (/YAPI.*KREDI|YAPI VE KREDI/.test(u)) return 67;
  if (/FINANSBANK|QNB BANK|QNB FINANS/.test(u)) return 111;
  if (/HSBC/.test(u)) return 123;
  if (/DENIZBANK|DENİZ/.test(u)) return 134;
  if (/ANADOLU/.test(u)) return 135;
  if (/ALBARAKA/.test(u)) return 203;
  if (/KUVEYT/.test(u)) return 205;
  if (/TURKIYE FINANS|T\.FİNANS/.test(u)) return 206;
  if (/ASYA KATILIM|BANK ASYA/.test(u)) return 208;
  if (/ING BANK|^ING,/.test(u)) return 99;
  if (/CITIBANK/.test(u)) return 92;
  if (/BURGAN/.test(u)) return 125;
  if (/ALTERNATIF/.test(u)) return 124;
  if (/FIBABANK/.test(u)) return 103;
  if (/ODEA BANK/.test(u)) return 146;
  if (/ICBC/.test(u)) return 109;
  if (/TURKISH BANK/.test(u)) return 96;
  if (/TURKLAND/.test(u)) return 108;
  if (/EUROBANK/.test(u)) return 125;
  if (/AKTIF YATIRIM|AKTIFBANK/.test(u)) return 143;
  if (/POSTA VE TELGRAF|POSTAL AND TELEGRAPH|^PTT/.test(u)) return 600;
  return 0;
}

function normalizeIssuerName(issuer) {
  return (issuer || '')
    .replace(/\s*,?\s*T\.A\.S\.?$/i, '')
    .replace(/\s*,?\s*T\.A\.O\.?$/i, '')
    .replace(/\s*,?\s*A\.Ş\.?$/i, '')
    .replace(/\s*,?\s*A\.S\.?$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeScheme(network) {
  const n = (network || '').toUpperCase();
  if (n.includes('VISA')) return 'VISA';
  if (n.includes('MASTERCARD')) return 'MASTERCARD';
  if (n.includes('AMERICAN EXPRESS') || n === 'AMEX') return 'AMEX';
  if (n.includes('TROY')) return 'TROY';
  if (n.includes('MAESTRO')) return 'MAESTRO';
  return n || 'OTHER';
}

function inferFundingType(type, category, prepaidFlag) {
  const t = (type || '').toUpperCase();
  const c = (category || '').toUpperCase();
  if (t === 'DEBIT') return 'DEBIT';
  if (t === 'CREDIT') return 'CREDIT';
  if (prepaidFlag || c.includes('PREPAID') || c.includes('ELECTRON')) return 'DEBIT';
  return 'CREDIT';
}

function parseBinlerCsv(raw) {
  const lines = raw.trim().split(/\r?\n/);
  const header = lines[0];
  if (!header.startsWith('BIN;')) {
    throw new Error('binler.txt: expected BIN;Network;Type;Category;Issuer header');
  }

  const entries = [];
  const seen = new Set();

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cols = line.split(';');
    const [bin, network, fundingType, category, issuer] = cols;
    if (!bin || !/^\d{6}$/.test(bin.trim())) continue;

    const binKey = bin.trim();
    if (seen.has(binKey)) continue;
    seen.add(binKey);

    const cat = (category || '').toUpperCase();
    const normalizedIssuer = normalizeIssuerName(issuer || '');

    entries.push({
      bin: binKey,
      bankCode: resolveBankCode(issuer || ''),
      bankName: normalizedIssuer || 'Bilinmeyen',
      scheme: normalizeScheme(network),
      fundingType: inferFundingType(fundingType, category, cat.includes('PREPAID')),
      subType: cat,
      virtual: cat.includes('VIRTUAL'),
      prepaid: cat.includes('PREPAID'),
    });
  }

  return { entries, seen };
}

function parseTsvSupplement(raw, seen, binlerEntries) {
  const lines = raw.trim().split(/\r?\n/).slice(1);
  const added = [];
  const binlerByBin = new Map(binlerEntries.map((entry) => [entry.bin, entry]));

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split('\t');
    const [bin, bankCode, bankName, scheme, subType, virtual, prepaid] = cols;
    if (!bin || !/^\d{6}$/.test(bin.trim()) || seen.has(bin.trim())) continue;

    const binKey = bin.trim();
    const existing = binlerByBin.get(binKey);
    const tsvCode = parseInt(bankCode.trim(), 10) || 0;
    if (existing && existing.bankCode !== 0 && tsvCode !== 0 && existing.bankCode !== tsvCode) {
      console.warn(
        `Skipping TSV BIN ${binKey}: conflicts with binler.txt (${existing.bankName}, code ${existing.bankCode})`
      );
      continue;
    }

    seen.add(binKey);
    const sub = (subType || '').trim().toUpperCase();
    const isPrepaid = (prepaid || '').trim().toUpperCase() === 'PREPAID';

    added.push({
      bin: binKey,
      bankCode: parseInt(bankCode.trim(), 10) || 0,
      bankName: normalizeIssuerName(bankName.trim()) || 'Bilinmeyen',
      scheme: (scheme || '').trim().toUpperCase(),
      fundingType: inferFundingType('', sub, isPrepaid),
      subType: sub,
      virtual: (virtual || '').trim() === 'virtual',
      prepaid: isPrepaid,
    });
  }

  return added;
}

if (!fs.existsSync(binlerPath)) {
  console.error(`Missing source file: ${binlerPath}`);
  process.exit(1);
}

const binlerRaw = fs.readFileSync(binlerPath, 'utf8');
const { entries, seen } = parseBinlerCsv(binlerRaw);

let tsvAdded = 0;
if (fs.existsSync(tsvPath)) {
  const tsvRaw = fs.readFileSync(tsvPath, 'utf8');
  const supplement = parseTsvSupplement(tsvRaw, seen, entries);
  entries.push(...supplement);
  tsvAdded = supplement.length;
}

entries.sort((a, b) => a.bin.localeCompare(b.bin));

const uniqueBankCodes = [...new Set(entries.map((e) => e.bankCode))].sort((a, b) => a - b);

const ts = `// Auto-generated from binler.txt (+ data/bank-bins.tsv supplement) — do not edit manually
// Run: node scripts/generate-bank-bins.js

export interface BankBinEntry {
  bin: string;
  bankCode: number;
  bankName: string;
  scheme: string;
  fundingType: 'DEBIT' | 'CREDIT';
  subType: string;
  virtual: boolean;
  prepaid: boolean;
}

export const BANK_BIN_ENTRIES: BankBinEntry[] = ${JSON.stringify(entries, null, 2)};

export const BANK_BIN_CODES = ${JSON.stringify(uniqueBankCodes)} as const;

export type BankBinCode = (typeof BANK_BIN_CODES)[number];
`;

fs.writeFileSync(outPath, ts, 'utf8');
console.log(`Generated ${entries.length} BIN entries (${entries.length - tsvAdded} from binler.txt, ${tsvAdded} from tsv) -> ${outPath}`);
