# 沉浸式语言学习平台 - 最优免费技术栈

## 一、技术选型总览

| 层级 | 推荐技术 | 理由 |
|------|---------|------|
| **前端框架** | React + Next.js | 生态丰富、SEO友好、Server Components优化性能 |
| **UI组件库** | shadcn/ui + Tailwind CSS | 免费开源、现代化设计、按需加载 |
| **后端框架** | Next.js API Routes | 前后端一体化，无需单独部署后端服务 |
| **数据库** | PostgreSQL (Supabase / Neon) | 免费额度充足，支持JSON、全文检索 |
| **ORM** | Prisma | 免费开源，类型安全，开发体验好 |
| **认证** | NextAuth.js | 开源免费，支持多种登录方式 |
| **文件存储** | Cloudflare R2 / Supabase Storage | 免费额度大，无流量费 |
| **Excel解析** | xlsx (SheetJS) | 免费开源，功能强大 |
| **语音TTS** | Web Speech API + Coqui TTS | 浏览器原生免费，Coqui开源可自部署 |
| **部署** | Vercel | 前端/后端全免费部署，CDN加速 |

---

## 二、详细技术方案

### 1. 前端技术栈

```
React 18 + Next.js 14 (App Router)
├── Tailwind CSS          # 样式框架
├── shadcn/ui             # UI组件（基于Radix UI）
├── Framer Motion         # 动画效果
├── Zustand               # 状态管理（轻量免费）
├── React Query           # 服务端状态管理
├── @xlsx/xlsx            # Excel解析
├── react-pdf             # PDF阅读（如需）
└── @dnd-kit              # 拖拽排序（连词成句）
```

**为什么选 Next.js？**
- 前后端同构，减少部署复杂度
- API Routes 可替代独立后端
- Vercel 免费层足够中小型项目
- SSR/SSG 对SEO友好

### 2. 后端技术栈

```
Next.js API Routes (Serverless)
├── @prisma/client        # 数据库ORM
├── next-auth             # 用户认证
├── bcryptjs              # 密码加密
├── zod                   # 数据验证
├── uuid                  # 生成唯一ID
└── cors                  # 跨域处理
```

**数据库：PostgreSQL 推荐**

| 供应商 | 免费额度 | 适合场景 |
|--------|---------|---------|
| **Neon** | 512MB存储，月度免费 | 个人项目/初创 |
| **Supabase** | 500MB/500MB带宽 | 需要实时订阅功能 |
| **Railway** | $5/月 | 需要更多计算资源 |

> 推荐 **Neon**：纯Serverless，存储免费额度足够，学习曲线低

### 3. 数据存储架构

```
PostgreSQL 表结构设计（核心）:
├── users                 # 用户表
├── books                # 书本表
├── chapters             # 章节表
├── sub_chapters         # 子章节表
├── cards                # 卡片内容（词汇/句型/语料）
├── user_progress         # 用户学习进度
├── user_reviews          # SRS复习记录（艾宾浩斯）
├── favorites            # 收藏/生词本
├── comments              # 评论
├── annotations           # 划线批注
└── achievements          # 成就记录
```

### 4. Excel 导入系统

```
xlsx (SheetJS) 解析流程:
1. 管理员上传 .xlsx 文件
2. 前端/后端解析Excel内容
3. 校验格式（列名必填、数据类型）
4. 为每行生成 UUID（防止数据丢失）
5. 批量插入/更新数据库
6. 返回导入结果（成功/失败行号）
```

**Excel格式约定**：
详细格式规范见 [EXCEL_FORMAT_SPEC.md](./EXCEL_FORMAT_SPEC.md)

> **简要说明**：
> - 词汇模块（001口语/写作/阅读词汇）：5列格式（单词/短语、中文释义、用法说明、英文例句、中文例句）
> - 句型模块（002写作句型）：5列格式（英文句型模板、中文句型模板、用法说明、英文例句、中文例句）
> - 语料模块（003口语语料）：6列格式（问题、正式回答、正式中文、口语回答、口语中文、语言点分析）

### 5. 语音播放方案

```
方案A: 浏览器原生（免费）
├── Web Speech API (speechSynthesis)
├── 优点：无需后端，完全免费
└── 缺点：音质一般，音色有限

方案B: 免费TTS API
├── Microsoft Azure (首月免费$200)
├── Google Cloud (首月免费$300)
├── 优点：音质好，多音色可选
└── 缺点：超出额度需付费

方案C: 自部署开源（长期免费）
├── Coqui TTS (开源模型)
├── Bark / Speechify
└── 优点：零成本，音质好
```

> 推荐组合：**Web Speech API（默认）** + **Azure TTS（可选付费升级）**

### 6. 学习模式实现

| 模式 | 核心技术 | 实现要点 |
|------|---------|---------|
| 连续阅读 | CSS Grid/Flex瀑布流 | 虚拟列表优化长列表性能 |
| 单行卡片 | React Flip Move | 卡片翻转动画 |
| 挖空补全 | 正则匹配 + Input事件 | 实时反馈 |
| 趣味测试 | @dnd-kit 拖拽 | 连词成句拖拽排序 |
| SRS复习 | 艾宾浩斯算法 | 参考Anki间隔公式 |

### 7. 游戏化系统

```
数据可视化:
├── recharts             # 图表库（免费）
└── 自定义热力图          # CSS Grid实现GitHub风格

成就系统:
├── 徽章设计 (Figma)
├── 条件触发逻辑
└── 状态持久化存储
```

### 8. 部署架构

```
开发环境: localhost
    ↓
预发布: Vercel (Preview Deployments)
    ↓
生产: Vercel (免费层)
├── Frontend: Vercel Edge Network
├── API: Vercel Serverless Functions
├── Database: Neon PostgreSQL
└── Storage: Cloudflare R2 (免费10GB)
```

---

## 三、免费额度估算

| 服务 | 免费层限制 | 月费用 |
|------|-----------|-------|
| **Vercel** | 100GB带宽/月，Serverless 100h | $0 |
| **Neon** | 512MB存储 | $0 |
| **Cloudflare R2** | 10GB存储，100万Class A请求 | $0 |
| **NextAuth** | 无限制 | $0 |
| **Web Speech API** | 浏览器内置 | $0 |

**预计月成本：$0** （中小规模用户）

---

## 四、技术栈总结

```
┌─────────────────────────────────────────────────────────┐
│                     前端 (100% 免费)                     │
│  Next.js + React + Tailwind + shadcn/ui               │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                     后端 (100% 免费)                     │
│  Next.js API Routes + Prisma + PostgreSQL              │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                     基础设施 (100% 免费)                 │
│  Vercel + Neon + Cloudflare R2                         │
└─────────────────────────────────────────────────────────┘
```

**总评**：这套技术栈可以完全免费启动一个中型的语言学习平台，所有核心功能都有成熟的免费解决方案支撑。唯一可能的付费点是用户量增大后的语音API和存储扩展。
