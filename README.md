# Klinik Sehat — Sistem Antrean Klinik Modern

Aplikasi antrean klinik kesehatan lengkap dengan antarmuka **Frontend (React 19 + TypeScript + Tailwind CSS v4)** dan **Backend (Express.js + Supabase PostgreSQL)** dengan dukungan **Realtime WebSocket, Audio Announcer (Bel Ding-Dong & Suara Panggilan), serta QR Code**.

---

## 🚀 Fitur Utama

1. **Multi-Role Terintegrasi**:
   - **Pasien**: Pendaftaran online / walk-in, tiket antrean digital dengan **QR Code**, estimasi waktu tunggu, dan jalur prioritas (lansia/hamil/disabilitas).
   - **Petugas Loket**: Dashboard pendaftaran walk-in, deteksi data NIK/HP tidak valid, serta modal koreksi dan penerbitan tiket di tempat.
   - **Dokter**: Dashboard multi-poli untuk Poli Umum (A · R. 101), Poli Gigi (B · R. 102), dan Poli Anak (C · R. 103), termasuk pemanggilan, penyelesaian, dan melewati antrean.
   - **Layar TV Publik**: Layar panggilan antrean (*digital signage*), panggilan nomor berikutnya berdasarkan prioritas, dan **pengumuman suara otomatis (Bel Ding-Dong + Text-to-Speech Bahasa Indonesia)**.
2. **Backend Express.js (`server/`)**:
   - REST API lengkap (`/api/queues/register`, `/api/queues/call-next`, `/api/queues/:id/validate`).
   - Dual-Mode: Otomatis tersambung ke **Supabase (PostgreSQL)** jika kredensial diisi, atau menggunakan *In-Memory Mode* saat pengujian lokal tanpa internet.
3. **Supabase Realtime**:
   - Skema database relasional lengkap (`schema.sql`).
   - Sinkronisasi instan antar perangkat (HP pasien, komputer loket, dan TV monitor ruang tunggu).

---

## 🛠️ Langkah Menjalankan Project

### 1. Persiapan Database Supabase

1. Buka [Supabase Dashboard](https://supabase.com/) dan buat proyek baru (gratis).
2. Masuk ke menu **SQL Editor** &rarr; **New Query**.
3. Buka file [`server/schema.sql`](server/schema.sql), salin seluruh isinya, lalu klik **Run**.
4. Masuk ke menu **Project Settings** &rarr; **API**, lalu salin:
   - **Project URL**
   - **anon / public key**
5. Tempelkan kredensial tersebut ke:
   - File [`server/.env`](server/.env):
     ```env
     PORT=5000
     SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
     SUPABASE_KEY=eyJh...
     ```
   - File [`.env`](.env) pada folder utama:
     ```env
     VITE_API_URL=http://localhost:5000/api
     VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJh...
     ```

*(Catatan: Jika belum mengisi Supabase, server Express tetap bisa dijalankan dan akan otomatis beralih ke Mode Memory/Lokal).*

Dalam **Memory Mode**, dashboard dokter langsung memiliki antrean demo aktif dan dua pasien menunggu untuk masing-masing poli. Memanggil pasien dari satu poli hanya memajukan antrean poli tersebut; monitor diperbarui otomatis dalam beberapa detik.

---

### 2. Menjalankan Server Backend (Express.js)

Buka terminal pertama di folder project:

```powershell
npm run server
```
Server Express akan aktif di: **`http://localhost:5000`** (Status: `http://localhost:5000/api/health`).

---

### 3. Menjalankan Frontend (React + Vite)

Buka terminal kedua di folder project:

```powershell
npm run dev
```
Buka alamat berikut di browser: **`http://localhost:8443`**

---

## 📁 Struktur Folder

```text
├── server/                     # Backend Express.js
│   ├── src/
│   │   ├── routes/queues.ts    # REST API endpoints antrean
│   │   ├── supabase.ts         # Koneksi Supabase client
│   │   └── index.ts            # Server entrypoint & CORS
│   ├── schema.sql              # Skrip DDL database Supabase
│   ├── .env                    # Kredensial server & Supabase
│   └── package.json
│
├── src/                        # Frontend React + TypeScript
│   ├── components/ui/          # Komponen UI modular (Card, Btn, Badge, Field, Logo, Shell, Pipeline)
│   ├── services/api.ts         # Service pemanggil API Express & Supabase Realtime
│   ├── types/queue.ts          # Type definition & helper validasi NIK/HP
│   ├── utils/audio.ts          # Synthesizer Bel Ding-Dong & Text-to-Speech (TTS)
│   ├── views/                  # Halaman aplikasi per role:
│   │   ├── Login.tsx           # Layar pemilihan role & autentikasi
│   │   ├── PatientView.tsx     # Alur pendaftaran pasien & tiket QR Code
│   │   ├── StaffView.tsx       # Manajemen loket walk-in & koreksi data
│   │   └── SystemMonitor.tsx   # Layar TV publik & kontrol pemanggilan antrean
│   ├── App.tsx                 # Root application state & router
│   ├── index.css               # Tailwind CSS v4 design tokens
│   └── main.tsx
└── README.md
```

---

## 🧪 Perintah Pengujian

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan frontend Vite di port 8443 |
| `npm run server` | Menjalankan backend Express di port 5000 |
| `npx tsc --noEmit` | Memeriksa tipe data TypeScript frontend |
| `npm run build` | Membuat build produksi frontend ke folder `dist` |
