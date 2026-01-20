# image-anchor 图片锚点插件

在富文本图片上显示可点击的锚点，点击后展示解读弹窗。

## 功能特性

- 支持在图片上显示多个锚点
- 支持三种锚点样式类型：图片、图形、图标
- 支持说明文本自动定位
- 支持脉冲/呼吸动画效果
- 支持多页解读内容切换
- 支持富文本、视频、音频三种解读内容类型
- 支持容器内弹窗和底部 Modal 两种显示模式
- 兼容 PC 端和移动端

## 使用方法

### 1. 引入插件

在 `tools/config.js` 的 `plugins` 数组中添加 `'image-anchor'`：

```javascript
module.exports = {
  plugins: ['image-anchor']
}
```

### 2. 构建组件包

```bash
npm run build:weixin
```

### 3. 在 mp-html 中使用组件

```wxml
<mp-html
  content="{{html}}"
  image-anchors="{{imageAnchors}}"
  anchor-styles="{{anchorStyles}}"
  tooltip-mode="container"
  show-anchor-animation="{{true}}"
  anchor-auto-resize="{{true}}"
  bindanchortap="onAnchorTap"
  bindtooltipshow="onTooltipShow"
  bindtooltiphide="onTooltipHide"
  bindpagechange="onPageChange"
/>
```

## 属性说明

| 属性名 | 类型 | 默认值 | 说明 |
| ------ | ------ | ------ | ------ |
| image-anchors | Array | [] | 图片锚点数据数组 |
| anchor-styles | Array | [] | 锚点预设样式数组 |
| tooltip-mode | String | 'container' | 弹窗显示模式：'container'(容器内) / 'modal'(底部弹窗) |
| show-anchor-animation | Boolean | true | 是否显示锚点脉冲动画 |
| anchor-auto-resize | Boolean | false | 是否自动监听图片尺寸变化并重新计算锚点位置 |

## 事件说明

| 事件名 | 说明 | 返回值 |
| ------ | ------ | ------ |
| anchortap | 点击锚点时触发 | { anchor: Object } |
| tooltipshow | 弹窗显示时触发 | { anchor: Object } |
| tooltiphide | 弹窗关闭时触发 | { anchor: Object } |
| pagechange | 切换解读页面时触发 | { index: Number, page: Object, anchor: Object } |

## 数据格式

### imageAnchors 锚点数据

```javascript
[
  {
    imageIndex: 0,  // 图片索引（从0开始）
    // 或使用 imageSrc: 'xxx.jpg' 通过图片地址匹配
    anchors: [
      {
        id: 'anchor1',
        position: { x: 30, y: 40 },  // 百分比坐标 (0-100)
        style: {
          presetId: 'style1',  // 预设样式ID（可选）
          size: 8,  // 相对图片宽度的百分比 (2-30)
          color: '#ff4d4f',  // 自定义颜色（无预设时使用）
          customImage: ''  // 自定义图片URL（可选）
        },
        tooltipPages: [
          {
            id: 'page1',
            type: 'richtext',  // richtext/video/audio
            title: '解读标题',
            content: '解读内容...',
            image: 'xxx.jpg'
          }
        ],
        order: 1,  // 锚点编号
        label: {
          text: '说明文本',
          position: 'right',  // right/left/top/bottom
          autoPosition: true  // 是否自动调整位置
        }
      }
    ]
  }
]
```

### anchorStyles 预设样式

```javascript
[
  {
    _id: 'style1',
    name: '样式名称',
    type: 'shape',  // image/shape/icon
    shape: {
      type: 'circle',  // circle/square/rounded
      color: '#ff4d4f',
      borderColor: '#ffffff',
      borderWidth: 2
    },
    defaultSize: 32
  },
  {
    _id: 'style2',
    type: 'icon',
    icon: {
      name: 'info-circle',  // 支持的图标名称见下方
      color: '#ffffff'
    }
  },
  {
    _id: 'style3',
    type: 'image',
    image: 'https://xxx.com/anchor.png'
  }
]
```

