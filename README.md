# interactive-tech-learning

交互式技术学习。第一批是一门 HTTP 课、一个完整单元「一次 HTTP 请求」：可在浏览器走正常路径，也可走故障路径并跳过某一坑。

产品规格：`docs/2026-10-18-http-course-from-scratch/产品规格.md`  
技术规格：`docs/2026-10-18-http-course-from-scratch/技术规格.md`

## 本地打开

```bash
npm install
npm run dev
```

终端会打印本地地址（默认 `http://127.0.0.1:5173/`）。用浏览器打开后，从目录进入「一次 HTTP 请求」。

- 顶栏切换「小白 / 专业」。
- 正常路径：DNS → TCP → TLS → 组包 → 响应 → 结束回放。组包需 Method `GET`、Path `/`、Host `example.com`。
- 舞台底部的「进入故障路径」进入故障路径。坑上可以「重试」修复，也可以「跳过」。跳过组包坑后进入响应。

学习进度和完课结果写在浏览器本机，没有服务端。

## 检查

```bash
npm test
npm run lint
npm run typecheck
npm run build
```
