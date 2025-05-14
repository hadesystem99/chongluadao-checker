const express = require('express');
const puppeteer = require('puppeteer-core');
const app = express();
const PORT = process.env.PORT || 3000;

// Chromium path for Alpine (Railway)
const chromiumPath = '/usr/bin/chromium-browser';

app.get('/check', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing ?url=' });

  try {
    const browser = await puppeteer.launch({
      executablePath: chromiumPath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(`https://chongluadao.vn/analyze?url=${encodeURIComponent(url)}`, {
      waitUntil: 'networkidle2',
      timeout: 20000
    });

    await page.waitForSelector('.result-content', { timeout: 10000 });
    const statusText = await page.evaluate(() => {
      const el = document.querySelector('.result-content');
      return el ? el.innerText : null;
    });

    await browser.close();

    let status = 'Không xác định';
    if (/an toàn/i.test(statusText)) {
      status = 'An toàn ✅';
    } else if (/nguy hiểm|lừa đảo/i.test(statusText)) {
      status = 'Nguy hiểm ⚠️';
    } else if (/chưa có thông tin|không xác định/i.test(statusText)) {
      status = 'Chưa được đánh giá 🔍';
    }

    res.json({ url, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi xử lý', details: err.toString() });
  }
});

app.get('/', (req, res) => {
  res.send('Puppeteer-Core API ✅');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
