const CLOUD_BASE = 'cloud://cloudbase-d2ga3dspk593e200b.636c-cloudbase-d2ga3dspk593e200b-1424774211';

const MODELS = {
  house: `${CLOUD_BASE}/model/house.glb`,
  chman: `${CLOUD_BASE}/model/chman.glb`,
  aiGenerated: `${CLOUD_BASE}/model/ai-generated.glb`
};

const VIDEOS = {
  making: `${CLOUD_BASE}/knowledge/nianhua-making.mp4`,
  story: `${CLOUD_BASE}/knowledge/nianhua-story.mp4`
};

const IMAGES = {
  lightOnBoard: `${CLOUD_BASE}/knowledge/光影打在木板上.jpg`,
  baxian: `${CLOUD_BASE}/knowledge/八仙过海图.jpg`,
  swordDanceFront: `${CLOUD_BASE}/knowledge/双舞剑的木板正面图.jpg`,
  drying: `${CLOUD_BASE}/knowledge/年画晾晒图.jpg`,
  boardDisplay: `${CLOUD_BASE}/knowledge/木板与年画的展示.jpg`,
  coloringCloseup: `${CLOUD_BASE}/knowledge/给木板上色的特写.jpg`,
  carvingHD: `${CLOUD_BASE}/knowledge/高清纪录片视角的木板刻画.jpg`
};

const LAYERS = {
  manifest: `${CLOUD_BASE}/layers/manifest.json`,
  logoDemoOriginal: `${CLOUD_BASE}/layers/logo-demo/original.jpg`
};

const layerFileID = (galleryId, index) => `${CLOUD_BASE}/layers/${galleryId}/layer_${index}.png`;

module.exports = {
  MODELS,
  VIDEOS,
  IMAGES,
  LAYERS,
  layerFileID
};
