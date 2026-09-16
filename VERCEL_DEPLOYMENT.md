# PANDUAN DEPLOY KE VERCEL (APLIKASI PELAPORAN BOSP + FIREBASE REALTIME)

Aplikasi ini siap di-deploy ke **Vercel** dengan langkah-langkah berikut:

---

### Langkah 1: Push Repository ke GitHub / GitLab / Bitbucket
1. Unduh atau export kode aplikasi ini (melalui menu Download ZIP atau Export to GitHub di AI Studio).
2. Buat repository baru di GitHub (misal: `aplikasi-pelaporan-bosp`).
3. Commit dan push semua file termasuk:
   - `firebase-applet-config.json` (berisi konfigurasi Firebase client yang aman di sisi browser)
   - `firestore.rules` & `firebase-blueprint.json`
   - `vercel.json`

---

### Langkah 2: Import Proyek di Vercel
1. Buka [https://vercel.com](https://vercel.com) dan login ke akun Anda.
2. Klik tombol **"Add New..."** lalu pilih **"Project"**.
3. Hubungkan akun GitHub Anda dan pilih repository `aplikasi-pelaporan-bosp`.

---

### Langkah 3: Konfigurasi Build & Output Settings di Vercel
Vercel akan otomatis mendeteksi **Vite**:
- **Framework Preset**: `Vite`
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

---

### Langkah 4: Environment Variables di Vercel (Opsional)
Jika Anda menggunakan fitur AI atau Google Maps pada server backend:
- `GEMINI_API_KEY`: *(Opsional)* Kunci API Gemini Anda dari Google AI Studio.
- `VITE_GOOGLE_MAPS_API_KEY`: *(Opsional)* Kunci API Google Maps jika digunakan.

---

### Catatan Penting Mengenai Firebase Firestore di Vercel
- Konfigurasi Firebase (`firebase-applet-config.json`) telah disertakan langsung di dalam proyek dan dibundle oleh Vite ke dalam file statis `dist/`.
- Saat web dibuka di Vercel, aplikasi akan langsung terkoneksi ke database **Firestore** (`united-avatar-5mbw7`) secara *real-time* tanpa konfigurasi server tambahan.
- Aturan keamanan telah aktif via `firestore.rules`.
