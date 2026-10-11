# 部署文档

本项目是纯静态页面，可以通过 Docker 或 Cloudflare Workers 部署。`pnpm build` 的产物在 `packages/wiki/dist`：`/wiki/` 资料站（约 3000 个页面）和它用到的资源，根路径跳转到 `/wiki/`，不需要额外配置。以下命令均在仓库根目录执行；本地运行和开发环境准备见[开发文档](development.md)。

## Docker

在仓库根目录手动构建并运行（Node 构建，Nginx 提供静态页面）：

```bash
docker build -t sts2-web:local .
docker run --rm -p 8080:80 sts2-web:local
# 打开 http://localhost:8080/
```

### 手动构建并推送 Docker Hub

仓库 Settings → Secrets and variables → Actions 中配置：

| 类型 | 名称 | 值 |
|---|---|---|
| Variable | `DOCKERHUB_USERNAME` | Docker Hub 登录用户名 |
| Secret | `DOCKERHUB_TOKEN` | 有目标仓库写入权限的 Docker Hub access token |
| Variable（可选） | `DOCKERHUB_IMAGE` | 完整镜像名，如 `moonrailgun/sts2-web`；默认 `<DOCKERHUB_USERNAME>/sts2-web` |

确保 Docker Hub 上已创建目标仓库，且工作流文件已合入 GitHub 默认分支。在 Actions → **Build and push Docker image** → **Run workflow** 手动启动；`ref` 可填分支、标签或提交 SHA，留空则构建所选工作流版本。目标版本需要包含 Docker 构建文件。

工作流仅手动触发，不因 push、PR 或定时任务运行。它构建 `linux/amd64` 镜像，以实际检出提交的完整哈希发布为 `<镜像名>:sha-<40 位 SHA>`，不发布 `latest`。第三方 Actions 同样固定到完整提交 SHA。

```bash
docker run --rm -p 8080:80 <镜像名>:sha-<40位提交SHA>
```

## Cloudflare

纯静态部署到 Cloudflare Workers（只有静态资源，没有 Worker 脚本，配置见 `wrangler.jsonc`）：

```bash
pnpm build
npx wrangler deploy
```

推送到 `main` 时由 `.github/workflows/cloudflare.yml` 自动部署（只在构建内容有变化时触发，也可以在 Actions 里手动运行）。仓库 Settings → Secrets and variables → Actions 中配置：

| 类型 | 名称 | 值 |
|---|---|---|
| Secret | `CLOUDFLARE_API_TOKEN` | Cloudflare API 令牌（模板 **编辑 Cloudflare Workers**，限定到所用账户和域名） |
| Variable | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID |

响应头在 `packages/wiki/public/_headers`。`wrangler.jsonc` 里的 `routes` 是本仓库站点的域名，自行部署时换成自己的或删掉。
