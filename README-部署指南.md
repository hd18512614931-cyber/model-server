# 静态资源同步指南

## A. 静态资源目录

`public/` 会通过 GitHub Actions 同步到微信云开发底层 COS：

- `public/model/`：GLB 3D 模型
- `public/knowledge/`：知识科普页图片和视频
- `public/layers/`：首页和分色展厅的分层图资源

## B. GitHub Actions 配置

仓库需要配置以下 GitHub Secrets：

- `TCLOUD_API_ID`：腾讯云 SecretId
- `TCLOUD_API_KEY`：腾讯云 SecretKey

推送到 `main` 后，`.github/workflows/sync-to-cos.yml` 会自动同步 `public/` 下的静态资源。

## C. 小程序引用方式

小程序端不要写临时 HTTPS 地址，统一使用微信云开发 FileID：

`cloud://cloudbase-d2ga3dspk593e200b.636c-cloudbase-d2ga3dspk593e200b-1424774211/<path>`

其中 `<path>` 与 `public/` 下的相对路径一致，例如：

- `public/model/house.glb` -> `model/house.glb`
- `public/knowledge/八仙过海图.jpg` -> `knowledge/八仙过海图.jpg`
- `public/layers/logo-demo/layer_0.png` -> `layers/logo-demo/layer_0.png`

## D. API 说明

`api/` 下的 3D 生成接口仍依赖火山方舟服务，不属于静态资源同步范围。API 部署和 `ARK_API_KEY` 配置需单独处理。

- 不要把 SecretId、SecretKey、ARK_API_KEY 写入代码。
- 如果 COS region 不是 `ap-shanghai`，同步 workflow 里的 `-r` 需要对应调整。
