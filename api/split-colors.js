const sharp = require('sharp');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: '缺少 imageUrl' });

    let imageBuffer;
    if (imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      const fetch = globalThis.fetch || (await import('node-fetch')).default;
      const response = await fetch(imageUrl);
      imageBuffer = Buffer.from(await response.arrayBuffer());
    }

    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const { width, height } = metadata;
    const rawPixels = await image.ensureAlpha().raw().toBuffer();

    const layers = [
      {
        name: 'black',
        label: '墨线稿',
        color: '#1a1a1a',
        filter: (r, g, b) => {
          const l = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
          return l < 80;
        }
      },
      {
        name: 'red',
        label: '大红',
        color: '#cc2936',
        filter: (r, g, b) => {
          const [h, s, l] = rgbToHsl(r, g, b);
          return (h < 30 || h > 330) && s > 0.3 && l >= 0.15 && l < 0.75;
        }
      },
      {
        name: 'green',
        label: '翠绿',
        color: '#2d6a4f',
        filter: (r, g, b) => {
          const [h, s, l] = rgbToHsl(r, g, b);
          return h >= 80 && h <= 180 && s > 0.2 && l >= 0.1 && l < 0.8;
        }
      },
      {
        name: 'yellow',
        label: '橙黄',
        color: '#e6a817',
        filter: (r, g, b) => {
          const [h, s, l] = rgbToHsl(r, g, b);
          return h >= 30 && h < 80 && s > 0.2 && l >= 0.15 && l < 0.85;
        }
      },
      {
        name: 'skin',
        label: '肉粉',
        color: '#e8b4a2',
        filter: (r, g, b) => {
          const [h, s, l] = rgbToHsl(r, g, b);
          return h >= 5 && h <= 45 && s > 0.1 && s <= 0.6 && l >= 0.55;
        }
      }
    ];

    const results = [];
    for (const layer of layers) {
      const layerPixels = Buffer.alloc(width * height * 4);
      let pixelCount = 0;
      for (let i = 0; i < width * height; i++) {
        const offset = i * 4;
        const r = rawPixels[offset], g = rawPixels[offset + 1], b = rawPixels[offset + 2], a = rawPixels[offset + 3];
        const isWhiteBackground = r > 240 && g > 240 && b > 240;
        if (a > 10 && !isWhiteBackground && layer.filter(r, g, b)) {
          layerPixels[offset] = r;
          layerPixels[offset + 1] = g;
          layerPixels[offset + 2] = b;
          layerPixels[offset + 3] = a;
          pixelCount++;
        }
      }
      const pngBuffer = await sharp(layerPixels, { raw: { width, height, channels: 4 } }).png().toBuffer();
      results.push({
        name: layer.name,
        label: layer.label,
        color: layer.color,
        pixelCount,
        data: 'data:image/png;base64,' + pngBuffer.toString('base64')
      });
    }

    res.status(200).json({ success: true, width, height, layers: results });
  } catch (err) {
    console.error('分色处理失败:', err);
    res.status(500).json({ error: '分色处理失败: ' + err.message });
  }
};

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return [h, s, l];
}
