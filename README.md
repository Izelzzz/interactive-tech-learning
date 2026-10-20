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

翻译工具：`tools/i18n_extract.py` 和 `tools/i18n_build.py` 只替换页面文案和脚本中的字符串，交互代码保持不变。