### 支持的图标名称

- info-circle (信息)
- question-circle (问号)
- exclamation-circle (感叹号)
- star (星星)
- heart (爱心)
- thumb-up (点赞)
- location (定位)
- eye (眼睛)

## 弹窗模式说明

### container 模式

弹窗在图片容器内显示，覆盖图片上方或下方 40% 区域。根据锚点位置自动判断：

- 锚点 y < 60%：弹窗显示在下方
- 锚点 y >= 60%：弹窗显示在上方

### modal 模式

弹窗作为独立层从底部弹出，覆盖全屏，最大高度 70vh。点击遮罩可关闭。

## 自动监听尺寸变化

### anchor-auto-resize 属性

`anchor-auto-resize` 属性可以自动监听图片尺寸变化并重新计算锚点位置。支持插件模式和独立模式。

**工作原理：**

使用定时轮询机制（每 1000ms）检查图片元素的 `boundingClientRect`。当检测到尺寸变化超过 2px 阈值时，自动触发 `initImageDimensions()` 方法重新计算锚点位置。

**触发场景：**

- 容器宽度变化（如折叠面板展开/收起）
- 页面 resize（已通过 `pageLifetimes.resize` 自动处理）
- 图片加载完成后的尺寸调整
- 父组件布局变化影响图片显示尺寸

**使用方法：**

```html
<!-- 插件模式：启用自动监听 -->
<mp-html
  content="{{html}}"
  image-anchors="{{imageAnchors}}"
  anchor-auto-resize="{{true}}"
/>

<!-- 独立模式：启用自动监听 -->
<image-anchor
  src="{{imageUrl}}"
  image-anchors="{{anchors}}"
  auto-resize="{{true}}"
/>
```

**性能建议：**

- 默认关闭 `anchor-auto-resize`，仅在容器尺寸会频繁变化时启用

## 注意事项

1. 目前仅支持微信小程序平台
2. 图片锚点数据需要在 `mp-html` 组件渲染前设置
3. 锚点位置使用百分比坐标，相对于图片尺寸
4. 预设样式的 `_id` 需要与锚点数据中的 `presetId` 对应

## 更新日志

### v1.0.0

- 初始版本
- 支持基础锚点显示和解读弹窗功能

?> 如果希望页面上使用本组件，组件的路径为 *path/to/mp-html/card/card*

---

## 独立使用（不依赖 mp-html）

本组件也可以作为独立的小程序组件使用，无需引入 mp-html。

### 1. 复制组件文件

将 `plugins/image-anchor/miniprogram` 目录复制到你的小程序项目中：

```bash
cp -r plugins/image-anchor/miniprogram /components/image-anchor
```

### 2. 引入组件

在页面的 JSON 中引入：

```json
{
  "usingComponents": {
    "image-anchor": "/components/image-anchor/image-anchor"
  }
}
```

### 3. 使用组件

在页面的 WXML 中使用：

```html
<image-anchor
  src="{{imageUrl}}"
  img-id="img-123"
  img-index="{{imageIndex}}"
  img-class="custom-image"
  img-style="width: 100%;"
  image-anchors="{{anchors}}"
  anchor-styles="{{styles}}"
  tooltip-mode="container"
  show-anchor-animation="{{true}}"
  bindanchortap="onAnchorTap"
  bindtooltipshow="onTooltipShow"
  bindtooltiphide="onTooltipHide"
/>
```

### 4. 设置数据

在页面的 JS 中设置数据：

