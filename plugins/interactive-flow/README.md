# interactive-flow 互动流程插件

在富文本正文中渲染"三步推演"类互动组件（选场景 → 选策略 → 看结果）。

## 启用

在 `tools/config.js` 的 plugins 中加入 `'interactive-flow'`（注意与 markdown、image-anchor、headings 一同启用）后构建。

## 数据流

1. 章节正文中存放占位节点（管理后台 Tiptap 原子节点产出）：

```html
<div data-type="interactive-flow" data-widget-id="w1"></div>
```

2. 章节数据的 `widgets` 字段（JSON string，页面解析后）通过 `interactive-flows` 属性传入 mp-html。
3. 插件 `onUpdate` 时把占位 div 转换为自闭合标签 `<interactive-flow widget-id="w1"/>`（parser 会丢弃非 img/a 标签上的 `data-*` 属性，因此必须转换；构建期 handler 已把该标签注入 trustTags + voidTags）。
4. `onParse` 按 `widget-id` 匹配数据挂在节点上（`n.flowData`），无匹配数据时节点移除（旧版本正文兼容），并调用 `parser.expose()` 暴露祖先链。

## mp-html 组件属性

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| interactive-flows | Array | [] | 互动组件数据列表（结构见下） |
| flow-theme | Object | null | 书籍级主题（publications.interactiveTheme） |

## 事件

| 名称 | 触发时机 | detail |
|---|---|---|
| flowopen | popup 布局的占位小卡被点击 | `{ id }`（widget id） |

`layout: 'popup'` 时正文只渲染占位小卡，页面监听 `bind:flowopen` 后自行唤起全屏弹层，弹层内以独立模式引用本组件。

### 弹层独立模式（popup 布局配套）

弹层内单独引用 `interactive-flow` 组件（组件路径 `@coohub/mp-html/dist/mp-weixin/interactive-flow/interactive-flow`）：

```html
<interactive-flow
  flow="{{flow}}"
  theme="{{theme}}"
  variant="full"
  show-close="{{true}}"
  bindclose="onFlowClose"
/>
```

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| variant | String | 'inline' | `full` 为弹层完整模式（含标题区/关闭按钮，**不会**附加正文间距） |
| show-close | Boolean | false | 是否显示右上角关闭按钮 |
| bindclose | event |  | 关闭按钮被点击时触发 |

> 注意：`variant="full"` 组件不要放在正文流里再加外边距，弹层场景组件即面板本身。

## 交互行为

- **步骤切换方向动画**：前进（选场景/选选项）从右侧滑入，后退（上一步/换选项/换场景）从左侧滑入，0.32s ease-out；步进条颜色平滑过渡。
- **正文间距**：`variant` 为默认 `inline` 且 `layout` 非 `popup` 时，组件上下各留 32rpx 间距。

## 数据格式

```json
{
  "id": "w1",
  "type": "flow",
  "version": 1,
  "layout": "inline",
  "title": "试一试：阴阳开合推演",
  "subtitle": "选一个真实情境，走一局看看",
  "scenes": [
    {
      "category": "日常",
      "title": "初次接触潜在客户",
      "desc": "对方话少，你该先开还是先合？",
      "situation": "……",
      "options": [
        {
          "label": "捭",
          "text": "我先亮底牌……",
          "result": "推演结果正文",
          "blocks": [
            { "title": "代价", "body": "你暴露了底线……", "tone": "warning" },
            { "title": "记住这个概念 · 人心之理", "body": "没搞懂对方就贸然开放，是捭阖的大忌。", "tone": "emphasis" }
          ]
        }
      ]
    }
  ]
}
```

`blocks` 为附加解读块（可空数组），每块 `title`+`body` 必填，`tone` 可选 `default`（中性）/`emphasis`（强调·主色）/`warning`（警示·强调色），块的数量与内容完全由运营配置——「代价」「概念」只是这本书的用法，不是固定结构。

## 固定文案覆盖（labels，均可选）

```json
"labels": {
  "step0": "选场景", "step1": "选策略", "step2": "看结果",
  "step0Title": "选择推演场景",
  "resultTitle": "推演结果",
  "prevStep": "‹ 上一步",
  "changeOption": "换个选项", "changeScene": "换个场景"
}
```

不配置或置空时使用上述默认值。

## 富文本字段

`situation`、`options[].text`、`options[].result`、`blocks[].title`、`blocks[].body` 支持行内富文本（`<b>`/`<i>`/`<span style="color:...">`），由管理后台所见即所得编辑器产出，小程序端以 rich-text 渲染；纯文本（含 `\n` 换行）兼容。

## 主题

`flow-theme` 结构（`enabled` 为 false 或 primary 为空时不注入，使用内置深色金）：

```json
{
  "enabled": true,
  "preset": "dark-gold",
  "primary": "#e2c07c",
  "accent": "#c98b5a",
  "background": "#1c1a17",
  "text": "#f3e6c8",
  "muted": "#9a8f7d",
  "surface": "#26231e",
  "line": "#555555"
}
```

| 字段 | 说明 |
|---|---|
| primary / accent | 主色 / 强调色（按钮、激活态、emphasis 解读块边框等） |
| background / text / muted | 整体底色 / 正文文字 / 次要文字 |
| surface |（可选）次级表面：场景卡、选项卡的实底色，浅色主题下建议设置以保证卡片可读 |
| line |（可选）线条色：未完成步骤点/连线、徽章描边 |

组件根节点注入 CSS 变量 `--if-primary/--if-accent/--if-bg/--if-text/--if-muted/--if-surface/--if-line`，样式全部使用 `var(--if-xxx, 默认值)`，换肤零代码。`--if-soft`（情境卡半透明叠加底）不暴露配置，由组件按 `background` 相对亮度自动派生（浅底叠黑 5%、深底叠白 4%）。

内置预设：`dark-gold`（深色金）、`light-ink`（浅色墨）。
