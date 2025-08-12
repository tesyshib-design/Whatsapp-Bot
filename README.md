# Bot WhatsApp Multifungsi (Toko, Kripto, Hiburan)

Skrip bot WhatsApp multifungsi yang dibuat menggunakan Node.js dan Baileys. Bot ini dirancang untuk menjadi asisten pribadi dan alat bantu penjualan online sederhana.

## Fitur Lengkap
- **Toko Online:**
  - `.katalog`: Menampilkan semua produk.
  - `.pesan`: Memproses pesanan dari pelanggan.
  - `.tambahproduk`: Menambah produk baru ke katalog (Admin).
  - `.hapusproduk`: Menghapus produk (Admin).
  - `.updatestok`: Mengubah jumlah stok (Admin).
- **Utilitas Media:**
  - **Buka Pesan Sekali-Lihat:** Otomatis membuka media *view-once* jika direaksi atau dibalas.
- **Analisis Kripto:**
  - `.crypto`: Menampilkan harga terkini koin kripto.
  - `.info`: Menampilkan analisis detail sebuah koin.
- **Hiburan:**
  - `.gambar`: Mencari dan mengirim gambar dari internet.
  - `.quote`: Membuat gambar kutipan dengan latar belakang acak.
- **Utilitas Bot:**
  - `.menu`: Menampilkan daftar semua perintah.
  - `.setgroup`: Menetapkan grup target untuk notifikasi (pesanan baru, view-once, dll).

## Prasyarat
- **Node.js** (versi 18.x atau lebih baru).
- **npm** (terinstal bersama Node.js).

## Instalasi & Setup
1.  **Siapkan Folder Proyek:** Buat folder baru, lalu buka terminal/CMD di dalam folder tersebut.

2.  **Inisialisasi Proyek:**
    ```bash
    npm init -y
    ```

3.  **Instal Semua Library:**
    ```bash
    npm install @whiskeysockets/baileys @hapi/boom pino qrcode-terminal axios google-it sharp
    ```

4.  **Buat File yang Dibutuhkan:**
    Di dalam folder proyek, buat file-file berikut:
    * **`app.js`**: Salin seluruh kode dari atas ke file ini.
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

5.  **Siapkan Folder `backgrounds`:**
    Buat folder bernama `backgrounds` dan letakkan beberapa gambar (`.jpg`/`.png`) di dalamnya untuk fitur `.quote`.

## Menjalankan Bot
1.  Buka terminal di folder proyek.
2.  Jalankan perintah:
    ```bash
    node app.js
    ```
3.  **Scan QR Code:** Pada saat pertama kali dijalankan, scan QR code yang muncul di terminal menggunakan aplikasi WhatsApp Anda (**Setelan > Perangkat Tertaut**).
4.  **Sesi akan tersimpan** di dalam folder `session` sehingga Anda tidak perlu scan berulang kali.

## Cara Penggunaan
- **Konfigurasi Awal:** Setelah bot berjalan, masukkan bot ke grup yang Anda inginkan sebagai "grup admin" atau "grup notifikasi". Kirim pesan `.setgroup` di dalam grup tersebut.
- **Gunakan Perintah:** Gunakan perintah-perintah yang tersedia sesuai format yang ada di menu.
