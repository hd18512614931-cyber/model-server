const tcb = require('@cloudbase/node-sdk');
const { PNG } = require('pngjs');
const jpeg = require('jpeg-js');

exports.main = async (event = {}) => {
  const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV });

  try {
    const imageUrl = event.imageUrl || event.imageBase64 || event.image;
    const removeBackground = event.removeBackground !== false;
    const shouldReturnBase64 = event.returnBase64 === true;
    const maxColors = normalizeMaxColors(event.maxColors || event.colorCount);
    const outputPrefix = normalizeOutputPrefix(event.outputPrefix);
    const maxDimension = normalizeMaxDimension(event.maxDimension || 1400);

    if (!imageUrl) {
      return {
        success: false,
        error: '缺少 imageUrl'
      };
    }

    const imageBuffer = await readImageBuffer(app, imageUrl);
    const decoded = decodeImage(imageBuffer, imageUrl);
    let { width, height, data: rawPixels } = decoded;

    if (Math.max(width, height) > maxDimension) {
      const resized = resizeRgbaNearest(rawPixels, width, height, maxDimension);
      width = resized.width;
      height = resized.height;
      rawPixels = resized.data;
    }

    if (removeBackground) {
      removeConnectedBackground(rawPixels, width, height);
    }

    const mainColors = detectMainColors(rawPixels, width, height);
    const selectedColors = maxColors > 0 ? mainColors.slice(0, maxColors) : mainColors;

    if (selectedColors.length < 2) {
      return {
        success: false,
        error: '图片颜色太少，无法进行有效分色。请选择色彩更丰富的图片。'
      };
    }

    if (mainColors.length > 12 && maxColors <= 0) {
      return {
        success: false,
        error: '图片颜色过于复杂（检测到' + mainColors.length + '种主色），不适合进行传统套印分色。请选择色块分明的图片。'
      };
    }

    const pixelAssignment = new Int8Array(width * height).fill(-1);

    for (let i = 0; i < width * height; i++) {
      const offset = i * 4;
      const r = rawPixels[offset], g = rawPixels[offset + 1], b = rawPixels[offset + 2], a = rawPixels[offset + 3];
      if (a <= 10 || isNearWhite(r, g, b)) continue;

      let minDist = Infinity;
      let bestLayer = -1;

      for (let j = 0; j < selectedColors.length; j++) {
        const dist = Math.pow(r - selectedColors[j].r, 2) +
          Math.pow(g - selectedColors[j].g, 2) +
          Math.pow(b - selectedColors[j].b, 2);
        if (dist < minDist) {
          minDist = dist;
          bestLayer = j;
        }
      }

      if (bestLayer >= 0) {
        pixelAssignment[i] = bestLayer;
      }
    }

    const results = [];
    const jobId = createJobId();

    for (let layerIndex = 0; layerIndex < selectedColors.length; layerIndex++) {
      const mainColor = selectedColors[layerIndex];
      const layerPng = new PNG({ width, height });
      let pixelCount = 0;

      for (let i = 0; i < width * height; i++) {
        const offset = i * 4;
        if (pixelAssignment[i] === layerIndex) {
          layerPng.data[offset] = rawPixels[offset];
          layerPng.data[offset + 1] = rawPixels[offset + 1];
          layerPng.data[offset + 2] = rawPixels[offset + 2];
          layerPng.data[offset + 3] = 255;
          pixelCount++;
        } else {
          layerPng.data[offset] = 0;
          layerPng.data[offset + 1] = 0;
          layerPng.data[offset + 2] = 0;
          layerPng.data[offset + 3] = 0;
        }
      }

      const pngBuffer = PNG.sync.write(layerPng);
      const uploadResult = await app.uploadFile({
        cloudPath: createLayerCloudPath(jobId, layerIndex, outputPrefix),
        fileContent: pngBuffer
      });
      const layerResult = {
        name: 'color_' + (layerIndex + 1),
        label: getColorLabel(mainColor.r, mainColor.g, mainColor.b, layerIndex),
        color: rgbToHex(mainColor.r, mainColor.g, mainColor.b),
        pixelCount,
        fileID: uploadResult.fileID || ''
      };

      if (shouldReturnBase64) {
        layerResult.data = 'data:image/png;base64,' + pngBuffer.toString('base64');
      }

      results.push(layerResult);
    }

    return {
      success: true,
      width,
      height,
      storagePrefix: outputPrefix || ('split-layers/' + jobId + '/'),
      colorCount: selectedColors.length,
      layers: results
    };
  } catch (err) {
    console.error('分色处理失败:', err);
    return {
      success: false,
      error: '分色处理失败: ' + err.message
    };
  }
};

function createJobId() {
  return Date.now() + '-' + Math.random().toString(36).slice(2, 10);
}

function createLayerCloudPath(jobId, layerIndex, outputPrefix) {
  if (outputPrefix) {
    return outputPrefix + '/layer_' + layerIndex + '.png';
  }
  return 'split-layers/' + jobId + '/layer_' + layerIndex + '.png';
}

