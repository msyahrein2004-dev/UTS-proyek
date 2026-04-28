const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Koneksi Database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'stiker_db' 
});

db.connect(err => {
    if (err) console.log("Gagal konek:", err);
    else console.log("Mantap! Database Berhasil Terhubung!");
});

// 2. Jalur Halaman Utama
app.get('/', (req, res) => {
    res.send("<h1>Server Stiker Mauldi sudah Online!</h1>");
});

// 3. Jalur LIHAT STOK (Untuk Tampilan Tabel)
app.get('/lihat-stok', (req, res) => {
    db.query("SELECT * FROM items", (err, result) => {
        if (err) res.status(500).send(err);
        else res.send(result);
    });
});

// 4. Jalur TAMBAH STIKER (Master Data)
app.post('/tambah-stiker', (req, res) => {
    const { nama, stok } = req.body;
    const sql = "INSERT INTO items (nama_stiker, stok_saat_ini) VALUES (?, ?)";
    db.query(sql, [nama, stok], (err, result) => {
        if (err) res.status(500).send(err);
        else res.send({ status: "Berhasil!", message: "Stiker " + nama + " sudah masuk!" });
    });
});

// 5. Jalur TRANSAKSI (IN/OUT) - INI YANG TADI KAMU TANYAKAN
app.post('/transaksi', (req, res) => {
    const { item_id, tipe, jumlah } = req.body;
    const sqlLog = "INSERT INTO transactions (item_id, tipe, jumlah) VALUES (?, ?, ?)";
    db.query(sqlLog, [item_id, tipe, jumlah], (err) => {
        if (err) return res.status(500).send(err);

        const simbol = (tipe === 'IN') ? '+' : '-';
        const sqlUpdate = `UPDATE items SET stok_saat_ini = stok_saat_ini ${simbol} ? WHERE id = ?`;

        db.query(sqlUpdate, [jumlah, item_id], (err2) => {
            if (err2) return res.status(500).send(err2);
            res.send({ status: "Sukses", message: `Stok berhasil diupdate (${tipe}) sebanyak ${jumlah}` });
        });
    });
});

// Jalur REGISTER (Buat Akun Baru)
app.post('/register', (req, res) => {
    const { username, password, role } = req.body;
    const sql = "INSERT INTO users (username, password, role) VALUES (?, ?, ?)";
    db.query(sql, [username, password, role], (err, result) => {
        if (err) res.status(500).send(err);
        else res.send({ status: "Sukses", message: "User " + username + " berhasil didaftarkan!" });
    });
});

// Jalur LOGIN
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    db.query(sql, [username, password], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length > 0) {
            res.send({ status: "Sukses", message: "Selamat Datang, " + username, user: results[0] });
        } else {
            res.status(401).send({ status: "Gagal", message: "Username atau Password salah!" });
        }
    });
});

// Jalur HAPUS STIKER
app.delete('/hapus-stiker/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM items WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) res.status(500).send(err);
        else res.send({ status: "Sukses", message: "Stiker dengan ID " + id + " berhasil dihapus!" });
    });
});

// Jalur untuk MELIHAT RIWAYAT TRANSAKSI (Laporan)
app.get('/laporan-transaksi', (req, res) => {
    // Kode ini akan menggabungkan data transaksi dengan nama stikernya agar mudah dibaca
    const sql = `
        SELECT t.id, i.nama_stiker, t.tipe, t.jumlah, t.waktu 
        FROM transactions t 
        JOIN items i ON t.item_id = i.id 
        ORDER BY t.waktu DESC
    `;
    db.query(sql, (err, results) => {
        if (err) res.status(500).send(err);
        else res.send(results);
    });
});

// 6. Jalankan Server
app.listen(3000, () => {
    console.log("Server jalan di http://localhost:3000");
});