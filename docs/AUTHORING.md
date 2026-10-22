# 写新页面

新页面写成 `src/pages/` 下的 MDX 文件：正文是 Markdown，交互用 `src/components/` 里的组件，样式和导航由版式统一提供。不要再手写整页 HTML。

所有组件的最小例子都在 [`src/pages/components.mdx`](../src/pages/components.mdx)（线上地址 `/components/`），照着填数据即可。

## 文件骨架

`src/pages/repos/<名字>/index.mdx` 会生成 `/repos/<名字>/`。

```mdx
---
layout: ../../../layouts/Article.astro
title: 页面标题
description: 一句话描述（用于搜索结果）
lede: 标题下的一段导语
---
import Callout from '../../../components/Callout.astro';
import Source from '../../../components/Source.astro';
import Simulator from '../../../components/Simulator.astro';

## 一、第一章标题

<Callout type="结论">一句话结论。</Callout>

正文……<Source href="https://github.com/owner/repo/blob/<sha>/path#L10-L20" />
```

- 每个 `##` 是一章，顶部的章节导航自动生成；`###` 是章内小标题。
- 只 import 用到的组件。路径层级按文件位置调整（`src/pages/repos/x/index.mdx` 是三层 `../`）。
- 课程目录（`demos/index.zh-CN.html`）里加一张卡片链接到新页面。

## 组件一览

| 组件 | 用途 | 主要参数 |
| --- | --- | --- |
| `Callout` | 结论、要点、推测、建议、注意 | `type`，内容写在标签中间 |
| `Source` | 论断旁的证据链接 | `href`，`label`（默认“源码”） |
| `Simulator` | 一步步播放一个流程，可切换场景 | `nodes`、`edges`、`scenarios`（见下） |
| `Diagram` | 可点击的分层架构图 | `layers`，可选 `side`（贯穿各层的一列） |
| `Quiz` | 测验；`score={false}` 时是场景判断器 | `questions: [{ q, options, answer, explain }]` |
| `Advisor` | 答几道题后给出推荐档位 | `questions`（选项带分数）、`tiers` |
| `Checklist` | 可勾选清单，可复制为 Markdown | `items: [{ label, detail }]` |
| `CopyBlock` | 带复制按钮的文本（规范文件、提示词） | `title`、`text` |
| `LineChart` | 拖动滑块看几条曲线怎么拉开差距 | `series: [{ label, points }]`、`xLabel`、`yLabel` |

### Simulator 的数据

- `nodes: [{ id, label, x, y }]`：坐标在 `width × height`（默认 900 × 260）的画布里；手机上自动改成节点列表。不画图就不传 `nodes`。
- `edges: [['a', 'b'], …]`：箭头。步骤从 a 走到 b 时这条边会高亮。
- `scenarios: [{ id, label, steps }]`：每个场景一串步骤，第一个是默认场景。
- 一步：`{ at, status, say, log, set, files }`
  - `at`：当前节点；`status` 为 `run`（默认）、`ok`、`fail`、`wait`、`skip`。
  - `say`：这一步的讲解，显示在图下方。
  - `log`：追加一行日志。
  - `set: { 键: 值 }`：更新状态面板，值为 `null` 表示删除。
  - `files: { 路径: 内容 }`：更新文件面板，适合演示“文件一步步生成”，值为 `null` 表示删除。

## 写作要求

- 全部简体中文；代码标识符、文件路径、专有名词可以保留英文，第一次出现配中文解释。
- 从产品设计视角写：为什么这样设计、解决谁的什么问题、取舍和替代方案。源码只当证据，用 `Source` 链接，不逐行讲代码。
- 每章：一句话结论 → 问题背景 → 洞察（几个 `###`）→ 例子 → 取舍 → 要点小结。
- 不是来自原文或源码的判断，用 `<Callout type="推测">` 或 `type="建议"` 标出。
- 不能加载外部资源（站点 CSP 只允许同源）。外部链接可以。
- 写完运行 `npm test`（会先构建）。本地预览用 `npm run dev`。
