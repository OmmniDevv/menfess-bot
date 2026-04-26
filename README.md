# 📩 Menfess Bot

Bot Telegram anonim berbasis GrammY + TypeScript, dengan MongoDB sebagai storage dan support deploy ke Render.com.

---

## Fitur

- Kirim pesan anonim (teks, foto, video) ke grup Telegram
- Preview + konfirmasi sebelum dikirim
- Header otomatis pada setiap menfess
- Daily limit untuk media (foto & video), teks unlimited
- Blacklist user (banned user diabaikan diam-diam)
- Admin commands: ban, unban, reset limit
- Auto-detect mode: webhook (Render) atau polling (lokal)
- Health check endpoint `/ping` untuk UptimeRobot

---

## Struktur Proyek

```
src/
├── index.ts               # Entry point
├── config.ts              # Environment variables
├── handlers/
│   ├── start.ts           # /start command
│   ├── menfess.ts         # Alur kirim menfess
│   └── admin.ts           # /ban /unban /resetlimit
├── middlewares/
│   └── rateLimit.ts       # Daily limit + ban check
├── models/
│   └── User.ts            # Mongoose schema
└── utils/
    ├── database.ts        # Koneksi MongoDB
    └── helpers.ts         # Fungsi utilitas
```

---

## Persiapan

### 1. Buat Bot Telegram

1. Chat [@BotFather](https://t.me/BotFather) di Telegram
2. Kirim `/newbot`, ikuti instruksi
3. Simpan **BOT_TOKEN** yang diberikan

### 2. Dapatkan Group ID

Tambahkan [@userinfobot](https://t.me/userinfobot) ke grup, ketik `/start@userinfobot` — bot akan membalas dengan Chat ID grup (formatnya negatif, misal `-1001234567890`).

### 3. Siapkan MongoDB Atlas

1. Daftar di [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Buat cluster gratis (M0)
3. Buat database user, whitelist IP `0.0.0.0/0`
4. Copy connection string: `mongodb+srv://user:pass@cluster.mongodb.net/menfess`

---

## Instalasi Lokal

```bash
# Clone / extract project
cd menfess-bot

# Install dependencies
npm install

# Setup environment
cp .env.example .env
```

Edit `.env`:

```env
BOT_TOKEN=token_dari_botfather
GROUP_ID=-1001234567890
TOPIC_ID=
WEBHOOK_URL=https://placeholder.com
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/menfess
MAX_MEDIA_PER_DAY=3
ADMIN_IDS=123456789
PORT=3000
```

> Isi `WEBHOOK_URL=https://placeholder.com` untuk mode lokal — bot otomatis pakai polling.

```bash
npm run dev
```

Output sukses:
```
[MongoDB] Connected successfully
[App] MongoDB connected.
[App] Bot running in polling mode
```

---

## Deploy ke Render

### 1. Push ke GitHub

```bash
git init
git add .
git commit -m "init"
git remote add origin https://github.com/username/menfess-bot.git
git push -u origin main
```

### 2. Buat Web Service di Render

1. Login ke [render.com](https://render.com)
2. New → **Web Service** → connect repo GitHub
3. Render otomatis mendeteksi `render.yaml`

### 3. Set Environment Variables

Di dashboard Render → Environment, isi:

| Key | Value |
|-----|-------|
| `BOT_TOKEN` | Token dari BotFather |
| `GROUP_ID` | ID grup tujuan |
| `TOPIC_ID` | *(kosongkan jika tidak pakai Forum/Topics)* |
| `WEBHOOK_URL` | `https://nama-app.onrender.com` |
| `MONGODB_URI` | Connection string MongoDB Atlas |
| `MAX_MEDIA_PER_DAY` | `3` *(atau sesuai keinginan)* |
| `ADMIN_IDS` | User ID admin, pisah koma: `123456,456789` |

### 4. Deploy

Klik **Deploy** — Render akan build dan menjalankan bot secara otomatis.

---

## Supaya Bot On Terus (UptimeRobot)

Render free tier akan tidur setelah 15 menit tidak ada request.

1. Daftar gratis di [uptimerobot.com](https://uptimerobot.com)
2. Add New Monitor → **HTTP(s)**
3. URL: `https://nama-app.onrender.com/ping`
4. Interval: **5 minutes**
5. Save

Bot tidak akan pernah tidur selama UptimeRobot aktif. ✅

---

## Commands

### User
| Command | Fungsi |
|---------|--------|
| `/start` | Tampilkan sambutan & cara pakai |
| `/limit` | Cek sisa limit media hari ini |
| `/cancel` | Batalkan menfess yang sedang pending |

### Admin
| Command | Fungsi |
|---------|--------|
| `/ban <userId>` | Ban user |
| `/unban <userId>` | Unban user |
| `/resetlimit <userId>` | Reset limit media user |

---

## Cara Kerja

```
User kirim pesan (teks/foto/video)
        ↓
Bot cek: banned? → abaikan diam-diam
        ↓
Bot cek: media limit habis? → tolak dengan pesan
        ↓
Bot tampilkan preview + tombol ✅ Kirim / ❌ Batal
        ↓
User tekan ✅ Kirim
        ↓
Bot kirim ke grup dengan header "📩 Menfess Anonim"
(anonim — tidak ada label "Forwarded from")
```

---

## Environment Variables

| Variable | Wajib | Default | Keterangan |
|----------|-------|---------|------------|
| `BOT_TOKEN` | ✅ | — | Token bot dari BotFather |
| `GROUP_ID` | ✅ | — | ID grup tujuan menfess |
| `WEBHOOK_URL` | ✅ | — | URL publik Render (`https://placeholder.com` untuk lokal) |
| `MONGODB_URI` | ✅ | — | Connection string MongoDB |
| `TOPIC_ID` | ❌ | — | ID topic jika grup pakai Forum mode |
| `MAX_MEDIA_PER_DAY` | ❌ | `3` | Batas kirim foto/video per hari |
| `ADMIN_IDS` | ❌ | — | User ID admin, pisah koma |
| `PORT` | ❌ | `3000` | Port HTTP server (otomatis diisi Render) |

---

## Tech Stack

- [GrammY](https://grammy.dev) — Telegram Bot Framework
- [Hono](https://hono.dev) — HTTP Server (webhook mode)
- [Mongoose](https://mongoosejs.com) — MongoDB ODM
- [TypeScript](https://www.typescriptlang.org)
- [Render](https://render.com) — Hosting
- [MongoDB Atlas](https://www.mongodb.com/atlas) — Database
