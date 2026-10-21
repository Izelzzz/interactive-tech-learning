# 部署说明

## 当前方案：Cloudflare Workers 静态资源

课程都是纯静态 HTML，`wrangler.jsonc` 把 `demos/` 目录作为站点根目录发布成一个只有静态资源的 Worker（`interactive-tech-learning`），不需要构建步骤，也没有服务端代码。

部署方式和博客（`izelzzzzz`）一致：Workers Builds 连接 GitHub 仓库，`main` 分支部署生产环境，其他分支各自得到一个 Preview URL。

| 路径 | 内容 |
| --- | --- |
| `/` | 课程目录（English） |
| `/index.zh-CN` | 课程目录（简体中文） |
| `/sql/`、`/sql/index.zh-CN` | 单节课程（其他课程同理） |

带 `.html` 的地址会 307 跳转到不带后缀的地址，页面里的相对链接不受影响。

## 首次配置（在 Cloudflare 控制台完成）

1. **Workers & Pages > Create > Import a repository**，选择 `Izelzzz/interactive-tech-learning`。
2. Builds 配置：
   - Project name：`interactive-tech-learning`（必须和 `wrangler.jsonc` 的 `name` 相同）
   - Production branch：`main`
   - Root directory：仓库根目录
   - Build command：留空
   - Deploy command：`npx wrangler deploy`
3. 部署完成后，打开 **Settings > Builds > Set up Worker Previews**，确认 Preview command 为 `npx wrangler preview`，选择 **Switch to Worker Previews**。之后每个非生产分支的推送都会创建或更新该分支的 Preview URL，PR 中会出现 `Workers Builds` 检查和预览链接。
4. **Settings > Domains & Routes > Add > Custom domain**，填写 `learn.izelzzz.com`。域名已经托管在 Cloudflare，DNS 记录和证书会自动创建。

内容是公开的，不需要配置 Cloudflare Access。

> 注意：如果博客 Worker 使用了 `*.izelzzz.com/*` 这样的通配路由，它会抢先接管 `learn.izelzzz.com`。博客目前只绑定自定义域名时没有这个问题；以后给博客加路由时只写具体的主机名。

Workers Builds 检测到 `package.json` 后会自动执行 `npm ci`，`wrangler` 版本由 `package-lock.json` 固定（`4.148.0`）。Playwright 只安装 npm 包，不会下载浏览器。

## 本地预览与手动部署

```bash
npm install
npm run dev        # wrangler dev，在 http://localhost:8787 用和线上相同的规则提供 demos/
npm run deploy     # 手动部署到生产（需要先 npx wrangler login）
```

日常不需要手动部署：推送到 `main` 即上线，推送到其他分支即得到预览。

## GitHub Actions 与 Cloudflare 检查

`.github/workflows/ci.yml` 继续负责测试（翻译同步、静态检查、浏览器冒烟测试），不负责部署。Cloudflare 的 `Workers Builds: interactive-tech-learning` 是独立的外部检查。

## 以后加后端（注册、学习记录）

做成可注册的学习平台时，在同一个 Worker 上扩展，不需要换域名或换平台：

```jsonc
{
  "main": "src/worker.ts",          // API 路由：/api/*
  "assets": {
    "directory": "./demos",
    "binding": "ASSETS",            // 其他路径交给静态资源
    "run_worker_first": ["/api/*"]
  },
  "d1_databases": [
    { "binding": "DB", "database_name": "learning", "database_id": "<生产库 ID>",
      "preview_database_id": "<预览库 ID>" }
  ]
}
```

- 用户、进度、笔记放 D1；预览环境必须使用单独的 D1 数据库，避免分支预览写入生产数据。
- 登录会话的密钥用 `npx wrangler secret put` 配置，生产和 Preview 分开设置，不写进仓库。
- 上传的文件可以放 R2，定时任务（例如定期整理学习记录）用 Cron Triggers。