```javascript
Page({
  data: {
    imageUrl: 'https://example.com/image.jpg',
    anchors: [
      {
        id: 'anchor-1',
        position: { x: 30, y: 40 },
        content: {
          title: '锚点标题',
          description: '锚点描述',
          images: ['https://example.com/img1.jpg']
        },
        style: { color: '#FF0000', size: 8 }
      }
    ],
    styles: [
      {
        _id: 'style-1',
        color: '#FF0000',
        size: 8,
        icon: 'default'
      }
    ]
  },

  onAnchorTap(e) {
    console.log('点击锚点:', e.detail.anchor);
  },

  onTooltipShow(e) {
    console.log('弹窗显示:', e.detail.anchor);
  },

  onTooltipHide(e) {
    console.log('弹窗隐藏:', e.detail.anchor);
  }
})
```

### 独立模式专属属性

| 属性名 | 类型 | 默认值 | 说明 |
| ------ | ------ | ------ | ------ |
| src | String | | 图片地址（必需） |
| imgMode | String | 'widthFix' | 图片裁剪/缩放模式 |
| lazyLoad | Boolean | false | 是否懒加载 |
| showMenuByLongpress | Boolean | false | 是否长按显示菜单 |
| imgStyle | String | | 图片样式 |
| imgId | String | | 图片 ID（会在 imgtap 事件中返回） |
| imgIndex | Number | -1 | 图片索引（用于多图场景，会在 imgtap 事件中作为 `i` 返回） |
| imgClass | String | | 图片 CSS 类名 |
| dataAttrs | Object | {} | 自定义 data 属性，如 `{ id: '123' }` 会被转换为 `data-id` |
| imageAnchors | Array | [] | 锚点数据数组 |
| anchorStyles | Array | [] | 预设样式数组 |
| tooltipMode | String | 'container' | 弹窗显示模式：container/modal |
| showAnchorAnimation | Boolean | true | 是否显示锚点动画 |

### 使用 dataAttrs 传递自定义数据

```html
<image-anchor
  src="{{imageUrl}}"
  data-attrs="{{ { id: '123', category: 'product' } }}"
  bindimgtap="onImgTap"
/>
```

在事件中获取：

```javascript
onImgTap(e) {
  console.log(e.detail); // { src: '...', id: '123', 'data-id': '123', 'data-category': 'product' }
}
```

### imgtap 事件返回值

独立模式和插件模式返回的数据格式一致，**都包含图片索引 `i`**：

```javascript
{
  src: 'https://example.com/image.jpg',  // 图片地址
  id: 'img-123',                         // 图片 ID（如果有）
  i: 0,                                  // 图片索引（插件模式自动添加，独立模式通过 imgIndex 设置）
  class: 'custom-image',                 // CSS 类名（如果有）
  style: 'width: 100%;',                 // CSS 样式（如果有）
  'data-id': '123',                      // data-* 属性（如果有）
  'data-category': 'product'             // 更多 data-* 属性
}
```

**说明：**

- **插件模式**：`i` 由 mp-html 的 parser 自动添加（node.i）
- **独立模式**：`i` 通过 `imgIndex` 属性手动设置（可选）

### 多图场景使用示例

当页面有多张图片时，可以使用 `imgIndex` 追踪每张图片的位置：

```javascript
Page({
  data: {
    images: [
      { url: 'https://example.com/img1.jpg', anchors: [...] },
      { url: 'https://example.com/img2.jpg', anchors: [...] },
      { url: 'https://example.com/img3.jpg', anchors: [...] }
    ]
  },

  onImgTap(e) {
    const { src, i } = e.detail;
    const imgList = this.data.images.map(item => item.url);

    // 使用索引预览图片（类似插件模式）
    wx.previewImage({
      current: src,
      urls: imgList
    });

    console.log('当前图片索引:', i); // 0, 1, 2...
  }
})
```

```html
<!-- 为每张图片设置索引 -->
<image-anchor
  wx:for="{{images}}"
  wx:key="url"
  src="{{item.url}}"
  img-index="{{index}}"
  image-anchors="{{item.anchors}}"
  bindimgtap="onImgTap"
/>
```
