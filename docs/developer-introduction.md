# 小红书卡片生成器：开发者视角的技术说明

## 项目定位

这个工具的目标是把 Markdown 技术文章转换成适合小红书发布的竖版图文卡片。它不是一个 AI 改写器，而是一个可本地运行、可开源维护的 Markdown 到卡片图片生成工作流。

核心链路是：

```text
Markdown
-> 结构化解析
-> 卡片分页规划
-> HTML/CSS 渲染
-> 本地 Chrome/Edge 截图
-> PNG 输出
```

当前版本默认不调用 LLM。内容切分依赖确定性的 Markdown 解析和分页规则，因此结果更可控，也更适合开源用户在本地离线使用。

## 技术演进

最初的原型是为一篇 Event Loop 技术文章手工生成卡片。那一版的内容和排版都写在脚本里：

```text
手工提炼文章内容
-> 写成 slides 数组
-> HTML/CSS 生成卡片页面
-> Playwright 截图导出 PNG
```

这个原型证明了两个关键点：

- 技术文章适合先转成卡片中间结构，再渲染。
- HTML/CSS 是高效的卡片排版层，截图导出可以得到稳定 PNG。

随后项目抽象出通用核心：

```text
src/
  markdown/   # Markdown 解析
  planner/    # 卡片分页
  render/     # HTML 渲染
  themes/     # 主题系统
  export/     # Chrome 截图导出
  workflow/   # CLI 工作流
  adapters/   # Typora 等来源适配
```

个人定制流程保留在项目旁边，不进入通用核心：

```text
articles/
  xhs-cardgen/                  # 可开源的通用工具
  event-loop-xiaohongshu-cards/ # 个人文章定制产物
```

这样既保留了真实样例，又避免把一次性的内容策略污染开源仓库。

## 中间格式

项目内部稳定的中间格式是 `slides.json`。

示例：

```json
{
  "schemaVersion": 1,
  "title": "一次性讲清楚事件循环机制",
  "brand": "Event Loop",
  "width": 1242,
  "height": 1660,
  "slides": [
    {
      "kicker": "Overview",
      "title": "一次性讲清楚事件循环机制",
      "footer": "01 / 08",
      "blocks": [
        { "type": "paragraph", "text": "JavaScript 是单线程语言..." },
        { "type": "code", "lang": "js", "source": "console.log('hello')" }
      ]
    }
  ]
}
```

这个中间层有三个好处：

- Markdown 解析器、未来 AI 改写器、手动编辑器都可以输出同一格式。
- 渲染器只关心卡片结构，不关心内容来源。
- 桌面端、CLI、批处理工作流可以共用同一个核心。

## Markdown 解析

当前解析器支持常见 Markdown 元素：

- 标题
- 段落
- 无序列表
- 有序列表
- 引用
- 代码块
- 表格
- 图片
- YAML frontmatter 清理

解析器并不试图完整实现 CommonMark，而是围绕“卡片生成”做足够稳定的结构提取。复杂来源可以通过 adapter 预处理。

## 分页策略

分页器的目标不是追求最少页数，而是在可读性、信息密度和版面稳定之间取得平衡。

核心参数：

- `maxCharactersPerSlide`：每张卡片的大致内容密度。
- `maxBlocksPerSlide`：每张卡片最多容纳多少内容块。

内容块包括：

- 段落
- 列表
- 代码块
- 表格
- 引用
- 图片

分页前会先拆分过大的内容块：

- 长段落按句子拆分。
- 长引用按句子拆分。
- 长列表按条目拆分。
- 长代码块按行数拆分，但默认不会过度拆分。
- 长表格按行数拆分。

后续曾经尝试过更激进的自动合并和自动溢出修复，但实践中发现算法越复杂，可解释性越差，也更容易让用户输入的“每页字数/块数”失效。因此当前版本回到更明确的策略：

```text
预览阶段：快速规则分页
导出阶段：一次真实溢出检测
发现问题：报告页码，让用户手动调整参数
```

## 渲染系统

渲染器把 `slides.json` 转成 HTML。

每张卡片是一个 `.card` 元素，固定尺寸：

```text
1242 x 1660
```

主题系统通过 `theme-registry` 注册，目前内置：

- 暖色技术风
- 清爽白底
- 深色代码风
- 薄荷杂志风

主题基于统一的 CSS 工厂生成，避免每个主题复制大量样式。新增主题时主要改 palette。

## PNG 导出

本地应用采用轻量方案：

```text
Bun 本地 HTTP 服务
-> 浏览器 UI
-> server 调用系统 Chrome/Edge headless
-> DevTools Protocol 截取每张 .card
-> 写入 cards/card-xx.png
```

这个方案没有使用 Electron，因此包体更小，结构更简单。代价是用户电脑需要安装 Chrome、Edge 或 Chromium。

为什么不是浏览器端下载？

浏览器端下载会导致多张图片逐张保存，体验不够稳定。现在导出由本地 server 完成，文件直接写入输出目录，更接近桌面工具体验。

## 本地应用

本地应用位于：

```text
apps/local/
  server.ts
  index.html
```

运行方式：

```bash
npm run local:dev
```

打包方式：

```bash
npm run local:build
```

产物：

```text
dist-local/
  XHS Cardgen-mac.zip
  XHS Cardgen-win.zip
```

macOS 包是一个 `.app` 外壳，Windows 包是 portable zip。两者都会启动本地 server 并打开浏览器界面。

## 平台限制

小红书单篇图文最多发布 18 张图片。工具会在预览、保存和导出阶段提示是否超过 18 张。超过时用户可以：

- 调大每页字数
- 调大每页块数
- 将文章拆成多篇发布

## 后续方向

适合继续增强的方向：

- 增加更多主题。
- 支持 contact sheet 和 zip 输出。
- 增加配置文件。
- 增加更完善的测试。
- 把 AI 改写做成可选 adapter，而不是默认核心能力。
- 增加手动编辑 `slides.json` 的可视化界面。

项目的设计原则是：核心保持可解释、可离线、可维护；高级能力通过 adapter 和工作流扩展。
