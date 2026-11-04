const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const banksDir = path.join(__dirname, '..', 'public', 'banks');
const sourcesDir = path.join(banksDir, 'sources');
const skip = new Set(['garanti.png', 'vakifbank.png', 'teb.png', 'hsbc.png', 'maximum.png', 'go-guvenli-ode.png', 'amex.png', 'albaraka.png']);
const threshold = 28;

const sourceOverrides = {
  akbank: 'Akbank-Logo.png',
  ziraat: 'Ziraat_BankasC4B1_logo.png',
  vakifbank: '3840px-VakC4B1fbank_logo.svg.png',
  denizbank: '3840px-DenizBank_logo.svg.png',
  halkbank: '3840px-Halkbank_logo.svg.png',
  hsbc: '960px-HSBC_logo_28201829.svg.png',
  ing: 'ING_BIG-6a28b57f.png',
  isbank: '3840px-TC3BCrkiye_C4B0C59F_BankasC4B1_logo.svg.png',
  kuveytturk: '3840px-Kuveyt_TC3BCrk_Logo.svg.png',
  qnb: '2020040719231221Qnb-finansbank.png',
  sekerbank: '3840px-C59Eekerbank_logo.svg.png',
  teb: 'teb-turkiye-ekonomi-bankasi-logo.png',
  turkiyefinans: 'tf_logo_guide_01.png',
  yapikredi: 'Yapi-Kredi-Logo-Vector.svg-.png',
  garanti: 'Garanti_BBVA.png',
  albaraka: 'albaraka-logo-png_seeklogo-228735.png',
};

function isDark(r, g, b) {
  return r <= threshold && g <= threshold && b <= threshold;
}

function removeEdgeBlackBackground(data, width, height) {
  const visited = new Uint8Array(width * height);
  const queue = [];

  const pushIfDark = (x, y) => {
    const idx = y * width + x;
    if (visited[idx]) return;
    const i = idx * 4;
    if (!isDark(data[i], data[i + 1], data[i + 2])) return;
    visited[idx] = 1;
    queue.push(idx);
  };

  for (let x = 0; x < width; x += 1) {
    pushIfDark(x, 0);
    pushIfDark(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    pushIfDark(0, y);
    pushIfDark(width - 1, y);
  }

  while (queue.length > 0) {
    const idx = queue.pop();
    const x = idx % width;
    const y = Math.floor(idx / width);
    const i = idx * 4;
    data[i + 3] = 0;

    if (x > 0) pushIfDark(x - 1, y);
    if (x < width - 1) pushIfDark(x + 1, y);
    if (y > 0) pushIfDark(x, y - 1);
    if (y < height - 1) pushIfDark(x, y + 1);
  }
}

function resolveSourcePath(filename) {
  const fromSources = path.join(sourcesDir, filename);
  if (fs.existsSync(fromSources)) return fromSources;
  return path.join(banksDir, filename);
}

async function processLogo(file) {
  const bankId = file.replace('.png', '');
  const override = sourceOverrides[bankId];
  const inputPath = override ? resolveSourcePath(override) : path.join(banksDir, file);
  const outputPath = path.join(banksDir, file);

  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  removeEdgeBlackBackground(data, info.width, info.height);

  const tempPath = `${outputPath}.tmp.png`;
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(tempPath);

  fs.renameSync(tempPath, outputPath);
}

async function main() {
  const files = fs.readdirSync(banksDir).filter((f) => f.endsWith('.png') && !skip.has(f));
  for (const file of files) {
    await processLogo(file);
    console.log(`Processed: ${file}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
