const sharp = require('sharp');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageUrl } = req.body;
    const removeBackground = req.body.removeBackground !== false;
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

    if (removeBackground) {
      removeConnectedBackground(rawPixels, width, height);
    }

    const mainColors = detectMainColors(rawPixels, width, height);

    const results = [];
    for (let layerIndex = 0; layerIndex < mainColors.length; layerIndex++) {
      const mainColor = mainColors[layerIndex];
      const layerPixels = Buffer.alloc(width * height * 4);
      let pixelCount = 0;
      for (let i = 0; i < width * height; i++) {
        const offset = i * 4;
        const r = rawPixels[offset], g = rawPixels[offset + 1], b = rawPixels[offset + 2], a = rawPixels[offset + 3];
        if (a > 10 && getQuantizedKey(r, g, b) === mainColor.key) {
          layerPixels[offset] = r;
          layerPixels[offset + 1] = g;
          layerPixels[offset + 2] = b;
          layerPixels[offset + 3] = 255;
          pixelCount++;
        }
      }
      const pngBuffer = await sharp(layerPixels, { raw: { width, height, channels: 4 } }).png().toBuffer();
      results.push({
        name: 'color_' + (layerIndex + 1),
        label: getColorLabel(mainColor.r, mainColor.g, mainColor.b, layerIndex),
        color: rgbToHex(mainColor.r, mainColor.g, mainColor.b),
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

function detectMainColors(rawPixels, width, height) {
  const totalPixels = width * height;
  const minPixelCount = Math.max(1, Math.floor(totalPixels * 0.01));
  const colorMap = new Map();

  for (let i = 0; i < totalPixels; i++) {
    const offset = i * 4;
    const r = rawPixels[offset], g = rawPixels[offset + 1], b = rawPixels[offset + 2], a = rawPixels[offset + 3];
    if (a <= 10 || isNearWhite(r, g, b)) continue;

    const quantized = quantizeColor(r, g, b);
    const key = quantized.join(',');
    const existing = colorMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorMap.set(key, {
        key,
        r: quantized[0],
        g: quantized[1],
        b: quantized[2],
        count: 1
      });
    }
  }

  const sortedColors = Array.from(colorMap.values()).sort((a, b) => b.count - a.count);
  const filteredColors = sortedColors.filter((color) => color.count >= minPixelCount);
  const candidates = filteredColors.length >= 2 ? filteredColors : sortedColors.slice(0, 2);
  return candidates.slice(0, 8);
}

function quantizeColor(r, g, b) {
  return [
    Math.floor(r / 32) * 32,
    Math.floor(g / 32) * 32,
    Math.floor(b / 32) * 32
  ];
}

function getQuantizedKey(r, g, b) {
  return quantizeColor(r, g, b).join(',');
}

function isNearWhite(r, g, b) {
  return r > 220 && g > 220 && b > 220;
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function getColorLabel(r, g, b, index) {
  const [h, s, l] = rgbToHsl(r, g, b);
  if (l < 0.22) return '墨版';
  if ((h < 30 || h >= 330) && s > 0.25) return '红版';
  if (h >= 30 && h < 80 && s > 0.2) return '黄版';
  if (h >= 80 && h <= 180 && s > 0.18) return '绿版';
  return '色版' + (index + 1);
}

function removeConnectedBackground(rawPixels, width, height) {
  const pixelCount = width * height;
  const visited = new Uint8Array(pixelCount);
  const queue = new Uint32Array(pixelCount);
  let head = 0;
  let tail = 0;

  const enqueue = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const index = y * width + x;
    if (visited[index] || !isBackgroundPixel(rawPixels, index)) return;
    visited[index] = 1;
    queue[tail++] = index;
  };

  enqueue(0, 0);
  enqueue(width - 1, 0);
  enqueue(0, height - 1);
  enqueue(width - 1, height - 1);

  while (head < tail) {
    const index = queue[head++];
    rawPixels[index * 4 + 3] = 0;

    const x = index % width;
    const y = Math.floor(index / width);
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }
}

function isBackgroundPixel(rawPixels, index) {
  const offset = index * 4;
  const r = rawPixels[offset], g = rawPixels[offset + 1], b = rawPixels[offset + 2], a = rawPixels[offset + 3];
  if (a <= 10) return true;

  const brightness = (r + g + b) / 3;
  const saturation = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
  return brightness > 200 && saturation < 0.2;
}

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
