# @coohub/mp-html

> 一个强大的小程序富文本组件（基于 [jin-yufeng/mp-html](https://github.com/jin-yufeng/mp-html) v2.5.1 的定制 fork）

[![npm](https://img.shields.io/npm/v/@coohub/mp-html)](https://www.npmjs.com/package/@coohub/mp-html)
![downloads](https://img.shields.io/npm/dt/@coohub/mp-html)
![license](https://img.shields.io/github/license/cooingwu/mp-html)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## 功能介绍
- 支持在多个主流的小程序平台和 `uni-app` 中使用
- 支持丰富的标签（包括 `table`、`video`、`svg` 等）
- 支持丰富的事件效果（自动预览图片、链接处理等）
- 支持设置占位图（加载中、出错时、预览时）
- 支持锚点跳转、长按复制等丰富功能
- 支持大部分 *html* 实体
- 支持正文折叠块（`<details><summary>`）
- 丰富的插件（关键词搜索、内容编辑、`latex` 公式等）
- 效率高、容错性强且轻量化

**本 fork 在上游基础上新增：**

| 能力 | 说明 |
|:---:|---|
| [image-anchor](plugins/image-anchor/README.md) | 图片锚点解读插件：在图片上挂可点击锚点，弹出富文本/视频/音频解读，支持预设样式、脉冲动画、自动尺寸监听，也可脱离 mp-html 独立使用 |
| [headings](plugins/headings/README.md) | 文章目录插件：提取 H1-H6 生成树形目录，滚动时自动高亮当前标题 |
| [interactive-flow](plugins/interactive-flow/README.md) | 正文互动流程插件：「选场景 → 选策略 → 看结果」三步互动组件，支持书籍级主题换肤、inline/popup 两种布局、步骤切换方向动画 |

查看 [上游功能介绍](https://jin-yufeng.github.io/mp-html/#/overview/feature) 了解更多

## 使用方法
### 原生平台
- `npm` 方式
  1. 在项目目录下安装组件包

     ```bash
     npm install @coohub/mp-html
     ```
  2. 开发者工具中勾选 `使用 npm 模块`（若没有此选项则不需要）并点击 `工具 - 构建 npm`
  3. 在需要使用页面的 `json` 文件中添加

     ```json
     {
       "usingComponents": {
         "mp-html": "@coohub/mp-html"
       }
     }
     ```
  4. 在需要使用页面的 `wxml` 文件中添加

     ```html
     <mp-html content="{{html}}" />
     ```
  5. 在需要使用页面的 `js` 文件中添加

     ```javascript
     Page({
       onLoad () {
         this.setData({
           html: '<div>Hello World!</div>'
         })
       }
     })
     ```
- 源码方式
  1. 将源码中对应平台的代码包（`dist/platform`）拷贝到 `components` 目录下，更名为 `mp-html`
  2. 在需要使用页面的 `json` 文件中添加

     ```json
     {
       "usingComponents": {
         "mp-html": "/components/mp-html/index"
       }
     }
     ```

  后续步骤同上

> 注意：`image-anchor`、`headings`、`interactive-flow` 为本 fork 新增插件，默认构建（`npm run build:weixin`）已启用 `markdown` + `image-anchor` + `headings` + `interactive-flow`。**四者需在 `tools/config.js` 中一同启用**，漏开任何一个已装功能会丢失，详见各插件 README。

### uni-app
- `npm` 方式
  1. 在项目目录下安装组件包

     ```bash
     npm install @coohub/mp-html
     ```
  2. 在需要使用页面的 `vue` 文件中添加

     ```vue
     <template>
       <view>
         <mp-html :content="html" />
       </view>
     </template>
     <script>
       import mpHtml from '@coohub/mp-html/dist/uni-app/components/mp-html/mp-html'
       export default {
         // 不可省略
         components: {
           mpHtml
         },
         data () {
           return {
             html: '<div>Hello World!</div>'
           }
         }
       }
     </script>
     ```

## 组件属性

| 属性 | 类型 | 默认值 | 说明 |
|:---:|:---:|:---:|---|
| container-style | String |  | 容器的样式 |
| content | String |  | 用于渲染的 html 字符串 |
| copy-link | Boolean | true | 是否允许外部链接被点击时自动复制 |
| domain | String |  | 主域名（用于链接拼接） |
| error-img | String |  | 图片出错时的占位图链接 |
| lazy-load | Boolean | false | 是否开启图片懒加载 |
| loading-img | String |  | 图片加载过程中的占位图链接 |
| pause-video | Boolean | true | 是否在播放一个视频时自动暂停其他视频 |
| preview-img | Boolean | true | 是否允许图片被点击时自动预览 |
| scroll-table | Boolean | false | 是否给每个表格添加一个滚动层使其能单独横向滚动 |
| selectable | Boolean | false | 是否开启文本长按复制 |
| set-title | Boolean | true | 是否将 title 标签的内容设置到页面标题 |
| show-img-menu | Boolean | true | 是否允许图片被长按时显示菜单 |
| tag-style | Object |  | 设置标签的默认样式 |
| use-anchor | Boolean | false | 是否使用锚点链接 |

插件新增的属性（`image-anchors`、`interactive-flows`、`flow-theme` 等）见各插件 README。

查看 [属性](https://jin-yufeng.github.io/mp-html/#/basic/prop) 了解更多

## 组件事件

| 名称 | 触发时机 |
|:---:|---|
| load | dom 树加载完毕时 |
| ready | 图片加载完毕时 |
| error | 发生渲染错误时 |
| imgtap | 图片被点击时 |
| linktap | 链接被点击时 |

插件新增的事件（`anchortap`、`headingsready`、`flowopen` 等）见各插件 README。

查看 [事件](https://jin-yufeng.github.io/mp-html/#/basic/event) 了解更多

## api
组件实例上提供了一些 `api` 方法可供调用

| 名称 | 作用 |
|:---:|---|
| in | 将锚点跳转的范围限定在一个 scroll-view 内 |
| navigateTo | 锚点跳转 |
| getText | 获取文本内容 |
| getRect | 获取富文本内容的位置和大小 |
| setContent | 设置富文本内容 |
| imgList | 获取所有图片的数组 |
| pauseMedia | 暂停播放音视频 |
| setPlaybackRate | 设置音视频播放速率 |

查看 [api](https://jin-yufeng.github.io/mp-html/#/advanced/api) 了解更多

## 插件扩展
除基本功能外，本组件还提供了丰富的扩展，可按照需要选用

| 名称 | 作用 |
|:---:|---|
| audio | 音乐播放器 |
| editable | 富文本编辑 |
| emoji | 解析 emoji |
| highlight | 代码块高亮显示 |
| markdown | 渲染 markdown |
| search | 关键词搜索 |
| style | 匹配 style 标签中的样式 |
| txv-video | 使用腾讯视频 |
| img-cache | 图片缓存 by [@PentaTea](https://github.com/PentaTea) |
| latex | 渲染 latex 公式 by [@Zeng-J](https://github.com/Zeng-J) |
| card | 卡片展示 by [@whoooami](https://github.com/whoooami) |
| [image-anchor](plugins/image-anchor/README.md) | **本 fork 新增** 图片锚点解读 |
| [headings](plugins/headings/README.md) | **本 fork 新增** 文章目录与滚动高亮 |
| [interactive-flow](plugins/interactive-flow/README.md) | **本 fork 新增** 正文互动流程组件 |

上游插件的详细说明可见 [插件文档](https://jin-yufeng.github.io/mp-html/#/advanced/plugin)

## 更新日志（本 fork）
- v1.0.7 (2026-11-09)
  1. `A` 新增 [interactive-flow](plugins/interactive-flow/README.md) 互动流程插件：场景→选项→结果三步互动，书籍级主题换肤（CSS 变量）、inline/popup 布局、固定文案可覆盖（labels）、附加解读块（tone 分级）、步骤切换方向动画
  2. `A` 新增正文折叠块：解析并渲染 `<details><summary>` 折叠展开
  3. `U` [image-anchor](plugins/image-anchor/README.md) 锚点支持内嵌说明文字，自动适配宽高与精确测量

- v1.0.6
  1. `A` 新增 [headings](plugins/headings/README.md) 文章目录插件
  2. `U` image-anchor 新增 `anchor-auto-resize` 属性，自动监听图片尺寸变化重算锚点位置
  3. `U` image-anchor 新增容器缩放比例因子，优化缩放场景下的视觉一致性
  4. `U` image-anchor 改进图片尺寸计算逻辑，批量查询提升性能

- v1.0.5
  1. `U` image-anchor 完善独立模式（脱离 mp-html 使用），优化弹窗定位与事件处理
  2. `U` image-anchor 锚点/弹窗触摸事件防抖、阻止冒泡

- v1.0.0 ~ v1.0.4
  1. 基于 jin-yufeng/mp-html v2.5.1 fork（含流式输出优化等上游后续修复）
  2. `A` 新增 [image-anchor](plugins/image-anchor/README.md) 图片锚点插件并持续修复完善（编译错误、锚点样式渲染、匹配逻辑、弹窗样式、skyline/webview 兼容等）

上游版本的更新日志可见 [上游更新日志](https://jin-yufeng.github.io/mp-html/#/changelog/changelog)

## 许可与致谢
- 许可  
  [MIT License](LICENSE)  
  在用于生产环境前务必经过充分测试，由 `bug` 带来的损失概不负责

- 致谢  
  本项目基于 [jin-yufeng/mp-html](https://github.com/jin-yufeng/mp-html) 修改，感谢原作者的开源贡献  
  上游文档：[jin-yufeng.github.io/mp-html](https://jin-yufeng.github.io/mp-html)
