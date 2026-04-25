function registerGLTFLoader(THREE) {

  var COMPONENT_TYPES = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array
  };

  var COMPONENT_SIZES = {
    5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4
  };

  var TYPE_COUNTS = {
    'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4,
    'MAT2': 4, 'MAT3': 9, 'MAT4': 16
  };

  function parseGLBContainer(data) {
    var view = new DataView(data);
    var magic = view.getUint32(0, true);
    if (magic !== 0x46546C67) throw new Error('Not a GLB file');

    var version = view.getUint32(4, true);
    if (version !== 2) throw new Error('Unsupported GLB version: ' + version);

    var jsonChunk = null;
    var binChunk = null;
    var offset = 12;

    while (offset < data.byteLength) {
      var chunkLength = view.getUint32(offset, true);
      var chunkType = view.getUint32(offset + 4, true);
      var chunkData = data.slice(offset + 8, offset + 8 + chunkLength);

      if (chunkType === 0x4E4F534A) {
        var bytes = new Uint8Array(chunkData);
        var str = '';
        for (var i = 0; i < bytes.length; i++) {
          str += String.fromCharCode(bytes[i]);
        }
        jsonChunk = JSON.parse(decodeURIComponent(escape(str)));
      } else if (chunkType === 0x004E4942) {
        binChunk = chunkData;
      }

      offset += 8 + chunkLength;
    }

    return { json: jsonChunk, bin: binChunk };
  }

  function getAccessorData(json, bin, accessorIndex) {
    var accessor = json.accessors[accessorIndex];
    var TypedArr = COMPONENT_TYPES[accessor.componentType];
    var compSize = COMPONENT_SIZES[accessor.componentType];
    var numComp = TYPE_COUNTS[accessor.type];
    var count = accessor.count;
    var totalElements = count * numComp;

    if (accessor.bufferView === undefined) {
      return new TypedArr(totalElements);
    }

    var bv = json.bufferViews[accessor.bufferView];
    var byteOffset = (bv.byteOffset || 0) + (accessor.byteOffset || 0);
    var byteStride = bv.byteStride || 0;

    if (byteStride && byteStride !== compSize * numComp) {
      var result = new TypedArr(totalElements);
      var srcView = new DataView(bin);
      for (var i = 0; i < count; i++) {
        var srcOff = byteOffset + i * byteStride;
        for (var j = 0; j < numComp; j++) {
          var elemOff = srcOff + j * compSize;
          switch (accessor.componentType) {
            case 5126: result[i * numComp + j] = srcView.getFloat32(elemOff, true); break;
            case 5125: result[i * numComp + j] = srcView.getUint32(elemOff, true); break;
            case 5123: result[i * numComp + j] = srcView.getUint16(elemOff, true); break;
            case 5122: result[i * numComp + j] = srcView.getInt16(elemOff, true); break;
            case 5121: result[i * numComp + j] = srcView.getUint8(elemOff); break;
            case 5120: result[i * numComp + j] = srcView.getInt8(elemOff); break;
          }
        }
      }
      return result;
    }

    if (byteOffset % compSize !== 0) {
      var src = new Uint8Array(bin, byteOffset, totalElements * compSize);
      var copy = new ArrayBuffer(src.length);
      new Uint8Array(copy).set(src);
      return new TypedArr(copy, 0, totalElements);
    }

    return new TypedArr(bin, byteOffset, totalElements);
  }

  function GLTFLoader() {
    this._canvas = null;
  }

  GLTFLoader.prototype.setCanvas = function(canvas) {
    this._canvas = canvas;
  };

  GLTFLoader.prototype.parse = function(data, path, onLoad, onError) {
    try {
      var parsed = parseGLBContainer(data);
      var json = parsed.json;
      var bin = parsed.bin;

      var textures = this._parseTextures(json, bin);
      var materials = this._parseMaterials(json, textures);
      var meshes = this._parseMeshes(json, bin, materials);
      var scene = this._buildScene(json, meshes);

      if (onLoad) onLoad({ scene: scene });
    } catch (err) {
      console.error('[GLTFLoader] Parse error:', err);
      if (onError) onError(err);
    }
  };

  GLTFLoader.prototype._parseTextures = function(json, bin) {
    var textures = [];
    if (!json.textures || !json.images) return textures;

    var canvas = this._canvas;

    for (var i = 0; i < json.textures.length; i++) {
      var texDef = json.textures[i];
      var sourceIdx = texDef.source !== undefined ? texDef.source : 0;
      var imageDef = json.images[sourceIdx];

      var texture = new THREE.Texture();
      texture.flipY = false;
      textures[i] = texture;

      if (imageDef.bufferView !== undefined && canvas) {
        var bv = json.bufferViews[imageDef.bufferView];
        var start = bv.byteOffset || 0;
        var imageBuffer = bin.slice(start, start + bv.byteLength);

        var mimeType = imageDef.mimeType || 'image/png';
        var ext = (mimeType === 'image/jpeg') ? '.jpg' : '.png';
        var tempPath = wx.env.USER_DATA_PATH + '/gltf_tex_' + i + '_' + Date.now() + ext;

        try {
          var fs = wx.getFileSystemManager();
          fs.writeFileSync(tempPath, imageBuffer);

          var img = canvas.createImage();
          (function(tex, filePath, fileSystem) {
            img.onload = function() {
              tex.image = img;
              tex.needsUpdate = true;
              try { fileSystem.unlinkSync(filePath); } catch(e) {}
            };
            img.onerror = function() {
              try { fileSystem.unlinkSync(filePath); } catch(e) {}
            };
          })(texture, tempPath, fs);
          img.src = tempPath;
        } catch(e) {
          console.error('[GLTFLoader] Texture error:', e);
        }
      }

      if (texDef.sampler !== undefined && json.samplers) {
        var sampler = json.samplers[texDef.sampler];
        if (sampler.wrapS === 10497) texture.wrapS = THREE.RepeatWrapping;
        if (sampler.wrapT === 10497) texture.wrapT = THREE.RepeatWrapping;
        if (sampler.wrapS === 33648) texture.wrapS = THREE.MirroredRepeatWrapping;
        if (sampler.wrapT === 33648) texture.wrapT = THREE.MirroredRepeatWrapping;
      }
    }

    return textures;
  };

  GLTFLoader.prototype._parseMaterials = function(json, textures) {
    var materials = [];
    if (!json.materials) return materials;

    for (var i = 0; i < json.materials.length; i++) {
      var matDef = json.materials[i];
      var params = {};

      if (matDef.pbrMetallicRoughness) {
        var pbr = matDef.pbrMetallicRoughness;

        if (pbr.baseColorFactor) {
          var c = pbr.baseColorFactor;
          params.color = new THREE.Color(c[0], c[1], c[2]);
          if (c[3] < 1.0) {
            params.opacity = c[3];
            params.transparent = true;
          }
        }

        if (pbr.baseColorTexture && textures[pbr.baseColorTexture.index]) {
          params.map = textures[pbr.baseColorTexture.index];
        }

        params.metalness = pbr.metallicFactor !== undefined ? pbr.metallicFactor : 1.0;
        params.roughness = pbr.roughnessFactor !== undefined ? pbr.roughnessFactor : 1.0;

        if (pbr.metallicRoughnessTexture && textures[pbr.metallicRoughnessTexture.index]) {
          params.metalnessMap = textures[pbr.metallicRoughnessTexture.index];
          params.roughnessMap = textures[pbr.metallicRoughnessTexture.index];
        }
      }

      if (matDef.normalTexture && textures[matDef.normalTexture.index]) {
        params.normalMap = textures[matDef.normalTexture.index];
      }

      if (matDef.emissiveFactor) {
        var e = matDef.emissiveFactor;
        params.emissive = new THREE.Color(e[0], e[1], e[2]);
      }

      if (matDef.emissiveTexture && textures[matDef.emissiveTexture.index]) {
        params.emissiveMap = textures[matDef.emissiveTexture.index];
      }

      if (matDef.doubleSided) {
        params.side = THREE.DoubleSide;
      }

      if (matDef.alphaMode === 'BLEND') {
        params.transparent = true;
      } else if (matDef.alphaMode === 'MASK') {
        params.alphaTest = matDef.alphaCutoff !== undefined ? matDef.alphaCutoff : 0.5;
      }

      materials[i] = new THREE.MeshStandardMaterial(params);
    }

    return materials;
  };

  GLTFLoader.prototype._parseMeshes = function(json, bin, materials) {
    var meshes = [];
    if (!json.meshes) return meshes;

    for (var i = 0; i < json.meshes.length; i++) {
      var meshDef = json.meshes[i];
      var primitives = [];

      for (var p = 0; p < meshDef.primitives.length; p++) {
        var primDef = meshDef.primitives[p];
        var geometry = new THREE.BufferGeometry();
        var attrs = primDef.attributes;

        if (attrs.POSITION !== undefined) {
          var posData = getAccessorData(json, bin, attrs.POSITION);
          if (!(posData instanceof Float32Array)) posData = new Float32Array(posData);
          geometry.addAttribute('position', new THREE.BufferAttribute(posData, 3));
        }

        if (attrs.NORMAL !== undefined) {
          var normData = getAccessorData(json, bin, attrs.NORMAL);
          if (!(normData instanceof Float32Array)) normData = new Float32Array(normData);
          geometry.addAttribute('normal', new THREE.BufferAttribute(normData, 3));
        }

        if (attrs.TEXCOORD_0 !== undefined) {
          var uvData = getAccessorData(json, bin, attrs.TEXCOORD_0);
          if (!(uvData instanceof Float32Array)) uvData = new Float32Array(uvData);
          geometry.addAttribute('uv', new THREE.BufferAttribute(uvData, 2));
        }

        if (attrs.COLOR_0 !== undefined) {
          var colorAcc = json.accessors[attrs.COLOR_0];
          var colorData = getAccessorData(json, bin, attrs.COLOR_0);
          var colorComps = TYPE_COUNTS[colorAcc.type];

          var floatColors;
          if (colorAcc.componentType === 5121) {
            floatColors = new Float32Array(colorData.length);
            for (var k = 0; k < colorData.length; k++) floatColors[k] = colorData[k] / 255.0;
          } else if (colorAcc.componentType === 5123) {
            floatColors = new Float32Array(colorData.length);
            for (var k = 0; k < colorData.length; k++) floatColors[k] = colorData[k] / 65535.0;
          } else {
            floatColors = (colorData instanceof Float32Array) ? colorData : new Float32Array(colorData);
          }

          geometry.addAttribute('color', new THREE.BufferAttribute(floatColors, colorComps));
        }

        if (primDef.indices !== undefined) {
          var idxData = getAccessorData(json, bin, primDef.indices);
          geometry.setIndex(new THREE.BufferAttribute(idxData, 1));
        }

        if (attrs.NORMAL === undefined && attrs.POSITION !== undefined) {
          geometry.computeVertexNormals();
        }

        var material;
        if (primDef.material !== undefined && materials[primDef.material]) {
          material = materials[primDef.material];
        } else {
          material = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.1, roughness: 0.8 });
        }

        if (attrs.COLOR_0 !== undefined) {
          material = material.clone();
          material.vertexColors = (typeof THREE.VertexColors !== 'undefined') ? THREE.VertexColors : true;
        }

        var mesh = new THREE.Mesh(geometry, material);
        if (meshDef.name) mesh.name = meshDef.name;
        primitives.push(mesh);
      }

      meshes[i] = primitives;
    }

    return meshes;
  };

  GLTFLoader.prototype._buildScene = function(json, meshes) {
    var scene = new THREE.Group();
    if (!json.nodes) return scene;

    var nodes = [];
    var i;

    for (i = 0; i < json.nodes.length; i++) {
      var nodeDef = json.nodes[i];
      var node;

      if (nodeDef.mesh !== undefined && meshes[nodeDef.mesh]) {
        var prims = meshes[nodeDef.mesh];
        if (prims.length === 1) {
          node = prims[0];
        } else {
          node = new THREE.Group();
          for (var pi = 0; pi < prims.length; pi++) node.add(prims[pi]);
        }
      } else {
        node = new THREE.Group();
      }

      if (nodeDef.name) node.name = nodeDef.name;

      if (nodeDef.matrix) {
        var m = new THREE.Matrix4();
        m.fromArray(nodeDef.matrix);
        if (node.applyMatrix4) {
          node.applyMatrix4(m);
        } else {
          node.applyMatrix(m);
        }
      } else {
        if (nodeDef.translation) {
          node.position.set(nodeDef.translation[0], nodeDef.translation[1], nodeDef.translation[2]);
        }
        if (nodeDef.rotation) {
          node.quaternion.set(nodeDef.rotation[0], nodeDef.rotation[1], nodeDef.rotation[2], nodeDef.rotation[3]);
        }
        if (nodeDef.scale) {
          node.scale.set(nodeDef.scale[0], nodeDef.scale[1], nodeDef.scale[2]);
        }
      }

      nodes[i] = node;
    }

    for (i = 0; i < json.nodes.length; i++) {
      var children = json.nodes[i].children;
      if (children) {
        for (var ci = 0; ci < children.length; ci++) {
          nodes[i].add(nodes[children[ci]]);
        }
      }
    }

    var sceneDef = json.scenes ? json.scenes[json.scene || 0] : null;
    if (sceneDef && sceneDef.nodes) {
      for (i = 0; i < sceneDef.nodes.length; i++) {
        scene.add(nodes[sceneDef.nodes[i]]);
      }
    } else {
      var childSet = {};
      for (i = 0; i < json.nodes.length; i++) {
        if (json.nodes[i].children) {
          for (var cc = 0; cc < json.nodes[i].children.length; cc++) {
            childSet[json.nodes[i].children[cc]] = true;
          }
        }
      }
      for (i = 0; i < nodes.length; i++) {
        if (!childSet[i]) scene.add(nodes[i]);
      }
    }

    return scene;
  };

  THREE.GLTFLoader = GLTFLoader;
}

module.exports = { registerGLTFLoader: registerGLTFLoader };
