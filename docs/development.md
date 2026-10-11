# 开发文档

游戏本体当时的设计思路与实施记录见 [移植方案](sts2-web-port-plan.md)，这里只讲怎么构建、怎么测、怎么重新生成。

## 常用命令

需要 Node 20+ 和 pnpm。构建所需的游戏资源和生成代码已经在仓库里，不需要安装游戏。

```bash
pnpm install
pnpm build                       # 生成站点，产物在 packages/wiki/dist（Wiki 在其中的 wiki/）
pnpm -F @sts2/core test          # 规则层无头测试
python3 -m http.server -d packages/wiki/dist 8080   # 本地预览 http://127.0.0.1:8080/
```

## Wiki

`packages/wiki` 生成 `/wiki/` 下的资料站：构建时像核心测试一样无头启动规则层，用原作的格式化流程算出中英文描述，每个条目写成一个静态页面（`/wiki/{zhs|eng}/{分类}/{条目}/`），另有 `/wiki/sitemap.xml`。页面通过 `<base>` 以相对路径引用站点根下的 `assets/`，构建时只把页面和 `wiki.css` 用到的文件复制进产物。

- `packages/wiki/public/` 原样复制到站点根目录：`index.html` 把根路径跳转到 `wiki/`；`sw.js` 注销游戏留下的 Service Worker 并清掉它的缓存，不碰玩家存档；`_headers` 是 Cloudflare 的响应头。
- sitemap 里的绝对地址取环境变量 `WIKI_ORIGIN`，默认 `https://sts2.moonrailgun.com`。
- 构建日志会列出格式化失败、回退到原始本地化文本的条目（多是依赖对局状态的事件文本）；某一分类数量明显偏少时构建失败。

## 工作原理

```
游戏安装包
  ├─ tools/extract.py、audio.py、scenes.py …  ──▶  assets/                  美术、文本等游戏资源
  └─ tools/decompile.sh  ──▶  ref/decompiled
                                 └─ tools/cs2ts（Roslyn） ──▶  packages/core/src/gen   转译出的规则层

packages/core   运行时：C#/.NET 语义（BCL、集合、LINQ、Task、JSON）与 Godot API 的 TypeScript 实现
packages/wiki   资料站：构建时无头启动规则层，生成中英文静态页面
```

| 目录 | 内容 |
|---|---|
| `packages/core` | 转译出的规则层（`src/gen`）和让它跑起来的运行时（`src/rt`），附无头测试 |
| `packages/wiki` | 资料站的生成脚本、模板和样式 |
| `tools/cs2ts` | C# → TypeScript 转译器 |
| `tools/*.py` | 资源提取：Godot 资源包、FMOD 音频、Spine 索引、场景与着色器转换 |
| `assets` | 提取并压缩后的游戏资源 |
| `docs` | 文档 |

## 从游戏包重新生成

只有在更新游戏版本或修改提取、转译工具时才需要。前提：macOS，已安装 `/Applications/SlayTheSpire2.app`。

```bash
# 1. 工具链
brew install ffmpeg vgmstream uv
curl -sSL https://dot.net/v1/dotnet-install.sh | bash -s -- --channel 9.0 --install-dir ~/.dotnet
~/.dotnet/dotnet tool install --global ilspycmd
uv venv tools/.venv && uv pip install --python tools/.venv/bin/python pillow fonttools brotli zstandard

# 2. 从游戏包提取资源与参考文件（约 3 分钟）→ assets/、ref/godot、ref/dotnet
tools/.venv/bin/python tools/extract.py
# 音频（assets/audio）只有已删除的游戏本体用过，Wiki 和测试都不需要，可以跳过下面三步
tools/.venv/bin/python tools/audio.py              # FMOD → Opus + 事件数据 assets/audio/events.json（约 5 分钟）
tools/.venv/bin/python tools/audio_index.py
tools/.venv/bin/python tools/audio_mp3.py          # 追加 MP3 版本

# 3. 反编译 sts2.dll 与 SmartFormat.dll → ref/decompiled、ref/smartformat
tools/decompile.sh

# 4. 生成索引与场景
tools/.venv/bin/python tools/spine_index.py
tools/.venv/bin/python tools/scenes.py

# 5. 转译规则层 → packages/core/src/gen
pnpm gen
```
