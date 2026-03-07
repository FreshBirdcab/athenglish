# Excel 格式约定文档

本文档定义了 `xlsx_materials` 目录下各书籍的 Excel 文件格式规范。

## ⚠️ 重要说明：没有标题行

**所有 Excel 文件均没有标题行**，第一行就是实际数据，导入时需要包含第一行。

## 目录结构

```
xlsx_materials/
├── 001口语词汇-全场景           # 词汇模块 - 口语
├── 001写作词汇-核心             # 词汇模块 - 写作(核心)
├── 001写作词汇-主题             # 词汇模块 - 写作(主题)
├── 001阅读词汇                  # 词汇模块 - 阅读
├── 002写作句型-功能类           # 句型模块
└── 003口语语料                  # 语料模块
```

---

## 一、词汇类格式 (001口语词汇、001写作词汇、001阅读词汇)

### 通用格式 (5列)

| 列序号 | 列名 | 说明 | 示例 |
|--------|------|------|------|
| A | word | 单词/短语/表达 | wake up |
| B | meaning | 中文释义 | 醒来；起床 |
| C | usage | 用法说明（含语境、辨析、记忆技巧等） | *适用语境：... |
| D | example_en | 英文例句 | A: What time did you wake up... |
| E | example_zh | 中文例句 | A: 你今天早上几点醒的？... |

### 格式示例

```
| A | B | C | D | E |
|---|---|---|---|---|
| wake up | 醒来；起床 | *适用语境： 最常用的表达"醒来"的短语... | A: What time did you wake up this morning?... | A: 你今天早上几点醒的？... |
| get up | 起床；起身 | *适用语境： 指从躺或坐的状态站起来... | A: I need to get up early tomorrow... | A: 我明天需要早起赶飞机... |
```

### 各书籍目录详情

#### 1. 001口语词汇-全场景
- **模块类型**: 词汇 - 口语
- **内容**: 日常生活场景词汇（生活、工作、社交、出行、购物、医疗、教育、金融等）
- **格式**: 通用5列格式
- **特点**: 包含丰富的口语化表达和实用语境

#### 2. 001写作词汇-核心
- **模块类型**: 词汇 - 写作(核心)
- **内容**: 雅思/学术写作核心词汇（数据描述、逻辑连接、论证组织、观点表达、图表分析、段落过渡、评价分析等）
- **格式**: 通用5列格式
- **特点**: 包含学术写作常用的高级表达

#### 3. 001写作词汇-主题
- **模块类型**: 词汇 - 写作(主题)
- **内容**: 雅思写作常考主题词汇（教育、科技、环境、社会、文化等）
- **格式**: 通用5列格式
- **特点**: 按主题分类的写作词汇

#### 4. 001阅读词汇
- **模块类型**: 词汇 - 阅读
- **内容**: 学术阅读词汇（学术类、教育类、科技类、环境类、健康类、商业类、社会文化类、历史类、心理学类、法律政治类、艺术文学类等）
- **格式**: 通用5列格式
- **特点**: 包含词源记忆法和学术语境说明

---

## 二、句型类格式 (002写作句型-功能类)

### 格式 (5列)

| 列序号 | 列名 | 说明 | 示例 |
|--------|------|------|------|
| A | pattern_en | 英文句型模板（含挖空标记 []） | There was a [dramatic] increase in... |
| B | pattern_zh | 中文句型模板 | 在...年间，...出现了...增长 |
| C | usage | 用法说明（语境、句型结构、辨析、注意事项） | *适用语境: 广泛应用于... |
| D | example_en | 英文例句 | There was a dramatic increase in... |
| E | example_zh | 中文例句 | 在2010年至2020年间... |

### 格式示例

