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
- **音频**: Web Audio API (钢琴音效)
- **部署**: Vercel (免费层)

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── auth/          # 认证相关
│   │   ├── favorites/     # 收藏 API
│   │   ├── progress/      # 进度 API
│   │   └── subchapter-progress/ # 小节进度 API
│   ├── books/[bookId]/   # 书籍详情页
│   ├── learn/[subChapterId]/ # 学习页面
│   ├── favorites/         # 收藏页面
│   ├── progress/          # 进度页面
│   ├── login/             # 登录页
│   ├── register/          # 注册页
│   └── admin/             # 管理员后台
├── components/
│   ├── learn/             # 学习组件
│   │   ├── study-client.tsx      # 学习核心组件
│   │   ├── study-list.tsx        # 连续阅读模式
│   │   └── study-mode-wrapper.tsx # 学习模式包装器
│   ├── layout/            # 布局组件
│   │   └── header.tsx            # 顶部导航栏
│   ├── providers/         # React Providers
│   │   └── theme-provider.tsx    # 主题切换 Provider
│   └── ui/               # UI 组件库
├── lib/                   # 工具库
│   ├── prisma.ts         # Prisma 客户端
│   ├── utils.ts          # 工具函数
│   └── sounds.ts         # 音效函数
├── scripts/               # 脚本
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
- **BookStyleSettings**: 书籍字段样式设置（管理员）

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

1. **连续阅读**: 瀑布流展示，支持划线批注
2. **单行卡片**: 翻转记忆
3. **挖空补全**: 输入验证，支持键盘快捷操作
4. **趣味测试**: 选择题

## 已实现功能

### 核心功能
- **多种学习模式**: 连续阅读、单行卡片、挖空补全
- **划线批注系统**: 支持高亮（5种颜色）、下划线、添加备注
- **收藏功能**: 收藏卡片、朗读、查看答题历史
- **学习进度**: 记录学习进度、连续打卡统计

### 挖空模式特性
- **Q键切换**: 快捷进入/退出挖空模式
- **Tab键**: 标记当前为空为错误，显示答案，跳转到下一个
- **回车键**: 提交答案并跳转到下一个
- **E键**: 显示所有正确答案
- **琴音模式**: 开启后输入字母发出钢琴音效（每个字母对应不同音高）
- **状态记忆**: 琴音模式开关状态保存在 localStorage，刷新后保持

### 主题系统
- **亮色模式**: 古典希腊风格（金色/橄榄绿/爱琴海蓝）
- **暗夜模式**: 科技感风格（深邃夜空蓝/霓虹青/科技金）
- **全局切换**: 顶部导航栏一键切换

### 章节页特性
- **入场动画**: 章节渐显出现，限制最大延迟
- **返回定位**: 从学习页返回时自动展开当前章节并滚动定位
- **进度显示**: 每个小节显示学习进度环

### 音效系统 (Web Audio API)
- 答对音效: 升调叮咚声
- 答错音效: 低沉buzz声
- 连击音效: 更强烈的叮咚
- 琴音模式: 钢琴音色（字母a-g对应C4-B4，h-o对应C5-B5等）

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| ↑/↓ | 切换上下卡片 |
| ←/→ | 切换上下卡片 |
| Space | 翻转卡片（单行卡片模式） |
| V | 播放朗读 |
| Q | 进入/退出挖空模式 |
| E | 查看答案（挖空模式） |
| Tab | 标记错误并跳转（挖空模式） |
| Enter | 提交答案并跳转（挖空模式） |

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
4. 暗夜模式下高亮文字自动调整为深色，确保清晰可见
5. 琴音模式默认关闭，开启后状态会保存到 localStorage
