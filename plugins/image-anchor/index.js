/**
 * @fileoverview 图片锚点插件入口文件
 * 用于在富文本图片上显示可点击的锚点
 */

/**
 * @description 组件被创建时将实例化插件
 * @param {Component} vm 组件实例
 */
function ImageAnchorPlugin(vm) {
  this.vm = vm;
  this.imageIndex = 0; // 图片计数器
}

/**
 * @description html 数据更新时触发
 * @param {string} content 要更新的 html 字符串
 * @param {object} config 解析配置
 * @returns {string|void}
 */
ImageAnchorPlugin.prototype.onUpdate = function (content, config) {
  // 重置图片计数器
  this.imageIndex = 0;
};

/**
 * @description 解析到一个标签时触发
 * @param {object} node 标签
 * @param {object} parser 解析器实例
 * @returns {boolean|void} 如果返回 false 将移除该标签
 */
ImageAnchorPlugin.prototype.onParse = function (node, parser) {
  // 只处理 img 标签
  if (node.name === 'img') {
    const src = node.attrs.src || '';
    const currentIndex = this.imageIndex++;

    // 获取锚点配置（扁平结构：每个锚点独立存储）
    const imageAnchors = this.vm.properties.imageAnchors || [];

    // 过滤出该图片的所有锚点（通过 imageIndex 或 imageSrc 匹配）
    const matchedAnchors = imageAnchors.filter(
      (anchor) => anchor.imageIndex === currentIndex || (anchor.imageSrc && src.includes(anchor.imageSrc))
    );

    node.attrs['image-index'] = currentIndex;

    // 如果该图片有锚点
    if (matchedAnchors.length > 0) {
      node.attrs['has-anchors'] = true;
      // 标记该图片有锚点
      node.hasAnchors = true;

      // 只存储锚点数据，全局配置从根组件获取（避免数据冗余）
      node.anchorData = {
        anchors: matchedAnchors,
      };
    }
  }
};

/**
 * @description dom 树加载完毕时触发（load 事件）
 */
ImageAnchorPlugin.prototype.onLoad = function () {
  // 可以在此处初始化一些资源
};

/**
 * @description 组件被移除时触发
 */
ImageAnchorPlugin.prototype.onDetached = function () {
  // 清理资源
  this.imageIndex = 0;
};

module.exports = ImageAnchorPlugin;
