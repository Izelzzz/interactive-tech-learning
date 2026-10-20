# interactive-tech-learning

交互式技术学习平台。课程固定；单元可交互；小白 / 进阶双版本讲解。

产品规格见 `docs/`。

## Demos

所有课程入口：[`demos/index.html`](demos/index.html)（English）· [`demos/index.zh-CN.html`](demos/index.zh-CN.html)（简体中文）。直接用浏览器打开即可，无需安装依赖。每一课都有英文版 `index.html` 和简体中文版 `index.zh-CN.html`，并支持小白 / 进阶切换。

1. [`demos/http-basics/`](demos/http-basics/index.html)：HTTP 请求全过程与 HTTP 方法（动画讲解 + 交互练习 + 小测验）。
2. [`demos/api-design/`](demos/api-design/index.html)：如何设计好的 API：URL 命名、状态码与错误格式、分页（offset vs cursor 动画演示）、兼容性变更判断。
3. [`demos/sql/`](demos/sql/index.html)：动手学 SQL：点选式查询构建、JOIN 连线可视化、GROUP BY 分组动画、查询的逻辑执行顺序；进阶包含 NULL 三值逻辑和 SQL 注入演示。
4. [`demos/database-design/`](demos/database-design/index.html)：数据库设计：规范化、关系建模（一对一 / 一对多 / 多对多）、索引（全表扫描 vs B-tree 动画）、事务（转账崩溃演示与并发丢失更新）。
5. [`demos/formal-verification/`](demos/formal-verification/index.html)：形式化验证：随机测试 vs 穷举检查、规约、模型检测（互斥协议的状态空间与反例轨迹）、循环不变式与证明义务。


## 开发

```bash
npm install                     # 安装 Playwright（仅用于测试）
npx playwright install chromium
npm test                        # 翻译同步检查 + 静态检查 + 浏览器冒烟测试
```

- **英文页面是唯一的源头。** 中文页面 `index.zh-CN.html` 由 `tools/i18n.py` 生成：它读取 `i18n/zh-CN/<课程>.body.html`（`<body>` 与 `<script>` 之间的页面结构）和 `i18n/zh-CN/<课程>.strings.json`（英文字符串 → 中文字符串），只替换文案，交互代码与英文版完全相同。
- 修改英文页面后运行 `python3 tools/i18n.py build`。如果某条英文字符串改了或删了，构建会列出过期的翻译；`python3 tools/i18n.py missing <课程>` 会列出尚未翻译的新字符串。翻译不能引入英文模板中没有的代码。
- `tests/static.mjs` 检查每个页面的脚本能否解析、相对链接是否有效；`tests/smoke.mjs` 在 1200px 和 390px 两种宽度、小白 / 进阶两种模式下加载每个页面，检查无报错、无横向滚动，并包含针对已修复 bug 的回归测试。
- CI（`.github/workflows/ci.yml`）在每个 PR 和 main 分支上运行上述检查。
