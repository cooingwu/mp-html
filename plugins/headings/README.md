# headings

功能：提取文章中的 *H1-H6* 标题，生成目录结构，并自动监听滚动高亮当前标题
大小：*≈3KB*
支持平台：

| 微信小程序 | QQ 小程序 | 百度小程序 | 支付宝小程序 | 头条小程序 | uni-app |
|:---:|:---:|:---:|:---:|:---:|:---:|
| √ | √ | √ | √ | √ | √ |

说明：
引入本插件后，在加载完成时会触发 *headingsready* 事件，返回树形结构的标题目录和扁平数组：

```xml
<mp-html bind:headingsready="onHeadingsReady" bind:headingchange="onHeadingChange" />
```

```javascript
onHeadingsReady(e) {
  const { headings, flat } = e.detail
  // headings: 树形结构
  // flat: 扁平数组
  this.setData({ articleHeadings: headings })
}

onHeadingChange(e) {
  const { id, text, level } = e.detail
  // 当前阅读位置的标题
  this.setData({ currentHeadingId: id })
}
```

树形结构格式：
```javascript
[{
  id: "mp-heading-0",   // 外部 ID（用于点击跳转）
  _domId: "h0",          // DOM ID（实际在 DOM 上的 ID）
  level: 1,              // 标题级别（1-6）
  text: "第一章",
  index: 0,
  children: [{
    id: "mp-heading-1",
    _domId: "h1",
    level: 2,
    text: "1.1 小节",
    index: 1,
    children: []
  }]
}]
```

插件会自动创建 *IntersectionObserver* 监听所有标题的可见性，选择最接近视口顶部的标题触发 *headingchange* 事件

?> 使用 `mp-html` 的 `navigateTo` 方法配合外部 ID 可以实现点击目录跳转到对应标题位置
