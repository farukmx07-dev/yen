# Coolify Deploy

Proje Docker + MySQL + WebSocket (`/ws`) ile Coolify'a hazir.

## Hizli baslangic (Docker Compose — onerilen)

Coolify panel:

1. **+ New Resource** → **Docker Compose**
2. Git repo bagla
3. Compose file: `docker-compose.yaml`
4. Domain ekle (ornek: `aldinaldinfirsatlari.com`)
5. **WebSocket** destegini ac (Coolify otomatik Traefik ayarlar)
6. Environment variables:

```env
NEXT_PUBLIC_APP_URL=https://aldinaldinfirsatlari.com
NEXT_PUBLIC_BASE_URL=https://aldinaldinfirsatlari.com
SITE_URL=https://aldinaldinfirsatlari.com
JWT_SECRET=uzun-rastgele-bir-deger

MYSQL_ROOT_PASSWORD=guclu-root-sifre
MYSQL_USER=market
MYSQL_PASSWORD=guclu-db-sifre
MYSQL_DATABASE=market

RUN_DB_MIGRATE=true

# Onemli: HOSTNAME=127.0.0.1 KULLANMA (Bad Gateway verir)
# Production'da BIND_HOST=0.0.0.0 veya HOSTNAME bos birak
BIND_HOST=0.0.0.0
PORT=3000
```

7. Deploy

Ilk deploy'da `data/*.json` otomatik MySQL'e aktarilir. Sonraki deploylarda `RUN_DB_MIGRATE=false` yap.

---

## Sadece Dockerfile (Coolify managed MySQL)

Coolify'da ayri **MySQL database** olustur, app servisine bagla:

1. **+ New Resource** → **Database** → MySQL
2. **+ New Resource** → **Application** → Dockerfile
3. App environment:

```env
MYSQL_HOST=<coolify-mysql-internal-host>
MYSQL_PORT=3306
MYSQL_USER=<db-user>
MYSQL_PASSWORD=<db-password>
MYSQL_DATABASE=market

NEXT_PUBLIC_APP_URL=https://domain.com
NEXT_PUBLIC_BASE_URL=https://domain.com
SITE_URL=https://domain.com
JWT_SECRET=...

RUN_DB_MIGRATE=false
```

Coolify MySQL internal hostname genelde servis adi veya panelde gosterilir.

---

## SSL / WSS

Coolify Traefik uzerinden HTTPS verir. `.env`'de **WS_SSL_KEY / WS_SSL_CERT tanimlama** — gerek yok.

WebSocket otomatik `wss://domain.com/ws` olarak calisir (sayfa HTTPS ise).

Opsiyonel override:

```env
NEXT_PUBLIC_WS_URL=wss://aldinaldinfirsatlari.com/ws
```

---

## Local test

```bash
cp .env.example .env
# .env icinde MYSQL_* ve sifreleri duzenle

docker compose up --build
```

Uygulama: http://localhost:3000  
Health: http://localhost:3000/api/health  
WebSocket: ws://localhost:3000/ws

---

## Sorun giderme

| Sorun | Cozum |
|-------|-------|
| Bad Gateway | `HOSTNAME=127.0.0.1` sil; `BIND_HOST=0.0.0.0`, `PORT=3000` |
| `/_next/image` 400 | Docker build `NEXT_IMAGE_UNOPTIMIZED=1` (Dockerfile varsayilan); gorseller `/public` uzerinden servis edilir |
| `crypto.randomUUID` hatasi | HTTP uzerinde tarayici API yok; kod polyfill kullanir — redeploy et. Kalici cozum: Coolify'da HTTPS ac |
| TikTok `ERR_BLOCKED_BY_CLIENT` | Reklam engelleyici; uygulama hatasi degil |
| MySQL baglanamiyor | `MYSQL_HOST=mysql` (compose icinde) veya Coolify DB host |
| WebSocket kopuyor | Coolify'da WebSocket/proxy upgrade acik mi kontrol et |
| Bos admin panel | `RUN_DB_MIGRATE=true` ile yeniden deploy veya `npm run db:migrate` |
| Build hatasi | Coolify build args: `NEXT_PUBLIC_APP_URL` domain ile eslestir |
