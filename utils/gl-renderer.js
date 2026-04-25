/**
 * 轻量级 GLB 加载器 + WebGL 渲染器（支持颜色）
 * 适配微信小程序 Canvas WebGL
 */

// ========== 矩阵数学工具 ==========
const Mat4 = {
  create() {
    return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  },

  perspective(out, fovy, aspect, near, far) {
    const f = 1.0 / Math.tan(fovy / 2);
    const nf = 1 / (near - far);
    out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
    out[12] = 0; out[13] = 0; out[14] = 2 * far * near * nf; out[15] = 0;
    return out;
  },

  lookAt(out, eye, center, up) {
    let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
    z0 = eye[0] - center[0]; z1 = eye[1] - center[1]; z2 = eye[2] - center[2];
    len = 1 / Math.sqrt(z0*z0 + z1*z1 + z2*z2);
    z0 *= len; z1 *= len; z2 *= len;
    x0 = up[1]*z2 - up[2]*z1; x1 = up[2]*z0 - up[0]*z2; x2 = up[0]*z1 - up[1]*z0;
    len = Math.sqrt(x0*x0 + x1*x1 + x2*x2);
    if (len) { len = 1/len; x0 *= len; x1 *= len; x2 *= len; }
    y0 = z1*x2 - z2*x1; y1 = z2*x0 - z0*x2; y2 = z0*x1 - z1*x0;
    len = Math.sqrt(y0*y0 + y1*y1 + y2*y2);
    if (len) { len = 1/len; y0 *= len; y1 *= len; y2 *= len; }
    out[0]=x0; out[1]=y0; out[2]=z0; out[3]=0;
    out[4]=x1; out[5]=y1; out[6]=z1; out[7]=0;
    out[8]=x2; out[9]=y2; out[10]=z2; out[11]=0;
    out[12]=-(x0*eye[0]+x1*eye[1]+x2*eye[2]);
    out[13]=-(y0*eye[0]+y1*eye[1]+y2*eye[2]);
    out[14]=-(z0*eye[0]+z1*eye[1]+z2*eye[2]);
    out[15]=1;
    return out;
  },

  multiply(out, a, b) {
    const a00=a[0],a01=a[1],a02=a[2],a03=a[3],
          a10=a[4],a11=a[5],a12=a[6],a13=a[7],
          a20=a[8],a21=a[9],a22=a[10],a23=a[11],
          a30=a[12],a31=a[13],a32=a[14],a33=a[15];
    let b0,b1,b2,b3;
    b0=b[0];b1=b[1];b2=b[2];b3=b[3];
    out[0]=b0*a00+b1*a10+b2*a20+b3*a30;
    out[1]=b0*a01+b1*a11+b2*a21+b3*a31;
    out[2]=b0*a02+b1*a12+b2*a22+b3*a32;
    out[3]=b0*a03+b1*a13+b2*a23+b3*a33;
    b0=b[4];b1=b[5];b2=b[6];b3=b[7];
    out[4]=b0*a00+b1*a10+b2*a20+b3*a30;
    out[5]=b0*a01+b1*a11+b2*a21+b3*a31;
    out[6]=b0*a02+b1*a12+b2*a22+b3*a32;
    out[7]=b0*a03+b1*a13+b2*a23+b3*a33;
    b0=b[8];b1=b[9];b2=b[10];b3=b[11];
    out[8]=b0*a00+b1*a10+b2*a20+b3*a30;
    out[9]=b0*a01+b1*a11+b2*a21+b3*a31;
    out[10]=b0*a02+b1*a12+b2*a22+b3*a32;
    out[11]=b0*a03+b1*a13+b2*a23+b3*a33;
    b0=b[12];b1=b[13];b2=b[14];b3=b[15];
    out[12]=b0*a00+b1*a10+b2*a20+b3*a30;
    out[13]=b0*a01+b1*a11+b2*a21+b3*a31;
    out[14]=b0*a02+b1*a12+b2*a22+b3*a32;
    out[15]=b0*a03+b1*a13+b2*a23+b3*a33;
    return out;
  },

  identity(out) {
    out[0]=1;out[1]=0;out[2]=0;out[3]=0;
    out[4]=0;out[5]=1;out[6]=0;out[7]=0;
    out[8]=0;out[9]=0;out[10]=1;out[11]=0;
    out[12]=0;out[13]=0;out[14]=0;out[15]=1;
    return out;
  }
};

