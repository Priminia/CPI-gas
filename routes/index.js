const express = require('express');
const router = express.Router();
const db = require('../db'); // SQLite DB 操作模組
const puppeteer = require('puppeteer');

// 取得所有油價資料 (API)
router.get('/api/oil-prices', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM oil_prices ORDER BY date DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '取得油價資料失敗' });
  }
});

// 新增或更新油價資料 (API)
router.post('/api/oil-prices', async (req, res) => {
  const { date, price_92, price_95, price_98, price_diesel } = req.body;
  if (!date) {
    return res.status(400).json({ error: '日期為必填欄位' });
  }

  try {
    const existing = await db.get('SELECT * FROM oil_prices WHERE date = ?', [date]);

    if (existing) {
      await db.run(
        `UPDATE oil_prices SET price_92 = ?, price_95 = ?, price_98 = ?, price_diesel = ? WHERE date = ?`,
        [price_92, price_95, price_98, price_diesel, date]
      );
    } else {
      await db.run(
        `INSERT INTO oil_prices (date, price_92, price_95, price_98, price_diesel) VALUES (?, ?, ?, ?, ?)`,
        [date, price_92, price_95, price_98, price_diesel]
      );
    }

    res.json({ message: '資料新增/更新成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '新增/更新資料失敗' });
  }
});

// 用 Puppeteer 爬取最新油價並更新資料庫 (API)
router.get('/api/oil-prices/update', async (req, res) => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://www.cpc.com.tw/historyprice.aspx?n=2890', {
      waitUntil: 'networkidle2',
    });

    await page.waitForSelector('#tbHistoryPrice tbody tr');

    // 抓取所有歷史油價資料
    const rows = await page.evaluate(() => {
      const data = [];
      const trs = document.querySelectorAll('#tbHistoryPrice tbody tr');

      trs.forEach((tr) => {
        const tds = tr.querySelectorAll('td');
        if (tds.length >= 5) {
          data.push({
            date: tds[0].innerText.trim(),
            price_92: parseFloat(tds[1].innerText.trim()) || 0,
            price_95: parseFloat(tds[2].innerText.trim()) || 0,
            price_98: parseFloat(tds[3].innerText.trim()) || 0,
            price_diesel: parseFloat(tds[4].innerText.trim()) || 0,
          });
        }
      });

      return data;
    });

    await browser.close();

    // 將資料逐筆寫入 SQLite 資料庫
    for (const row of rows) {
      const existing = await db.get('SELECT * FROM oil_prices WHERE date = ?', [row.date]);

      if (existing) {
        await db.run(
          `UPDATE oil_prices SET price_92 = ?, price_95 = ?, price_98 = ?, price_diesel = ? WHERE date = ?`,
          [row.price_92, row.price_95, row.price_98, row.price_diesel, row.date]
        );
      } else {
        await db.run(
          `INSERT INTO oil_prices (date, price_92, price_95, price_98, price_diesel) VALUES (?, ?, ?, ?, ?)`,
          [row.date, row.price_92, row.price_95, row.price_98, row.price_diesel]
        );
      }
    }

    res.json({ message: '所有歷史資料更新完成', count: rows.length });
  } catch (error) {
    console.error('爬取或更新失敗', error);
    res.status(500).json({ error: '爬取或更新歷史油價資料失敗' });
  }
});


// 頁面渲染 - 主頁
router.get('/', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM oil_prices ORDER BY date DESC');
    res.render('index', { oilPrices: rows });
  } catch (error) {
    console.error(error);
    res.render('index', { oilPrices: [] });
  }
});

module.exports = router;
