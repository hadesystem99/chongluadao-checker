const express = require('express');
const puppeteer = require('puppeteer-core');
const app = express();
const PORT = process.env.PORT || 3000;

// Đường dẫn Chromium phù hợp Railway (Alpine Linux)
const chromiumPath = '/usr/bin/chromium-browser';

app.get('/check', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Thiếu ?url=' });

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

    // Chờ kết quả xuất hiện bằng XPath (tối đa 20 giây)
    const timeout = 20000;
    const pollInterval = 1000;
    const start = Date.now();
    let statusText = null;

    while (Date.now() - start < timeout) {
      try {
        const [elHandle] = await page.$x("//div[contains(text(), 'An toàn') or contains(text(), 'Nguy hiểm') or contains(text(), 'Chưa')]");
        if (elHandle) {
          statusText = await page.evaluate(el => el.innerText.trim(), elHandle);
          console.log('Kết quả raw:', statusText);
          break;
        }
      } catch (e) {}
      await new Promise(r => setTimeout(r, pollInterval));
    }

    await browser.close();

    let status = 'Không xác định';
    if (/an toàn/i.test(statusText)) {
      status = 'An toàn ✅';
    } else if (/nguy hiểm|lừa đảo/i.test(statusText)) {
      status = 'Nguy hiểm ⚠️';
    } else if (/chưa có thông tin|không xác định|chưa được đánh giá/i.test(statusText)) {
      status = 'Chưa được đánh giá 🔍';
    }

    res.json({ url, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi xử lý', details: err.toString() });
  }
});

app.get('/', (req, res) => {
  res.send('Puppeteer API đang chạy ✅');
});

app.listen(PORT, () => {
  console.log(`Server chạy tại cổng ${PORT}`);
});
