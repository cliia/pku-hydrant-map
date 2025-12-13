# PKU Hydrant Map

静态只读版：在北大静态底图上展示消防栓位置，支持缩放与大图预览，部署到 GitHub Pages。

## 功能
- Leaflet CRS.Simple + 静态底图 `pku-map.png`（3608x2568）。
- 缩放语义显示：低倍显示红色图钉，高倍显示缩略图卡片；点击标点弹出大图预览。
- 纯前端只读，不包含编辑/上传/删除。

## 目录结构（关键）
- `client/` 前端（React + Vite + React-Leaflet + Tailwind）。
- `server/` 仅用于本地数据/图片来源（SQLite + uploads），静态部署时不会运行。
- `scripts/migrate-to-static.js` 导出 SQLite 数据为 `client/public/data.json` 并复制 `uploads` 到 `client/public/uploads/`。
- `client/public/` 静态资源目录：`pku-map.png`、`data.json`、`uploads/`。

## 环境与安装
使用 pixi + pnpm：
```bash
# 安装前端依赖
pixi run setup-client
```

（若需本地有 server/node_modules 以便迁移脚本读取 better-sqlite3，确保之前 `server` 也安装过依赖。）

## 数据迁移到静态
从本地 SQLite + uploads 导出到前端 public：
```bash
node scripts/migrate-to-static.js
```
输出：
- `client/public/data.json`
- `client/public/uploads/`（复制根目录 `uploads/` 的图片）

注意：迁移脚本默认读取 `server/hydrants.db`，并把图片路径改写为 `/uploads/<filename>`。

## 本地开发
```bash
# 在 client 下启动开发服
pnpm --dir client dev
# 或
pixi run start   # 若之前仍保留后端，这会同时跑 server+client；只读版可直接 pnpm dev
```
访问 http://localhost:5173。

## 构建（会自动迁移数据）
```bash
pixi run build
# 等价于：pnpm --dir client run build
# build 脚本内部会执行 node ../scripts/migrate-to-static.js 再 vite build
```
产物在 `client/dist/`。

## GitHub Pages 部署
1. 确认 `client/vite.config.ts` 的 `base` 已设置为 `/<仓库名>/`，例如：`/pku-hydrant-map/`。
2. 运行部署：
```bash
pixi run pnpm --dir client run deploy
```
这会先迁移数据，再 `vite build`，最后用 `gh-pages` 将 `dist` 发布到 `gh-pages` 分支。
3. 在 GitHub 仓库 Settings → Pages 选择 `gh-pages` 分支作为来源。
