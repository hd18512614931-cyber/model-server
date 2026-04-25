const { createScopedThreejs } = require('threejs-miniprogram')
const { registerGLTFLoader } = require('../../utils/gltf-loader')

Page({
  data: {
    name: '3D模型',
    modelName: '3D模型',
    loading: true
  },

  _touchState: {
    lastX: 0,
    lastY: 0,
    lastPinchDist: 0,
    isPinching: false,
    isRotating: false
  },

  onLoad(options) {
    const app = getApp();
    const name = app.globalData._pendingModelName || options.name || '3D模型';
    this.setData({ name: decodeURIComponent(name), modelName: decodeURIComponent(name) });

    this._modelUrl = app.globalData._pendingModelUrl || (options.url ? decodeURIComponent(options.url) : '');

    app.globalData._pendingModelUrl = '';
    app.globalData._pendingModelName = '';
  },

  onReady() {
    this._initThree();
  },

  onUnload() {
    if (this._animFrameId && this._canvas) {
      this._canvas.cancelAnimationFrame(this._animFrameId);
    }
  },

  goBack() {
    wx.navigateBack();
  },

  _initThree() {
    wx.createSelectorQuery()
      .select('#webgl')
      .node()
      .exec((res) => {
        if (!res[0] || !res[0].node) {
          this.setData({ loading: false });
          wx.showToast({ title: 'Canvas初始化失败', icon: 'none' });
          return;
        }

        const canvas = res[0].node;
        this._canvas = canvas;

        const THREE = createScopedThreejs(canvas);
        this._THREE = THREE;
        registerGLTFLoader(THREE);

        const info = wx.getSystemInfoSync();
        const dpr = info.pixelRatio;
        canvas.width = info.windowWidth * dpr;
        canvas.height = info.windowHeight * dpr;

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(dpr);
        renderer.setSize(canvas.width / dpr, canvas.height / dpr);
        renderer.setClearColor(0x1a1a2e);
        this._renderer = renderer;

        const scene = new THREE.Scene();
        this._scene = scene;

        const camera = new THREE.PerspectiveCamera(
          45, info.windowWidth / info.windowHeight, 0.1, 1000
        );
        camera.position.set(0, 1, 3);
        camera.lookAt(0, 0, 0);
        this._camera = camera;
        this._cameraDistance = camera.position.length();

        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7);
        scene.add(dirLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
        backLight.position.set(-3, -5, -5);
        scene.add(backLight);

        this._loadModel();
      });
  },

  _loadModel() {
    if (!this._modelUrl) {
      this._createDemoCube();
      return;
    }

    console.log('[3D] 加载模型:', this._modelUrl);

    if (this._modelUrl.startsWith('wxfile://') ||
        this._modelUrl.startsWith(wx.env.USER_DATA_PATH)) {
      this._loadGLBFromPath(this._modelUrl);
    } else {
      wx.downloadFile({
        url: this._modelUrl,
        success: (res) => {
          if (res.statusCode === 200) {
            this._loadGLBFromPath(res.tempFilePath);
          } else {
            console.error('[3D] HTTP:', res.statusCode);
            this._createDemoCube();
          }
        },
        fail: (err) => {
          console.error('[3D] 下载失败:', JSON.stringify(err));
          this._createDemoCube();
        }
      });
    }
  },

  _loadGLBFromPath(filePath) {
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      success: (res) => {
        this._parseGLB(res.data);
      },
      fail: (err) => {
        console.error('[3D] 读取文件失败:', err);
        wx.showToast({ title: '模型文件读取失败', icon: 'none' });
        this._createDemoCube();
      }
    });
  },

  _parseGLB(arrayBuffer) {
    const THREE = this._THREE;
    const loader = new THREE.GLTFLoader();
    loader.setCanvas(this._canvas);

    loader.parse(arrayBuffer, '', (gltf) => {
      const model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2.0 / maxDim;

      model.position.sub(center);

      const group = new THREE.Group();
      group.add(model);
      group.scale.setScalar(scale);

      this._scene.add(group);
      this._modelGroup = group;

      this.setData({ loading: false });
      this._startRenderLoop();
    }, (err) => {
      console.error('[3D] GLB解析失败:', err);
      wx.showToast({ title: '模型解析失败', icon: 'none' });
      this._createDemoCube();
    });
  },

  _createDemoCube() {
    const THREE = this._THREE;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0xD4A849 })
    );
    const group = new THREE.Group();
    group.add(mesh);
    this._scene.add(group);
    this._modelGroup = group;

    this.setData({ loading: false });
    this._startRenderLoop();
  },

  _startRenderLoop() {
    const self = this;

    function render() {
      if (self._modelGroup && !self._touchState.isRotating && !self._touchState.isPinching) {
        self._modelGroup.rotation.y += 0.005;
      }
      self._renderer.render(self._scene, self._camera);
      self._animFrameId = self._canvas.requestAnimationFrame(render);
    }

    this._animFrameId = this._canvas.requestAnimationFrame(render);
  },

  onTouchStart(e) {
    const touches = e.touches;
    if (touches.length === 1) {
      this._touchState.lastX = touches[0].clientX;
      this._touchState.lastY = touches[0].clientY;
      this._touchState.isRotating = true;
      this._touchState.isPinching = false;
    } else if (touches.length === 2) {
      this._touchState.isRotating = false;
      this._touchState.isPinching = true;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      this._touchState.lastPinchDist = Math.sqrt(dx * dx + dy * dy);
    }
  },

  onTouchMove(e) {
    const touches = e.touches;

    if (touches.length === 2) {
      this._touchState.isPinching = true;
      this._touchState.isRotating = false;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (this._touchState.lastPinchDist > 0 && this._camera) {
        const ratio = this._touchState.lastPinchDist / dist;
        this._cameraDistance = Math.max(1, Math.min(20, this._cameraDistance * ratio));
        this._camera.position.normalize().multiplyScalar(this._cameraDistance);
        this._camera.lookAt(0, 0, 0);
      }
      this._touchState.lastPinchDist = dist;
    } else if (touches.length === 1 && !this._touchState.isPinching && this._modelGroup) {
      const dx = touches[0].clientX - this._touchState.lastX;
      const dy = touches[0].clientY - this._touchState.lastY;
      this._modelGroup.rotation.y += dx * 0.01;
      this._modelGroup.rotation.x += dy * 0.01;
      this._modelGroup.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this._modelGroup.rotation.x));
      this._touchState.lastX = touches[0].clientX;
      this._touchState.lastY = touches[0].clientY;
    }
  },

  onTouchEnd(e) {
    const touches = e.touches || [];
    if (touches.length < 2) {
      this._touchState.isPinching = false;
      this._touchState.lastPinchDist = 0;
    }
    if (touches.length === 0) {
      this._touchState.isRotating = false;
    }
  }
});
