# 部署指南

## A. Vercel 部署步骤

1. 注册 Vercel（vercel.com），用 GitHub 账号登录
2. 在 GitHub 新建仓库（如 `model-server`），把 `model-server/` 目录推送上去：
   ```bash
   cd model-server
   git init
   git add .
   git commit -m "init model-server"
   git remote add origin https://github.com/你的用户名/model-server.git
   git push -u origin main
   ```
3. 在 Vercel 控制台点击 **Import Project**，选择刚才的仓库，Framework 选 **Other**
4. 进入项目 **Settings → Environment Variables**，添加：
   - Key: `ARK_API_KEY`
   - Value: 你的火山方舟 API Key（去 [火山方舟控制台](https://console.volcengine.com/ark) 获取）
5. 部署完成后会得到域名，如 `https://model-server-xxx.vercel.app`
6. 把域名替换到小程序 `app.js` 的 `serverBase` 中

## B. 上传 .glb 模型文件

1. 把 `.glb` 文件放到 `model-server/public/models/` 目录
2. 文件名不要有中文和空格（如 `bread.glb`、`fulushou.glb`）
3. `git add . && git commit -m "add models" && git push`，Vercel 自动部署
4. 访问 `https://你的域名.vercel.app/models/bread.glb` 验证是否能下载

## C. 测试 Seed3D API

部署完成后，用 curl 测试：

```bash
curl -X POST https://你的域名.vercel.app/api/generate-3d \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://ark-project.tos-cn-beijing.volces.com/doc_image/i23d_flower.jpeg"}'
```

应该返回：`{ "success": true, "taskId": "xxx", "status": "queued" }`

然后查询任务状态：

```bash
curl "https://你的域名.vercel.app/api/task-status?taskId=上面返回的taskId"
```

## D. 小程序域名白名单

开发阶段：在微信开发者工具中勾选「不校验合法域名」即可。

上线前：在微信公众平台后台 → 开发管理 → 服务器域名 → request 合法域名中添加：
- `https://你的域名.vercel.app`

## 注意事项

- API Key 只存在 Vercel 环境变量中，代码里通过 `process.env.ARK_API_KEY` 读取，绝不硬编码
- Seed3D 生成的文件格式用 glb（不是 obj），因为小程序 WebGL 查看器用的是 glb
- 如果 Seed3D 返回的 content 结构和代码中解析的不一致，查看 `task-status` 接口返回的 `_rawContent` 字段调试
