# AGENTS.md

本文件为在此仓库中工作的编码代理提供指引。

本仓库现在只发布《Slay the Spire 2》的静态资料站（Wiki）。浏览器里可玩的游戏本体（原 `packages/app`）已于 2026-10-11 下线并从仓库删除，站点根路径跳转到 `/wiki/`。

## 硬性规则

### 不要清掉玩家留在浏览器里的旧存档

游戏下线了，但玩家的存档还在各自浏览器里：站点域名下的 IndexedDB `sts2fs` 库、localStorage 的 `sts2fs:` 和 `sts2fs-j:` 键。丢了无法恢复。在这个站点上发布的任何代码都不要删除或改写它们。

`packages/wiki/public/sw.js` 用来接替游戏注册过的 Service Worker：它只清缓存、注销自己，不碰存档。修改时保持这一点。

`packages/core` 里的存档测试保留：`test/save.test.ts`，以及 `test/old-saves.test.ts` 和它读取的 `test/fixtures/saves-v*/`（从真实浏览器导出的旧存档）。这些样本不要修改或重新生成。

### 不要手改生成的代码

`packages/core/src/gen/` 由转译器生成。行为和原作不一致时，在 `tools/cs2ts`（转译器）、`packages/core/src/rt`（运行时）或 `packages/core/src/overrides.ts`（少量手写替换）里修，不要直接编辑 `gen/`。

### 使用范围

非官方学习项目，仅供学习使用。`assets/` 和 `packages/core/src/gen/` 来自《Slay the Spire 2》，版权归 Mega Crit 所有。

## 常用命令

需要 Node 20+ 和 pnpm。游戏资源和生成代码已在仓库里，不需要安装游戏。

```bash
pnpm install
pnpm build                       # 生成站点，产物在 packages/wiki/dist（Wiki 在其中的 wiki/）
pnpm -F @sts2/core test          # 规则层无头测试（Vitest）
pnpm -F @sts2/core exec vitest run test/save.test.ts          # 单个测试文件
pnpm -F @sts2/core exec vitest run test/save.test.ts -t "<用例名>"   # 单个用例
pnpm gen                         # 重新转译规则层（需要 ref/decompiled 和 .NET 9，见 docs/development.md）
node tools/check-refs.mjs        # 手写代码引用的规则层类 / 重载 / 模型 Id / 本地化键是否还在（`G` 是 any，tsc 查不出）
python3 -m http.server -d packages/wiki/dist 8080   # 本地预览 http://127.0.0.1:8080/
```

改动后交付或提交前，跑 `pnpm -F @sts2/core test` 和 `pnpm build`。纯文档改动只要审查 diff，确认不改变运行行为即可。

## 架构

规则层不是手写的，而是把原作（v0.98.3）反编译出的 C# 用 Roslyn 转译器整体转成 TypeScript。手写部分是让它跑起来的运行时，以及在构建时用它生成页面的 Wiki。

```
游戏安装包
  ├─ tools/extract.py、audio.py、scenes.py …  ──▶  assets/                  美术、文本等游戏资源
  └─ tools/decompile.sh  ──▶  ref/decompiled
                                 └─ tools/cs2ts（Roslyn） ──▶  packages/core/src/gen   转译出的规则层

packages/core   运行时：C#/.NET 语义（BCL、集合、LINQ、Task、JSON）与 Godot API 的 TypeScript 实现
packages/wiki   资料站：构建时无头启动规则层，生成中英文静态页面
```

- **`packages/core/src/gen`**：`sts2.ts` 是规则层，`stubs.ts` 是 Godot 节点等外部类型的桩。外部类型统一走 `$.ext("全名")`。C# 的扩展方法在生成代码里是静态方法：写 `G.GodotTreeExtensions.AddChildSafely(parent, child)`，不要写 `parent.AddChildSafely(child)`。
- **`packages/core/src/rt`**：手写运行时。**`packages/core/src/shell.ts`**：`NGame` 的非界面部分（初始化、开新局、继续 / 放弃存档），测试用。
- **`packages/wiki`**：`src/build.ts` 像测试一样无头启动规则层（测试模式，`TestMode.IsOn`），文本走原作的格式化流程，页面写入 `dist/wiki/`。它会把页面和 `wiki.css` 引用到的 `assets/` 文件复制到 `dist/assets/`，再把 `public/` 原样复制到站点根目录：`index.html` 负责跳转到 `wiki/`，另有 `sw.js` 和 `_headers`。

`ref/` 和 `_work/` 不入库；`assets/` 和 `packages/core/src/gen/` 入库。游戏本体当时的设计与实施记录见 `docs/sts2-web-port-plan.md`。

## 提交

提交信息用 Conventional Commits，scope 用 `wiki` / `core` / `tools` / `assets`，例如 `fix(wiki): …`。
