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
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Chờ kết quả xuất hiện (tối đa 20 giây)
    const timeout = 20000;
    const pollInterval = 1000;
    const start = Date.now();
    let statusText = null;

    while (Date.now() - start < timeout) {
      try {
        const elHandle = await page.$('.result-content');
        if (elHandle) {
          statusText = await page.evaluate(el => el.innerText, elHandle);
          break;
        }
      } catch (e) {
        // ignore
      }
      await new Promise(r => setTimeout(r, pollInterval));
    }

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
