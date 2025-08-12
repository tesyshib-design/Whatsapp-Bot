# Bot WhatsApp Multifungsi (Toko, Kripto, Hiburan)

Sebuah skrip bot WhatsApp yang dibuat menggunakan Node.js dan library Baileys. Bot ini dirancang untuk menjadi asisten pribadi dan alat bantu penjualan online sederhana, dilengkapi dengan berbagai fitur hiburan dan analisis.

## ✨ Fitur Unggulan

- **Toko Online:**
  - `.katalog`: Menampilkan semua produk yang dijual.
  - `.pesan`: Memproses pesanan dari pelanggan.
  - `.tambahproduk`: Menambah produk baru ke katalog.
  - `.hapusproduk`: Menghapus produk dari katalog.
  - `.updatestok`: Mengubah jumlah stok produk.
- **Utilitas Media:**
  - **Buka Pesan Sekali-Lihat:** Otomatis membuka media *view-once* jika direaksi atau dibalas, lalu mengirimkannya ke grup admin.
  - `.gambar`: Mencari gambar dari internet.
  - `.quote`: Membuat gambar kutipan dengan latar belakang acak.
- **Analisis Kripto:**
  - `.crypto`: Menampilkan harga terkini koin kripto dalam IDR.
  - `.info`: Menampilkan analisis detail sebuah koin dari CoinGecko.
- **Utilitas Bot:**
  - `.menu`: Menampilkan daftar semua perintah yang tersedia.
  - `.setgroup`: Menetapkan grup target untuk notifikasi (pesanan baru, view-once, dll).

## 🚀 Prasyarat

- **Node.js** (versi 18.x atau lebih baru)
- **Git** (untuk mengunggah ke GitHub)

## ⚙️ Instalasi & Setup

1.  **Clone Repositori (atau Unduh ZIP)**
    ```bash
    git clone [https://github.com/NAMA_ANDA/NAMA_REPO_ANDA.git](https://github.com/NAMA_ANDA/NAMA_REPO_ANDA.git)
    cd NAMA_REPO_ANDA
    ```

2.  **Instal Semua Dependensi**
    Buka terminal di dalam folder proyek dan jalankan:
    ```bash
    npm install
    ```

3.  **Buat File Konfigurasi**
    Buat file bernama `config.json` dan `database.json` di direktori utama.
    * **`config.json`**:
        ```json
        {
          "PREFIX": ".",
          "TARGET_GROUP_ID": ""
        }
        ```
    * **`database.json`**:
        ```json
        {
          "products": []
        }
        ```

4.  **Siapkan Aset**
    Buat folder bernama `backgrounds` dan letakkan beberapa gambar (`.jpg`/`.png`) di dalamnya untuk fitur `.quote`.

## ▶️ Menjalankan Bot

1.  Jalankan bot dengan perintah:
    ```bash
    node app.js
    ```
2.  Pada saat pertama kali dijalankan, **scan QR code** yang muncul di terminal menggunakan aplikasi WhatsApp Anda (**Setelan > Perangkat Tertaut**).
3.  Sesi akan tersimpan di dalam folder `session` sehingga Anda tidak perlu scan berulang kali.

## 📝 Daftar Perintah

Gunakan perintah `.menu` untuk melihat daftar perintah terbaru langsung dari bot.
