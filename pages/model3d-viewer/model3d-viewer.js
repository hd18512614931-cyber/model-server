const { Mat4, parseGLB, extractMeshData, createProgram } = require('../../utils/gl-renderer');

Page({
  data: {
    name: '3D模型',
    modelName: '3D模型',
    loading: true
  },

  _touchState: {
    lastX: 0,
    lastY: 0,
    rotX: 0.3,
    rotY: 0,
    distance: 3.0,
    lastPinchDist: 0,
    isPinching: false,
    isRotating: false
  },

  _gl: null,
  _program: null,
  _meshBuffers: [],
  _animFrameId: null,
  _canvas: null,

  onLoad(options) {
    const app = getApp();
    const name = app.globalData._pendingModelName || options.name || '3D模型';
    this.setData({ name: decodeURIComponent(name), modelName: decodeURIComponent(name) });

    this._modelUrl = app.globalData._pendingModelUrl || '';

    app.globalData._pendingModelUrl = '';
    app.globalData._pendingModelName = '';

    this._initCanvas();
  },

  onUnload() {
    if (this._animFrameId && this._canvas) {
      this._canvas.cancelAnimationFrame(this._animFrameId);
    }
  },

  goBack() {
    wx.navigateBack();
  },

  _initCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#glCanvas')
      .node()
      .exec((res) => {
        if (!res[0] || !res[0].node) {
          console.error('Canvas node not found');
          this.setData({ loading: false });
          wx.showToast({ title: 'Canvas初始化失败', icon: 'none' });
          return;
        }

        const canvas = res[0].node;
        this._canvas = canvas;

        const sysInfo = wx.getSystemInfoSync();
        const dpr = sysInfo.pixelRatio;
        canvas.width = sysInfo.windowWidth * dpr;
        canvas.height = sysInfo.windowHeight * dpr;

        const gl = canvas.getContext('webgl');
        if (!gl) {
          this.setData({ loading: false });
          wx.showToast({ title: '您的设备不支持WebGL', icon: 'none' });
          return;
        }

        this._gl = gl;
        gl.viewport(0, 0, canvas.width, canvas.height);
        this._aspectRatio = canvas.width / canvas.height;

        this._program = createProgram(gl);
        if (!this._program) {
          this.setData({ loading: false });
          return;
        }

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
      this._loadLocalFile(this._modelUrl);
    } else {
      this._downloadFromUrl(this._modelUrl);
    }
  },

  _loadLocalFile(path) {
    try {
      const data = wx.getFileSystemManager().readFileSync(path);
      this._processGLB(data);
    } catch (err) {
      console.error('[3D] 读取本地文件失败:', err);
      wx.showToast({ title: '模型文件读取失败', icon: 'none' });
      this._createDemoCube();
    }
  },

  _downloadFromUrl(url) {
    wx.downloadFile({
      url: url,
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const data = wx.getFileSystemManager().readFileSync(res.tempFilePath);
            this._processGLB(data);
          } catch (err) {
            console.error('[3D] 读取文件失败:', err);
            this._createDemoCube();
          }
        } else {
          console.error('[3D] HTTP状态码:', res.statusCode);
          this._createDemoCube();
        }
      },
      fail: (err) => {
        console.error('[3D] 下载失败:', JSON.stringify(err));
        this._createDemoCube();
      }
    });
  },

  _processGLB(arrayBuffer) {
    try {
      const { json, bin } = parseGLB(arrayBuffer);
      const meshes = extractMeshData(json, bin);

      if (meshes.length === 0) {
        this._createDemoCube();
        return;
      }

      let globalBounds = meshes[0].bounds;
      for (const m of meshes) {
        if (m.bounds) {
          globalBounds = {
            center: m.bounds.center,
            size: Math.max(globalBounds.size, m.bounds.size)
          };
        }
      }
      this._modelCenter = globalBounds.center;
      this._modelScale = 2.0 / globalBounds.size;

      this._setupMeshBuffers(meshes);
      this.setData({ loading: false });
      this._startRenderLoop();
    } catch (err) {
      console.error('GLB parse error:', err);
      wx.showToast({ title: '模型解析失败，使用演示模型', icon: 'none' });
      this._createDemoCube();
    }
  },

  _createDemoCube() {
    this._modelCenter = [0, 0, 0];
    this._modelScale = 1.0;

    const s = 0.8;
    const positions = new Float32Array([
      -s,-s, s,  s,-s, s,  s, s, s, -s, s, s,
      -s,-s,-s, -s, s,-s,  s, s,-s,  s,-s,-s,
      -s, s,-s, -s, s, s,  s, s, s,  s, s,-s,
      -s,-s,-s,  s,-s,-s,  s,-s, s, -s,-s, s,
       s,-s,-s,  s, s,-s,  s, s, s,  s,-s, s,
      -s,-s,-s, -s,-s, s, -s, s, s, -s, s,-s,
    ]);

    const normals = new Float32Array([
      0,0,1, 0,0,1, 0,0,1, 0,0,1,
      0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
      0,1,0, 0,1,0, 0,1,0, 0,1,0,
      0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,
      1,0,0, 1,0,0, 1,0,0, 1,0,0,
      -1,0,0, -1,0,0, -1,0,0, -1,0,0,
    ]);

    const indices = new Uint16Array([
      0,1,2, 0,2,3,
      4,5,6, 4,6,7,
      8,9,10, 8,10,11,
      12,13,14, 12,14,15,
      16,17,18, 16,18,19,
      20,21,22, 20,22,23
    ]);

    this._setupMeshBuffers([{
      positions, normals, indices,
      colors: null, baseColor: null, texCoords: null, textureImageData: null
    }]);
    this.setData({ loading: false });
    this._startRenderLoop();
  },

  // ========== 设置 WebGL 缓冲区（含颜色+纹理） ==========
  _setupMeshBuffers(meshes) {
    const gl = this._gl;
    this._meshBuffers = [];

    for (const mesh of meshes) {
      const bufInfo = {};

      // 位置
      const posBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
      bufInfo.position = posBuf;

      // 法线
      if (mesh.normals) {
        const normBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
        bufInfo.normal = normBuf;
      } else {
        const normData = new Float32Array(mesh.positions.length);
        for (let i = 0; i < normData.length; i += 3) {
          normData[i] = 0; normData[i+1] = 1; normData[i+2] = 0;
        }
        const normBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
        gl.bufferData(gl.ARRAY_BUFFER, normData, gl.STATIC_DRAW);
        bufInfo.normal = normBuf;
      }

      // UV 坐标缓冲
      if (mesh.texCoords) {
        const uvBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.texCoords, gl.STATIC_DRAW);
        bufInfo.texCoord = uvBuf;
      }

      // 颜色模式：0=默认色, 1=顶点色, 2=材质色, 3=纹理
      // 纹理优先级最高（异步加载，先用材质色或默认色过渡）
      if (mesh.textureImageData && mesh.texCoords) {
        bufInfo.colorMode = mesh.baseColor ? 2.0 : 0.0;
        if (mesh.baseColor) bufInfo.baseColor = mesh.baseColor;
        this._loadTexture(bufInfo, mesh.textureImageData, mesh.textureMimeType);
      } else if (mesh.colors) {
        const vertCount = mesh.positions.length / 3;
        const comp = mesh.colorComponents || 3;
        const colorData = new Float32Array(vertCount * 4);
        for (let i = 0; i < vertCount; i++) {
          colorData[i*4]   = mesh.colors[i*comp];
          colorData[i*4+1] = mesh.colors[i*comp+1];
          colorData[i*4+2] = mesh.colors[i*comp+2];
          colorData[i*4+3] = comp === 4 ? mesh.colors[i*comp+3] : 1.0;
          if (colorData[i*4] > 1.0 || colorData[i*4+1] > 1.0 || colorData[i*4+2] > 1.0) {
            colorData[i*4]   /= 255.0;
            colorData[i*4+1] /= 255.0;
            colorData[i*4+2] /= 255.0;
            if (comp === 4) colorData[i*4+3] /= 255.0;
          }
        }
        const colorBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf);
        gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
        bufInfo.color = colorBuf;
        bufInfo.colorMode = 1.0;
      } else if (mesh.baseColor) {
        bufInfo.baseColor = mesh.baseColor;
        bufInfo.colorMode = 2.0;
      } else {
        bufInfo.colorMode = 0.0;
      }

      // 索引
      if (mesh.indices) {
        const idxBuf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
        const idxData = mesh.indices instanceof Uint16Array
          ? mesh.indices
          : new Uint16Array(mesh.indices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idxData, gl.STATIC_DRAW);
        bufInfo.index = idxBuf;
        bufInfo.indexCount = idxData.length;
        bufInfo.useIndex = true;
      } else {
        bufInfo.vertexCount = mesh.positions.length / 3;
        bufInfo.useIndex = false;
      }

      this._meshBuffers.push(bufInfo);
    }
  },

  // 异步加载纹理图片 → 创建 WebGL texture
  _loadTexture(bufInfo, imageData, mimeType) {
    const gl = this._gl;
    const canvas = this._canvas;
    const fs = wx.getFileSystemManager();

    this._texCounter = (this._texCounter || 0) + 1;
    const ext = (mimeType === 'image/jpeg') ? '.jpg' : '.png';
    const tempPath = wx.env.USER_DATA_PATH + '/glb_tex_' + this._texCounter + ext;

    try {
      fs.writeFileSync(tempPath, imageData.buffer);
    } catch (err) {
      console.error('[3D] 写入纹理临时文件失败:', err);
      return;
    }

    const img = canvas.createImage();
    img.onload = function() {
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      bufInfo.texture = texture;
      bufInfo.colorMode = 3.0;
      console.log('[3D] 纹理加载成功');
      try { fs.unlinkSync(tempPath); } catch(e) {}
    };
    img.onerror = function(err) {
      console.error('[3D] 纹理图片加载失败:', err);
      try { fs.unlinkSync(tempPath); } catch(e) {}
    };
    img.src = tempPath;
  },

  // ========== 渲染循环 ==========
  _startRenderLoop() {
    const gl = this._gl;
    const program = this._program;
    const canvas = this._canvas;

    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(0.04, 0.04, 0.08, 1.0);

    const aPosition = gl.getAttribLocation(program, 'aPosition');
    const aNormal = gl.getAttribLocation(program, 'aNormal');
    const aColor = gl.getAttribLocation(program, 'aColor');
    const aTexCoord = gl.getAttribLocation(program, 'aTexCoord');
    const uProjection = gl.getUniformLocation(program, 'uProjection');
    const uModelView = gl.getUniformLocation(program, 'uModelView');
    const uNormalMatrix = gl.getUniformLocation(program, 'uNormalMatrix');
    const uBaseColor = gl.getUniformLocation(program, 'uBaseColor');
    const uColorMode = gl.getUniformLocation(program, 'uColorMode');
    const uTexture = gl.getUniformLocation(program, 'uTexture');

    const projMat = Mat4.create();
    const viewMat = Mat4.create();
    const modelMat = Mat4.create();
    const mvMat = Mat4.create();
    const normalMat = Mat4.create();

    const self = this;

    function render() {
      const ts = self._touchState;

      if (!ts.isRotating && !ts.isPinching) {
        ts.rotY += 0.005;
      }

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      Mat4.perspective(projMat, Math.PI / 4, self._aspectRatio, 0.1, 100.0);
      gl.uniformMatrix4fv(uProjection, false, projMat);

      const dist = ts.distance;
      const eyeX = dist * Math.sin(ts.rotY) * Math.cos(ts.rotX);
      const eyeY = dist * Math.sin(ts.rotX);
      const eyeZ = dist * Math.cos(ts.rotY) * Math.cos(ts.rotX);
      Mat4.lookAt(viewMat, [eyeX, eyeY, eyeZ], [0, 0, 0], [0, 1, 0]);

      Mat4.identity(modelMat);
      const scale = self._modelScale || 1;
      const center = self._modelCenter || [0, 0, 0];
      modelMat[0] = scale; modelMat[5] = scale; modelMat[10] = scale;
      modelMat[12] = -center[0] * scale;
      modelMat[13] = -center[1] * scale;
      modelMat[14] = -center[2] * scale;

      Mat4.multiply(mvMat, viewMat, modelMat);
      gl.uniformMatrix4fv(uModelView, false, mvMat);

      Mat4.identity(normalMat);
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
          normalMat[i*4+j] = mvMat[i*4+j];
      gl.uniformMatrix4fv(uNormalMatrix, false, normalMat);

      for (const buf of self._meshBuffers) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buf.position);
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, buf.normal);
        gl.enableVertexAttribArray(aNormal);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);

        // 颜色模式
        gl.uniform1f(uColorMode, buf.colorMode);

        // 顶点颜色
        if (buf.colorMode === 1.0 && buf.color) {
          gl.bindBuffer(gl.ARRAY_BUFFER, buf.color);
          gl.enableVertexAttribArray(aColor);
          gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);
        } else {
          gl.disableVertexAttribArray(aColor);
          gl.vertexAttrib4f(aColor, 1.0, 1.0, 1.0, 1.0);
        }

        // 材质色
        if (buf.colorMode === 2.0 && buf.baseColor) {
          gl.uniform4fv(uBaseColor, buf.baseColor);
        } else {
          gl.uniform4f(uBaseColor, 0.83, 0.65, 0.45, 1.0);
        }

        // 纹理
        if (buf.colorMode === 3.0 && buf.texture && buf.texCoord) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, buf.texture);
          gl.uniform1i(uTexture, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, buf.texCoord);
          gl.enableVertexAttribArray(aTexCoord);
          gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
        } else {
          gl.disableVertexAttribArray(aTexCoord);
          gl.vertexAttrib2f(aTexCoord, 0.0, 0.0);
        }

        if (buf.useIndex) {
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf.index);
          gl.drawElements(gl.TRIANGLES, buf.indexCount, gl.UNSIGNED_SHORT, 0);
        } else {
          gl.drawArrays(gl.TRIANGLES, 0, buf.vertexCount);
        }
      }

      self._animFrameId = canvas.requestAnimationFrame(render);
    }

    this._animFrameId = canvas.requestAnimationFrame(render);
  },

  // ========== 手势处理（单指旋转 + 双指缩放） ==========
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
      // 双指缩放
      this._touchState.isPinching = true;
      this._touchState.isRotating = false;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (this._touchState.lastPinchDist > 0) {
        const ratio = this._touchState.lastPinchDist / dist;
        this._touchState.distance *= ratio;
        this._touchState.distance = Math.max(1.0, Math.min(10.0, this._touchState.distance));
      }
      this._touchState.lastPinchDist = dist;
    } else if (touches.length === 1 && !this._touchState.isPinching) {
      // 单指旋转
      const dx = touches[0].clientX - this._touchState.lastX;
      const dy = touches[0].clientY - this._touchState.lastY;
      this._touchState.rotY += dx * 0.01;
      this._touchState.rotX += dy * 0.01;
      this._touchState.rotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this._touchState.rotX));
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
