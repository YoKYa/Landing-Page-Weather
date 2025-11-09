# ⛅ Landing Page Weather

Landing Page **Weather** adalah halaman arahan (landing) sederhana untuk menampilkan informasi dan promosi aplikasi/cuaca. Dibuat hanya dengan **HTML**, **CSS**, dan **Bootstrap** sehingga ringan, responsif, dan mudah dikembangkan.

> Repo: `YoKYa/Landing-Page-Weather`

---

## ✨ Fitur Utama

- ✅ **Responsive layout** berbasis Bootstrap (mobile–tablet–desktop)
- ✅ **Hero section** dengan judul/tagline cuaca
- ✅ **Section fitur** (highlight keunggulan/layanan)
- ✅ **CTA** (Call‑to‑Action) untuk mengarahkan pengguna ke aksi utama
- ✅ **Footer** sederhana dengan tautan penting
- ✅ **Tanpa framework JS** — murni HTML, CSS, dan Bootstrap

> *Catatan:* Jika ingin menambahkan data cuaca realtime (OpenWeather/WeatherAPI), dapat ditambahkan kemudian dengan JavaScript tanpa mengubah struktur utama.

---

## 🧱 Teknologi

- **HTML5**
- **CSS3**
- **Bootstrap 5** (Grid, Utility, Components)

---

## 🚀 Cara Menjalankan

Tidak membutuhkan server khusus. Cukup buka file `index.html` di browser.

```bash
# 1) Clone repository
git clone https://github.com/YoKYa/Landing-Page-Weather.git
cd Landing-Page-Weather

# 2) Buka file index.html
# Double-click index.html atau
# (opsional) gunakan live server VS Code
```

---

## 📂 Struktur Direktori (Ringkas)

```
Landing-Page-Weather/
├─ index.html
├─ /assets
│  ├─ /css/        # file CSS kustom
│  ├─ /img/        # gambar/ikon
│  └─ /js/         # (opsional) skrip tambahan
└─ README.md
```

> Nama folder bisa disesuaikan; pastikan path di `index.html` mengikuti struktur yang kamu gunakan.

---

## 🧩 Kustomisasi Cepat

1. **Ubah brand/judul** di bagian `<header>`/hero pada `index.html`  
2. **Edit warna/spacing** di file CSS kustom (mis. `assets/css/style.css`)  
3. **Ganti ilustrasi/ikon** di `assets/img/`  
4. (Opsional) **Tambahkan API cuaca**: buat berkas `assets/js/weather.js` dan isi logic fetch API

Contoh import Bootstrap (CDN) di `index.html`:

```html
<!-- Bootstrap CSS -->
<link
  href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
  rel="stylesheet">

<!-- Bootstrap JS (opsional untuk komponen interaktif) -->
<script
  src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js">
</script>
```

---

## 📝 Lisensi

Proyek ini bersifat **open‑source**. Silakan gunakan, modifikasi, dan kembangkan sesuai kebutuhan.

---

Jika repo ini bermanfaat, jangan lupa beri ⭐ di GitHub!
