/**
 * @fileoverview 互动流程插件入口文件
 * 用于在富文本正文中渲染"三步推演"类互动组件
 *
 * 数据流：
 * 1. 章节正文中存放占位节点 <div data-type="interactive-flow" data-widget-id="w1"></div>
 *    （管理后台 Tiptap 原子节点产出，data-* 属性会被 parser 丢弃，见 onUpdate 转换）
 * 2. onUpdate 时转换为自闭合自定义标签 <interactive-flow widget-id="w1"/>
 * 3. 构建期 handler 已把该标签注入 parser 的 trustTags + voidTags，
 *    自闭合标签在 onOpenTag 中触发 onParse，标签名与 attrs 原样保留
 * 4. onParse 匹配 interactiveFlows 属性中的组件数据挂到节点上，
 *    并调用 parser.expose() 暴露祖先链（rich-text 内无法渲染自定义组件）
 * 5. node.wxml 注入分支将节点交给 interactive-flow 组件渲染
 */

/**
 * @description 组件被创建时将实例化插件
 * @param {Component} vm 组件实例
 */
function InteractiveFlowPlugin(vm) {
  this.vm = vm;
}

/**
 * @description html 数据更新时触发
 * @param {string} content 要更新的 html 字符串
 * @param {object} config 解析配置
 * @returns {string|void} 转换后的 html
 */
InteractiveFlowPlugin.prototype.onUpdate = function (content) {
  if (!content || content.indexOf('data-type') === -1) {
    return content;
  }
  // 将占位 div 转换为自闭合自定义标签
  // 属性顺序不定，逐个提取 widget-id
  return content.replace(
    /<div\b([^>]*\bdata-type\s*=\s*["']interactive-flow["'][^>]*)>\s*<\/div>/gi,
    function (match, attrs) {
      const idMatch = attrs.match(/\bdata-widget-id\s*=\s*["']([^"']+)["']/);
      const id = idMatch ? idMatch[1] : '';
      return `<interactive-flow widget-id="${id}"/>`;
    }
  );
};

/**
 * @description 解析到一个标签时触发
 * @param {object} node 标签
 * @param {object} parser 解析器实例
 * @returns {boolean|void} 如果返回 false 将移除该标签
 */
InteractiveFlowPlugin.prototype.onParse = function (node, parser) {
  if (node.name !== 'interactive-flow') {
    return;
  }

  const widgetId = node.attrs['widget-id'];
  const flows = this.vm.properties.interactiveFlows || [];
  const flowData = flows.find((item) => item && item.id === widgetId);

  // 没有对应数据的占位节点直接移除（旧版本正文兼容）
  if (!flowData) {
    return false;
  }

  node.hasFlow = true;
  node.flowData = flowData;

  // rich-text 内部无法渲染自定义组件，必须暴露祖先链
  parser.expose();
};

/**
 * @description dom 树加载完毕时触发（load 事件）
 */
InteractiveFlowPlugin.prototype.onLoad = function () {};

/**
 * @description 组件被移除时触发
 */
InteractiveFlowPlugin.prototype.onDetached = function () {};

module.exports = InteractiveFlowPlugin;
