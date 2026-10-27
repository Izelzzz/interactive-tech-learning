// Everything listed on the course index. Both index pages (English and Chinese) are built
// from this file, so adding a page here is all it takes to put it on the index.
// An entry without `en` only appears on the Chinese index.

type Text = { title: string; blurb: string };

export interface Lesson {
  /** Folder under demos/; the English page is index.html, the Chinese one index.zh-CN.html. */
  slug: string;
  en: Text;
  zh: Text;
}

export interface Teardown {
  /** Site path of the page, relative to the index. */
  href: string;
  en?: Text;
  zh: Text;
}

export const lessons: Lesson[] = [
  {
    slug: 'http-basics',
    en: { title: 'HTTP, step by step', blurb: 'Follow a request from DNS to the rendered page, try every HTTP method against a mock API, and test yourself.' },
    zh: { title: '一步步看懂 HTTP', blurb: '跟着一个请求从 DNS 走到页面渲染完成，对着模拟 API 试遍每个 HTTP 方法，再做个小测验。' },
  },
  {
    slug: 'api-design',
    en: { title: 'Designing good APIs', blurb: 'Fix badly named endpoints, choose the right status codes, see why cursor pagination wins, and learn which changes break clients.' },
    zh: { title: '设计好用的 API', blurb: '修复命名糟糕的端点，选出正确的状态码，看清游标分页为什么更好，并学会判断哪些变更会破坏客户端。' },
  },
  {
    slug: 'sql',
    en: { title: 'SQL, hands on', blurb: 'Build queries by clicking, watch JOINs match rows and GROUP BY fill buckets, and learn the order a query really runs in.' },
    zh: { title: '动手学 SQL', blurb: '点一点就能拼出查询，看 JOIN 如何匹配行、GROUP BY 如何分组，并弄清一条查询真正的执行顺序。' },
  },
  {
    slug: 'database-design',
    en: { title: 'Designing a database', blurb: 'Break a spreadsheet-style table and normalise it, model relationships, race a full scan against an index, and crash a bank transfer with and without a transaction.' },
    zh: { title: '设计数据库', blurb: '弄坏一张“大表”再把它规范化，为关系建模，让全表扫描和索引赛跑，并在有无事务的情况下让一笔转账中途崩溃。' },
  },
  {
    slug: 'formal-verification',
    en: { title: 'Formal verification', blurb: 'See why tests miss rare bugs, write specifications, model-check a locking protocol state by state, and prove a loop correct with an invariant.' },
    zh: { title: '形式化验证', blurb: '看看测试为什么会漏掉罕见的 bug，动手写规约，逐个状态地对加锁协议做模型检测，并用循环不变式证明循环正确。' },
  },
];

export const teardowns: Teardown[] = [
  {
    href: 'repos/dify/',
    zh: { title: 'Dify：AI 工作流如何真正落地', blurb: '画布为什么这么设计，哪些环节用固定流程、哪些交给 agent，知识库、模型、工具怎么分层，原型怎么走向生产，以及 issue 里的真实痛点。' },
  },
  {
    href: 'repos/openai-agents/',
    zh: { title: 'OpenAI Agents SDK：agent 该怎么设计', blurb: '模型、指令、工具、交接、约束、观测为什么这样拆、怎么串起来，一张 agent 产品架构图，以及什么时候不该做成 agent。' },
  },
  {
    href: 'repos/autoresearch/',
    zh: { title: 'autoresearch + nanochat：理解智能体式产品', blurb: '从“人操作工具”到“人定义目标和评价函数、agent 自己循环”：目标、权限、环境、反馈指标和人工介入点该怎么设计。' },
  },
  {
    href: 'repos/llm-wiki/',
    zh: { title: 'LLM Wiki：让知识被编译和积累', blurb: 'RAG 不等于知识管理、File over App、从提供功能到提供规范，用一个编译模拟器看知识怎样被摄入、合并、回写和体检。' },
  },
];
