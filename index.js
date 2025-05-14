// File: index.js

const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/check', async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: "Missing ?url= parameter" });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(`https://chongluadao.vn/analyze?url=${encodeURIComponent(url)}`, {
      waitUntil: 'networkidle2',
      timeout: 20000
    });

    // Wait for result text (max 10s)
    await page.waitForSelector('.result-content', { timeout: 10000 });
    const statusText = await page.evaluate(() => {
      const el = document.querySelector('.result-content');
      return el ? el.innerText : null;
    });

    await browser.close();

    let status = "Không xác định";
    if (/an toàn/i.test(statusText)) {
      status = "An toàn ✅";
    } else if (/nguy hiểm|lừa đảo/i.test(statusText)) {
      status = "Nguy hiểm ⚠️";
    } else if (/chưa có thông tin|không xác định/i.test(statusText)) {
      status = "Chưa được đánh giá 🔍";
    }

    return res.json({ url, status });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Lỗi khi phân tích URL', details: err.toString() });
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to ChongLuaDao Checker API ✅');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
