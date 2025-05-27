const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const indexRouter = require('./routes/index');

const app = express();

// 設定 EJS 為模板引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 靜態資源目錄
app.use(express.static(path.join(__dirname, 'public')));

// 解析 JSON 與 URL-encoded 資料
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// 掛載路由
app.use('/', indexRouter);

// 404 錯誤處理
app.use((req, res, next) => {
  res.status(404).send('404 Not Found');
});

// 一般錯誤處理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('500 Internal Server Error');
});

module.exports = app;  // <-- 這是重點！
