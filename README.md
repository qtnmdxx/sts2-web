<div align="center">

# sts2-web

**《Slay the Spire 2》中英文资料站**

收录卡牌、遗物、药水、能力、关键词、角色、怪物、遭遇战和事件。
数据来自原作（v0.98.3）的规则代码：转译成 TypeScript 后在构建时运行，描述里的数值和游戏里一致。纯静态页面。

[本地运行](#本地运行) · [部署文档](docs/deployment.md) · [开发文档](docs/development.md)

</div>

> [!WARNING]
> **因为版权问题，本项目已改为 Wiki 站。** 之前在浏览器里运行的游戏本体已于 2026 年 10 月 11 日下线，并已从仓库删除。

> [!IMPORTANT]
> 这是一个非官方的学习项目，仅供学习使用，与 Mega Crit 无关。
> 《Slay the Spire 2》及其美术、文本的版权归 Mega Crit 所有。喜欢这个游戏请[购买正版](https://store.steampowered.com/app/2868840/Slay_the_Spire_2/)。

## 本地运行

需要 Node 20+ 和 pnpm，不需要安装游戏。

```bash
git clone https://github.com/moonrailgun/sts2-web.git
cd sts2-web
pnpm install
pnpm build                                          # 产物在 packages/wiki/dist
python3 -m http.server -d packages/wiki/dist 8080   # http://127.0.0.1:8080/
```

测试、工作原理以及如何从游戏包重新生成资源，见[开发文档](docs/development.md)。

## 部署

Docker、Docker Hub 镜像发布和 Cloudflare Workers 的部署步骤见[部署文档](docs/deployment.md)。

## 声明

本项目仅供学习使用，不得用于商业用途。仓库中的游戏资源（`assets/`）和转译生成的规则层（`packages/core/src/gen/`）来自《Slay the Spire 2》，版权归 Mega Crit 所有；如权利人认为不妥，请提 issue，会及时处理。
