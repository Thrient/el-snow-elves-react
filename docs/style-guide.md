# UI 风格规范

本项目采用 VariablePanel 为基准的紧凑工具型风格。所有新增/修改的 UI 必须遵守此规范。

## 配色

### 文字

| 用途 | Class | 值 |
|------|-------|-----|
| 标题/主文字 | `text-[#1a1a2e]` | `#1a1a2e` |
| 正文 | `text-[#374151]` | `#374151` |
| 次要说明 | `text-[#6b7280]` | `#6b7280` |
| 辅助/标签 | `text-[#8b8fa3]` | `#8b8fa3` |
| 占位/禁用 | `text-[#c0c4cc]` | `#c0c4cc` |
| 链接/强调 | `text-[#1677ff]` | `#1677ff` |
| 警告 | `text-[#92400e]` | `#92400e` |
| 危险 | `text-[#ff4d4f]` | `#ff4d4f` |

### 背景

| 用途 | Class | 值 |
|------|-------|-----|
| 页面底 | `bg-white` | `#fff` |
| 区块/面板 | `bg-[#fafbfc]` | `#fafbfc` |
| 输入框只读 | `bg-[#f8f9fb]` | `#f8f9fb` |
| 选中高亮 | `bg-[#eef2ff]` | `#eef2ff` |
| 标签/Tag 底 | `bg-[#f0f2f5]` | `#f0f2f5` |
| 危险 hover | `bg-[#fff1f0]` | `#fff1f0` |

### 边框

| 用途 | Class | 值 |
|------|-------|-----|
| 默认边框 | `border-[#eef0f2]` | `#eef0f2` |
| hover 边框 | `border-[#dde0e6]` | `#dde0e6` |
| 聚焦边框 | `border-[#1677ff]` | `#1677ff` |
| 分割线 | `bg-[#eef0f2]` | — (用背景模拟) |

### 语义色（Tag / Badge / 状态指示）

| 类别 | Ant Design Tag color | 用途 |
|------|---------------------|------|
| 蓝色 | `color="blue"` | 配置 / 步骤 |
| 绿色 | `color="green"` | 任务 / 成功 |
| 紫色 | `color="purple"` | 系统变量 |
| 橙色 | `color="orange"` | 流程图步骤 |
| 青色 | `color="cyan"` | set 变量 |

---

## 字体

### 字号层级

| 层级 | Class | 用途 |
|------|-------|------|
| 超大标题 | `text-xl` ~ `text-2xl` | 页面标题 |
| 大标题 | `text-lg` | 区块标题 |
| 标题 | `text-sm` | 卡片标题、弹窗标题 |
| 小节标题 | `text-xs font-semibold` | 面板标题、section 标题 |
| 正文 | `text-[13px]` | 表单标签、列表项、说明文字 |
| 辅助正文 | `text-[12px]` | 次要说明、标签 |
| 小标签 | `text-[11px]` | 字段标签、元信息 |
| 微小标签 | `text-[10px]` | 分类标签、badge、大写标签 |

### 字重

- 标题用 `font-semibold` 或 `font-bold`
- 正文/标签用 `font-medium` 或默认
- **不用** `font-normal` 显式声明（即是默认）

---

## 间距

### 卡片/面板内边距

- 紧凑面板：`px-3 py-2`
- 标准卡片：`p-4`
- 弹窗内容区：`px-4 py-3` 起，区块间距 `gap-5`

### 表单/字段间距

- 同组字段：`gap-3`（竖直）、`gap-4`（水平）
- 标签与输入框：`gap-1` 或 `gap-1.5`
- 区块间：`gap-5` ~ `gap-6`

### 列表项

- 列表内边距：`px-2.5 py-1.5`
- 列表项间距：`gap-0.5` 或 `gap-1`
- 分隔线：`border-b border-[#eef0f2] last:border-b-0`

---

## 圆角

| 元素 | Class |
|------|-------|
| 小标签/Badge | `rounded-md` |
| 按钮 | `rounded-md` |
| 卡片/面板 | `rounded-lg` |
| 弹窗区域 | `rounded-lg` |
| 圆形头像/指示器 | `rounded-full` |

---

## 阴影

- 卡片/面板：`shadow-sm`
- 浮层/下拉：`shadow-md` ~ `shadow-lg`
- 不滥用阴影——页面级容器不加阴影，卡片和弹窗适量

---

## 通用组件模式

### Section 标题

```tsx
<div className="flex items-center gap-2 mb-3">
  <div className="w-1 h-4 rounded-full bg-[#1677ff]" />
  <span className="text-xs font-semibold text-[#1a1a2e]">标题</span>
</div>
```

### 字段（竖排标签在上）

```tsx
<div className="flex flex-col gap-1">
  <span className="text-[11px] font-medium text-[#8b8fa3]">字段名</span>
  <Input size="small" ... />
</div>
```

### 字段（横排标签在左）

```tsx
<div className="flex items-center gap-3">
  <span className="text-[11px] font-medium text-[#8b8fa3] w-16 shrink-0">字段名</span>
  <Input size="small" className="flex-1" ... />
</div>
```

### 只读信息卡片

```tsx
<div className="flex items-center gap-3 px-3 py-2.5 bg-[#f8f9fb] rounded-lg border border-[#eef0f2]">
  <span className="text-[11px] text-[#8b8fa3]">标签</span>
  <span className="text-xs font-medium text-[#1a1a2e]">值</span>
</div>
```

### 空状态

```tsx
<div className="text-[11px] text-[#c0c4cc] text-center py-4">
  暂无数据
</div>
```

### 列表项（可 hover）

```tsx
<div className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#f5f7fa] 
  border-b border-[#eef0f2] last:border-b-0 transition-colors">
  ...
</div>
```

---

## 弹窗规范

- 必须加 `centered`
- 标题用 `<span className="text-sm font-semibold text-[#1a1a2e]">`
- 不重复 × 关闭按钮（标题栏已有），`footer={null}` 或只保留功能按钮
- 宽度按内容：简单确认 `width={400}`，表单 `width={520}`，复杂 `width={780}`
- 内容区 `pt-1` 与标题保持紧凑

---

## 禁用项

- 不使用 Tailwind `slate-*`、`gray-*` 命名颜色——统一用 `[#...]` 精确值
- 不使用 `inline style` 对象，全部用 Tailwind class（Ant Design 组件的 `style` prop 除外）
- 不用 `text-base`、`text-sm` 的模糊语义——用精确 `text-[13px]` 等
- 不用 `m-x-*` / `m-b-*` 等非标准语法（Tailwind 不支持这种缩写）
- 不新建 CSS class（`.hide-scrollbar` 等工具类除外），全部用 Tailwind
