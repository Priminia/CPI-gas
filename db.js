// db.js (sqlite3 版本)
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'oilprice.db'), (err) => {
  if (err) {
    console.error('無法開啟資料庫:', err.message);
  } else {
    console.log('成功連接到 SQLite 資料庫');
    console.log("Server running on http://localhost:5000")
  }
});

// 建立表格（如果不存在）
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS oil_prices (
      date TEXT PRIMARY KEY,
      price_92 REAL,
      price_95 REAL,
      price_98 REAL,
      price_diesel REAL
    )
  `);
});

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

module.exports = {
  all,
  get,
  run,
};