```
| A | B | C | D | E |
|---|---|---|---|---|
| There was a [dramatic] increase in [the number of students] between [2010] and [2020]. | 在[2010]年到[2020]年间,[学生数量]出现了[显著]增长。 | *适用语境: 广泛应用于线图... | There was a dramatic increase in the number of students... | 在2010年至2020年间,攻读研究生学位的学生数量显著增长... |
| [The figure for renewable energy] experienced a [steady] rise, climbing from [15%] to [45%]. | [可再生能源的比例]经历了[稳定]上升,从[15%]攀升至[45%]。 | *适用语境: 适合描述柱图... | The figure for renewable energy experienced a steady rise... | 可再生能源的比例经历了稳定上升,从15%攀升至45%... |
```

### 挖空规则
- 使用方括号 `[]` 标记可替换部分
- 静态挖空：直接读取方括号内容作为挖空词
- 智能挖空：系统可随机选择动词/名词进行挖空

### 目录详情
- **002写作句型-功能类**: 包含数据描述、逻辑连接、论证组织、观点表达、图表分析、段落过渡等六大类句型

---

## 三、语料类格式 (003口语语料)

### 格式 (6列)

| 列序号 | 列名 | 说明 | 示例 |
|--------|------|------|------|
| A | question | 口语话题/问题 | What is your current job? Can you describe... |
| B | answer_formal_en | 正式英文回答 | I currently work as a software developer... |
| C | answer_formal_zh | 正式中文回答 | 我目前在上海的一家科技公司担任... |
| D | answer_casual_en | 口语化英文回答 | Well, I'm basically a software developer... |
| E | answer_casual_zh | 口语化中文回答 | 嗯，我基本上是一名软件开发者... |
| F | analysis | 语言点分析（词汇、语法、逻辑） | [Lexical]: software developer... |

### 格式示例

```
| A | B | C | D | E | F |
|---|---|---|---|---|---|
| What is your current job? Can you describe what you do in your role? | I currently work as a software developer at a tech company in Shanghai... | 我目前在上海的一家科技公司担任软件工程师... | Well, I'm basically a software developer - sort of a code wrangler... | 嗯，我基本上是一名软件开发者——可以说是代码高手... | [Lexical]: software developer... [Grammar]: Present continuous... |
```

### 目录详情
- **003口语语料**: 包含雅思口语话题的语料，按场景/主题分类（工作、教育、居住、旅游、人物、科技、社会等）

---

## 四、数据校验规则

### 必填字段
- 所有列均为必填，不可为空
- A列（单词/句型/问题）不能重复

### 数据类型
- 纯文本格式
- 不合并单元格
- 不使用公式

### 校验清单
- [ ] 所有单元格非空
- [ ] 无合并单元格
- [ ] 无公式/函数
- [ ] A列内容唯一
- [ ] 编码为UTF-8

---

## 五、导入系统实现

### UUID生成策略
每条记录导入时自动生成唯一UUID，确保数据更新时用户学习记录不丢失：

```typescript
// 导入时为每行生成UUID
interface CardImport {
  uuid: string;          // 唯一标识
  book_id: string;       // 书本ID
  chapter_id: string;    // 章节ID
  sub_chapter_id: string; // 子章节ID
  // ... 其他字段
}
```

### 匹配逻辑
1. 根据文件路径确定书本、章节、子章节
2. 读取Excel A列作为内容标识
3. 查找已存在的相同A列内容的记录
4. 如存在，更新该记录；如不存在，新增记录
5. 用户的学习进度、收藏、评论通过UUID关联

---

## 六、字段映射表

### 数据库字段映射

| Excel列 | 数据库字段 | 数据类型 |
|---------|------------|----------|
| A (word/pattern/question) | content_primary | string |
| B (meaning/pattern_zh) | content_secondary | string |
| C (usage) | usage_note | text |
| D (example_en) | example_en | text |
| E (example_zh) | example_zh | text |
| F (analysis) | analysis | text |

### 模块类型映射

| 目录名 | 模块类型 | 内容类型 |
|--------|----------|----------|
| 001口语词汇-全场景 | vocabulary | spoken |
| 001写作词汇-核心 | vocabulary | writing_core |
| 001写作词汇-主题 | vocabulary | writing_topic |
| 001阅读词汇 | vocabulary | reading |
| 002写作句型-功能类 | sentence | writing_pattern |
| 003口语语料 | corpus | speaking |
