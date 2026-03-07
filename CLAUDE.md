# AthEnglish - 沉浸式语言学习平台

## 项目概述

这是一个专业的英语学习平台，包含词汇、句型、语料三大模块，支持多种学习模式和间隔重复记忆。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS + shadcn/ui
- **数据库**: SQLite + Prisma ORM
- **认证**: NextAuth.js
- **状态管理**: Zustand
- **部署**: Vercel (免费层)

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── auth/          # 认证相关
│   │   ├── favorites/     # 收藏 API
│   │   └── progress/     # 进度 API
│   ├── books/[bookId]/  # 书籍详情页
│   ├── learn/[subChapterId]/ # 学习页面
│   ├── favorites/        # 收藏页面
│   ├── progress/         # 进度页面
│   ├── login/            # 登录页
│   └── register/         # 注册页
├── components/
│   ├── learn/            # 学习组件
│   ├── layout/           # 布局组件
│   ├── providers/         # React Providers
│   └── ui/               # UI 组件库
├── lib/                  # 工具库
│   ├── prisma.ts         # Prisma 客户端
│   └── utils.ts          # 工具函数
├── scripts/              # 脚本
│   └── seed.ts           # 数据库种子脚本
└── types/                # 类型定义

xlsx_materials/           # 教材 Excel 文件
├── 001口语词汇-全场景
├── 001写作词汇-核心
├── 001写作词汇-主题
├── 001阅读词汇
├── 002写作句型-功能类
└── 003口语语料
```

## 数据库模型

- **User**: 用户
- **Book**: 书本
- **Chapter**: 章节
- **SubChapter**: 子章节
- **Card**: 卡片（单词/句型/语料）
- **UserProgress**: 学习进度
- **UserReview**: SRS 复习记录
- **Favorite**: 收藏
- **Comment**: 评论
- **Annotation**: 划线批注
- **Achievement**: 成就
- **Streak**: 连续打卡

## 关键命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 重新导入数据
npm run seed
```

## Excel 格式

所有 Excel 文件**没有标题行**，第一行就是实际数据。

- **词汇模块**: 5列 (单词/释义/用法/例句EN/例句ZH)
- **句型模块**: 5列 (句型模板/中文/用法/例句EN/例句ZH)
- **语料模块**: 6列 (问题/正式EN/正式ZH/口语EN/口语ZH/分析)

## 学习模式

1. **连续阅读**: 瀑布流展示
2. **单行卡片**: 翻转记忆
3. **挖空补全**: 输入验证
4. **趣味测试**: 选择题

## 环境变量

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## 注意事项

1. Prisma 5.x 使用标准方式，不需要 adapter
2. Turbopack 在某些环境下不稳定
3. xlsx_materials 目录为静态资源，导入后存数据库