// ========== GLB 解析器 ==========
function parseGLB(arrayBuffer) {
  const dataView = new DataView(arrayBuffer);
  const magic = dataView.getUint32(0, true);
  if (magic !== 0x46546C67) throw new Error('Not a valid GLB file');

  let offset = 12;
  let jsonChunk = null;
  let binChunk = null;

  while (offset < arrayBuffer.byteLength) {
    const chunkLength = dataView.getUint32(offset, true);
    const chunkType = dataView.getUint32(offset + 4, true);
    const chunkData = arrayBuffer.slice(offset + 8, offset + 8 + chunkLength);

    if (chunkType === 0x4E4F534A) {
      const decoder = new TextDecoder('utf-8');
      jsonChunk = JSON.parse(decoder.decode(chunkData));
    } else if (chunkType === 0x004E4942) {
      binChunk = chunkData;
    }
    offset += 8 + chunkLength;
  }

  return { json: jsonChunk, bin: binChunk };
}

function extractMeshData(gltf, binBuffer) {
  const meshes = [];

  for (const mesh of (gltf.meshes || [])) {
    for (const primitive of mesh.primitives) {
      const meshData = {
        positions: null, normals: null, indices: null,
        colors: null, baseColor: null,
        texCoords: null, textureImageData: null, textureMimeType: null
      };

      if (primitive.attributes.POSITION !== undefined) {
        meshData.positions = getAccessorData(gltf, binBuffer, primitive.attributes.POSITION);
      }

      if (primitive.attributes.NORMAL !== undefined) {
        meshData.normals = getAccessorData(gltf, binBuffer, primitive.attributes.NORMAL);
      }

      // 顶点颜色
      if (primitive.attributes.COLOR_0 !== undefined) {
        meshData.colors = getAccessorData(gltf, binBuffer, primitive.attributes.COLOR_0);
        const colorAccessor = gltf.accessors[primitive.attributes.COLOR_0];
        meshData.colorComponents = colorAccessor.type === 'VEC4' ? 4 : 3;
      }

      // UV 坐标
      if (primitive.attributes.TEXCOORD_0 !== undefined) {
        meshData.texCoords = getAccessorData(gltf, binBuffer, primitive.attributes.TEXCOORD_0);
      }

      // 材质信息
      if (primitive.material !== undefined && gltf.materials) {
        const mat = gltf.materials[primitive.material];
        if (mat && mat.pbrMetallicRoughness) {
          if (mat.pbrMetallicRoughness.baseColorFactor) {
            meshData.baseColor = mat.pbrMetallicRoughness.baseColorFactor;
          }
          // 贴图纹理
          if (mat.pbrMetallicRoughness.baseColorTexture && gltf.textures) {
            var texIdx = mat.pbrMetallicRoughness.baseColorTexture.index;
            var tex = gltf.textures[texIdx];
            if (tex && gltf.images && gltf.images[tex.source]) {
              var img = gltf.images[tex.source];
              if (img.bufferView !== undefined) {
                var bv = gltf.bufferViews[img.bufferView];
                var off = bv.byteOffset || 0;
                var len = bv.byteLength;
                var src = new Uint8Array(binBuffer, off, len);
                var copy = new Uint8Array(len);
                copy.set(src);
                meshData.textureImageData = copy;
                meshData.textureMimeType = img.mimeType || 'image/png';
              }
            }
          }
        }
      }

      if (primitive.indices !== undefined) {
        meshData.indices = getAccessorData(gltf, binBuffer, primitive.indices);
      }

      // 包围盒
      if (meshData.positions) {
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        for (let i = 0; i < meshData.positions.length; i += 3) {
          minX = Math.min(minX, meshData.positions[i]);
          minY = Math.min(minY, meshData.positions[i+1]);
          minZ = Math.min(minZ, meshData.positions[i+2]);
          maxX = Math.max(maxX, meshData.positions[i]);
          maxY = Math.max(maxY, meshData.positions[i+1]);
          maxZ = Math.max(maxZ, meshData.positions[i+2]);
        }
        meshData.bounds = {
          min: [minX, minY, minZ],
          max: [maxX, maxY, maxZ],
          center: [(minX+maxX)/2, (minY+maxY)/2, (minZ+maxZ)/2],
          size: Math.max(maxX-minX, maxY-minY, maxZ-minZ)
        };
      }

      meshes.push(meshData);
    }
  }
  return meshes;
}