function normalizeMaxColors(value) {
  const count = parseInt(value, 10);
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.max(2, Math.min(count, 12));
}

function normalizeMaxDimension(value) {
  const size = parseInt(value, 10);
  if (!Number.isFinite(size) || size <= 0) return 1400;
  return Math.max(600, Math.min(size, 2400));
}

function normalizeOutputPrefix(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/^\/+|\/+$/g, '');
}

function resizeRgbaNearest(src, width, height, maxDimension) {
  const scale = maxDimension / Math.max(width, height);
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));
  const out = Buffer.alloc(targetWidth * targetHeight * 4);

  for (let y = 0; y < targetHeight; y++) {
    const sourceY = Math.min(height - 1, Math.floor(y / scale));
    for (let x = 0; x < targetWidth; x++) {
      const sourceX = Math.min(width - 1, Math.floor(x / scale));
      const sourceOffset = (sourceY * width + sourceX) * 4;
      const targetOffset = (y * targetWidth + x) * 4;
      out[targetOffset] = src[sourceOffset];
      out[targetOffset + 1] = src[sourceOffset + 1];
      out[targetOffset + 2] = src[sourceOffset + 2];
      out[targetOffset + 3] = src[sourceOffset + 3];
    }
  }

  return {
    width: targetWidth,
    height: targetHeight,
    data: out
  };
}

async function readImageBuffer(app, imageUrl) {
  if (imageUrl.startsWith('data:')) {
    const base64Data = imageUrl.split(',')[1];
    return Buffer.from(base64Data, 'base64');
  }

  if (imageUrl.startsWith('cloud://')) {
    const res = await app.downloadFile({ fileID: imageUrl });
    return Buffer.isBuffer(res.fileContent) ? res.fileContent : Buffer.from(res.fileContent);
  }

  if (/^https?:\/\//i.test(imageUrl)) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('下载图片失败 HTTP ' + response.status);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  throw new Error('不支持的图片格式');
}

function decodeImage(imageBuffer, imageUrl) {
  const contentHint = imageUrl.split(';')[0].toLowerCase();
  const isPng = imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 && imageBuffer[2] === 0x4e && imageBuffer[3] === 0x47;
  const isJpeg = imageBuffer[0] === 0xff && imageBuffer[1] === 0xd8;

  if (isPng || contentHint.includes('image/png')) {
    const png = PNG.sync.read(imageBuffer);
    return {
      width: png.width,
      height: png.height,
      data: Buffer.from(png.data)
    };
  }

  if (isJpeg || contentHint.includes('image/jpeg') || contentHint.includes('image/jpg')) {
    const rawImageData = jpeg.decode(imageBuffer, { useTArray: true });
    return {
      width: rawImageData.width,
      height: rawImageData.height,
      data: Buffer.from(rawImageData.data)
    };
  }

  throw new Error('仅支持 PNG/JPEG 图片分色');
}

function detectMainColors(rawPixels, width, height) {
  const totalPixels = width * height;
  const minPixelCount = Math.max(1, Math.floor(totalPixels * 0.008));
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
  const mergedColors = mergeCloseColors(filteredColors);

  mergedColors.sort((a, b) => b.count - a.count);

  return mergedColors;
}

function quantizeColor(r, g, b) {
  const [h, s, l] = rgbToHsl(r, g, b);

  if (s < 0.15) {
    return [Math.round(l * 255), Math.round(l * 255), Math.round(l * 255)];
  }

  const hBucket = Math.floor(h / 30) * 30 + 15;
  const sBucket = s < 0.5 ? 0.35 : 0.75;
  const lBucket = l < 0.33 ? 0.2 : (l < 0.66 ? 0.5 : 0.8);

  return hslToRgb(hBucket, sBucket, lBucket);
}

function mergeCloseColors(colors) {
  const merged = [];
  const used = new Set();

  for (let i = 0; i < colors.length; i++) {
    if (used.has(i)) continue;
    let current = { ...colors[i] };

    for (let j = i + 1; j < colors.length; j++) {
      if (used.has(j)) continue;

      if (shouldMerge(current, colors[j])) {
        current.count += colors[j].count;
        used.add(j);
      }
    }

    merged.push(current);
  }

  return merged;
}

function shouldMerge(colorA, colorB) {
  const [hA, sA, lA] = rgbToHsl(colorA.r, colorA.g, colorA.b);
  const [hB, sB, lB] = rgbToHsl(colorB.r, colorB.g, colorB.b);

  if (sA < 0.15 && sB < 0.15) {
    return Math.abs(lA - lB) < 0.2;
  }

  if ((sA < 0.15) !== (sB < 0.15)) {
    return false;
  }

  let hDiff = Math.abs(hA - hB);
  if (hDiff > 180) hDiff = 360 - hDiff;

  if (hDiff > 25) return false;

  if (Math.abs(lA - lB) > 0.25) return false;

  if (Math.abs(sA - sB) > 0.35) return false;

  return true;
}

function hslToRgb(h, s, l) {
  h = h / 360;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
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
  if (h > 180 && h < 260 && s > 0.18) return '青版';
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
