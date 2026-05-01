# 更新日志

## 2026-05-01 — 功能增强 + 架构重组

### 🚀 新增功能

**📊 统计看板**
- 人物出场排行榜条形图（Chart.js）
- 各年级字数分布
- 月份事件密度趋势线图
- 可通过顶部导航栏「📊 统计」切换

**🔗 人物关系图谱**
- vis-network 力导向图，节点大小为出场次数，连线粗细为共同出现次数
- 点击节点跳转人物详情
- 物理引擎稳定后自动关闭，防止页面撑大

**📤 分享卡片**
- 打开任意史事详情 → 点击「分享此篇」→ 生成宫格图片并下载（html2canvas）

**🪶 雁过留声（本地评注）**
- 每条史事底部支持匿名留言，存入 localStorage
- 支持删除自己的评注
- 名称自动记忆

### 🎨 UX 优化

- 所有按钮按压缩放反馈 + 悬停浮起阴影
- 视图切换淡入过渡动画
- 人物卡片交错入场
- 欢迎消息滑入动画、页脚延迟淡入
- 输入框聚焦金色光晕
- 返回顶部改用 opacity 平滑淡入淡出，不再生硬切换 display
- 修复 `initCardAnimations` 滚动监听重复注册（旧监听未释放）
- 搜索结果项改用 `will-change` GPU 加速，消除动画卡顿
- 随机品读按钮改为渐变背景

### 🔧 搜索 & 随机品读优化

**搜索**
- 实时搜索：输入即搜，250ms 防抖
- 打开搜索框自动聚焦输入框
- 搜索范围扩展到 honorific + notes
- 底部显示「共找到 X 条结果」

**随机品读**
- 摇签后按钮切换为「🎲 再来一篇」，支持连续抽取
- 点击结果直接打开详情

### 🏗️ 架构重组

```diff
- css/base.css
- css/layout.css
- css/animations.css
- css/utilities.css
- css/components/*.css
+ css/base/base.css
+ css/layout/layout.css
+ css/effects/animations.css
+ css/effects/utilities.css
+ css/components/*.css

- js/main.js
- js/controls.js
- js/common.js
- js/modal.js / modal-extras.js
- js/render.js
- js/animations.js
- js/utils.js
- js/stats.js / graph.js / share.js / comments.js
+ js/core/main.js / controls.js / common.js
+ js/ui/modal.js / modal-extras.js / render.js
+ js/effects/animations.js
+ js/features/stats.js / graph.js / share.js / comments.js
+ js/utils.js
```

### 🐛 Bug 修复

- 修复 `main.js` 与 `common.js` 快捷键重复注册冲突
- 修复史事排序控件无效（之前被 `sortByDate` 硬编码覆盖）
- 修复 `requestAnimationFrame` 导致卡片不显示（渲染时序问题）
- 修复关系图谱物理引擎配置缺失 `solver`
- 修复关系图谱接入中央模态框管理，支持 ESC 关闭
- 修复关系图谱容器无限撑大（锁定固定高度 + 稳定后关闭物理引擎）
- 修复 dev 模式下模块加载时序导致 `initHistory` 未被调用
- 修复 `layout.css` 与 `navigation.css` 样式重复定义
- 修复 `buttons.css` 中 `.back-to-top` 重复定义
- 修复人物匹配未去除自定义标签干扰
- 修复搜索模态框只搜正史不包含外史/戏史
- 修复密码错误无视觉反馈（增加抖动动画）
- 修复 `<noscript>` 被 JSX 解析器误报 error
- 修复 `<link onload>` 内联 JS 触发 JSX 解析错误
- 删除废弃的 `css/components.css`