// ========== accessor 数据读取 ==========
function getAccessorData(gltf, binBuffer, accessorIndex) {
  const accessor = gltf.accessors[accessorIndex];
  const bufferView = gltf.bufferViews[accessor.bufferView];
  const offset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
  const count = accessor.count;

  const typeCounts = { SCALAR:1, VEC2:2, VEC3:3, VEC4:4, MAT2:4, MAT3:9, MAT4:16 };
  const typeCount = typeCounts[accessor.type] || 1;

  const TypedArrayMap = {
    5120: Int8Array, 5121: Uint8Array, 5122: Int16Array,
    5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array
  };
  const TypedArray = TypedArrayMap[accessor.componentType] || Float32Array;

  return new TypedArray(binBuffer, offset, count * typeCount);
}

// ========== WebGL 着色器（支持颜色） ==========
// u_colorMode: 0.0=默认色, 1.0=顶点色, 2.0=材质色
const VERT_SHADER = `
  attribute vec3 aPosition;
  attribute vec3 aNormal;
  attribute vec4 aColor;
  attribute vec2 aTexCoord;
  uniform mat4 uProjection;
  uniform mat4 uModelView;
  uniform mat4 uNormalMatrix;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec4 vColor;
  varying vec2 vTexCoord;
  void main() {
    vec4 pos = uModelView * vec4(aPosition, 1.0);
    vPosition = pos.xyz;
    vNormal = (uNormalMatrix * vec4(aNormal, 0.0)).xyz;
    vColor = aColor;
    vTexCoord = aTexCoord;
    gl_Position = uProjection * pos;
  }
`;

const FRAG_SHADER = `
  precision mediump float;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec4 vColor;
  varying vec2 vTexCoord;
  uniform vec4 uBaseColor;
  uniform float uColorMode;
  uniform sampler2D uTexture;
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir1 = normalize(vec3(1.0, 1.0, 1.0));
    vec3 lightDir2 = normalize(vec3(-0.5, 0.3, -0.8));
    vec3 lightDir3 = normalize(vec3(0.0, -1.0, 0.0));

    float diff1 = max(dot(normal, lightDir1), 0.0) * 0.6;
    float diff2 = max(dot(normal, lightDir2), 0.0) * 0.3;
    float diff3 = max(dot(normal, lightDir3), 0.0) * 0.15;
    float ambient = 0.25;
    float lighting = ambient + diff1 + diff2 + diff3;

    vec4 baseColor;
    if (uColorMode > 2.5) {
      baseColor = texture2D(uTexture, vTexCoord);
    } else if (uColorMode > 1.5) {
      baseColor = uBaseColor;
    } else if (uColorMode > 0.5) {
      baseColor = vColor;
    } else {
      baseColor = vec4(0.83, 0.65, 0.45, 1.0);
    }

    vec3 color = baseColor.rgb * lighting;

    vec3 viewDir = normalize(-vPosition);
    vec3 halfDir = normalize(lightDir1 + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), 32.0) * 0.3;
    color += vec3(spec);

    gl_FragColor = vec4(color, baseColor.a);
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl) {
  const vs = createShader(gl, gl.VERTEX_SHADER, VERT_SHADER);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAG_SHADER);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

module.exports = { Mat4, parseGLB, extractMeshData, createProgram };
