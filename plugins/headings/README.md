# headings 插件

提取文章中的 H1-H6 标题，生成目录结构，并自动监听滚动高亮当前标题。

## 功能

- 自动提取 H1-H6 标题
- 自动为无 ID 的标题生成 ID
- 构建树形层级结构
- 自动监听页面滚动，高亮当前阅读位置的标题
- 通过 `headingsready` 和 `headingchange` 事件返回数据

## 使用方法

### 1. 引入插件

在 `parser.js` 或组件中引入：

```javascript
const Headings = require('./plugins/headings');
```

### 2. 注册插件

```javascript
plugins.push(Headings);
```

### 3. 监听事件

```xml
<mp-html
  bind:headingsready="onHeadingsReady"
  bind:headingchange="onHeadingChange"
/>
```

```javascript
onHeadingsReady(e) {
  const { headings, flat } = e.detail;
  // headings: 树形结构
  // flat: 扁平数组
  this.setData({
    articleHeadings: headings
  });
}

onHeadingChange(e) {
  const { id, text, level } = e.detail;
  // 当前阅读位置的标题
  this.setData({ currentHeadingId: id });
}
```

## 事件

### headingsready

标题数据提取完成后触发，返回树形结构和扁平数组。

### headingchange

滚动页面时触发，返回当前最接近视口顶部的标题。

**事件数据**：
```javascript
{
  id: "mp-heading-0",      // 外部 ID
  _domId: "h0",             // DOM ID
  text: "第一章",           // 标题文本
  level: 1                  // 标题级别（1-6）
}
```

## 事件数据格式

### headings（树形结构）

```javascript
[
  {
    id: "mp-heading-0",     // 外部 ID（用于点击跳转）
    _domId: "h0",            // DOM ID（实际在 DOM 上的 ID）
    level: 1,
    text: "第一章",
    index: 0,
    children: [
      {
        id: "mp-heading-1",
        _domId: "h1",
        level: 2,
        text: "1.1 小节",
        index: 1,
        children: []
      }
    ]
  }
]
```

### flat（扁平数组）

```javascript
[
  { id: "mp-heading-0", _domId: "h0", level: 1, text: "第一章", index: 0 },
  { id: "mp-heading-1", _domId: "h1", level: 2, text: "1.1 小节", index: 1 }
]
```

**ID 说明**：
- `id`：外部 ID，用于目录组件的点击跳转（`mp-heading-X`）
- `_domId`：DOM ID，实际渲染在页面上的简短 ID（`hX`）
- 插件会自动建立 `id -> _domId` 的映射，mp-html 的 `navigateTo` 方法会使用这个映射

## 滚动监听

插件会自动创建 `IntersectionObserver` 监听所有标题的可见性，并自动选择最接近视口顶部的标题触发 `headingchange` 事件。

- **选择策略**：选择 `boundingRect.top` 的绝对值最小的标题（最接近视口顶部）
- **节流**：150ms 节流，避免频繁触发
- **自动清理**：组件销毁或内容更新时自动清理 observer
