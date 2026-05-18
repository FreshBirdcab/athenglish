# 沉浸式语言学习平台 - 技术栈文档

## 一、技术选型总览

| 层级 | 推荐技术 | 理由 |
|------|---------|------|
| **前端框架** | React + Next.js | 生态丰富、SEO友好、Server Components优化性能 |
| **UI组件库** | shadcn/ui + Tailwind CSS | 免费开源、现代化设计、按需加载 |
| **后端框架** | Next.js API Routes | 前后端一体化，无需单独部署后端服务 |
| **数据库** | SQLite + Prisma ORM | 本地开发方便，免费开源 |
| **认证** | NextAuth.js | 开源免费，支持多种登录方式 |
| **音频** | Web Audio API | 浏览器原生，无需外部音频文件 |

---

## 二、技术方案

### 1. 前端技术栈

```
React 18 + Next.js 14 (App Router)
├── Tailwind CSS          # 样式框架
├── shadcn/ui             # UI组件（基于Radix UI）
├── Lucide React          # 图标库
├── clsx + tailwind-merge # 样式工具
└── @tailwindcss/animate  # 动画
```

### 2. 后端技术栈

```
Next.js API Routes (Serverless)
├── @prisma/client        # 数据库ORM
├── next-auth             # 用户认证
└── bcryptjs              # 密码加密
```

### 3. 数据库

使用 SQLite 本地数据库，便于开发调试。

```
SQLite 表结构设计:
├── users                 # 用户表
├── books                # 书本表
├── chapters             # 章节表
├── sub_chapters         # 子章节表
├── cards                # 卡片内容（词汇/句型/语料）
├── user_progress         # 用户学习进度
├── favorites            # 收藏
├── annotations           # 划线批注
├── streak               # 连续打卡
└── book_style_settings  # 书籍字段样式设置
```

### 4. Excel 导入系统

```
xlsx (SheetJS) 解析流程:
1. 管理员上传 .xlsx 文件
2. 后端解析Excel内容
3. 校验格式
4. 为每行生成 UUID（防止数据丢失）
5. 批量插入/更新数据库
```

### 5. 音频播放方案

```
Web Audio API (免费)
├── 答对音效: 升调叮咚声 (C大三和弦)
├── 答错音效: 低沉buzz声
├── 连击音效: 更强烈的叮咚
└── 琴音模式: 钢琴音色（字母映射到音高）
```

### 6. 学习模式实现

| 模式 | 核心技术 | 实现要点 |
|------|---------|---------|
| 连续阅读 | CSS Grid/Flex瀑布流 | 虚拟列表优化 |
| 单行卡片 | CSS 翻转动画 | 卡片翻转效果 |
| 挖空补全 | 正则匹配 + Input事件 | 实时反馈、键盘快捷操作 |
| 琴音模式 | Web Audio API | 字母映射到音高 |

### 7. 主题系统

```
Tailwind CSS + CSS变量
├── 亮色模式: 古典希腊风格
│   ├── 主色: hsl(38 75% 45%) 金色
│   ├── 次色: hsl(35 30% 88%) 橄榄绿
│   └── 强调色: hsl(200 55% 45%) 爱琴海蓝
│
└── 暗夜模式: 科技感风格
    ├── 主色: hsl(38 90% 55%) 科技金
    ├── 次色: hsl(220 20% 14%) 深蓝灰
    └── 强调色: hsl(185 70% 55%) 霓虹青
```

### 8. 状态持久化

```
├── localStorage: 琴音模式开关状态
├── SQLite数据库: 用户进度、收藏、批注等
└── URL参数: 学习模式切换 (?mode=card/list/fill)
```

---

## 三、技术亮点

### 1. 音效系统

使用 Web Audio API 生成音效，无需外部音频文件：
- 多个振荡器混合模拟钢琴音色
- 音高包络实现敲击感
- 字母到音高的映射实现琴音模式

### 2. 主题系统

- CSS变量实现全局主题切换
- 暗夜模式下高亮文字自动调整为深色
- 渐变背景自动适配

### 3. 挖空模式

- 支持不同字段的挖空状态管理
- Tab键实现标记错误并跳转
- 琴音模式增强学习趣味性

### 4. 章节页优化

- 入场动画带延迟限制
- 从学习页返回时自动展开定位

---

## 四、目录结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── books/[bookId]/   # 书籍详情页
│   ├── learn/[subChapterId]/ # 学习页面
│   ├── favorites/         # 收藏页面
│   ├── progress/          # 进度页面
│   ├── login/             # 登录页
│   ├── register/          # 注册页
│   └── admin/             # 管理员后台
├── components/
│   ├── learn/             # 学习组件
│   ├── layout/            # 布局组件
│   ├── providers/         # React Providers
│   └── ui/               # UI 组件库
├── lib/                   # 工具库
└── types/                # 类型定义
```
