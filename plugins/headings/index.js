/**
 * @fileoverview headings 插件
 * 提取文章中的 H1-H6 标题，生成目录结构，并监听滚动高亮当前标题
 */
let headingIndex = 0;

function Headings(vm) {
  this.vm = vm;
  this.vm._ids = {}; // 初始化 _ids 映射
  this.headings = [];
  this.observers = []; // IntersectionObserver 实例数组
  this.visibleHeadings = new Map(); // 完整可视的标题（ratio === 1）
  this.currentHeadingIndex = -1; // 当前选中节点的索引
  this.updateTimer = null; // 节流定时器
}

/**
 * @description 内容更新时重置
 */
Headings.prototype.onUpdate = function () {
  // 清理旧的 observer
  this.stopObserver();

  this.headings = [];
  this.vm._ids = {}; // 重置 _ids 映射
  this.visibleHeadings.clear();
  this.currentHeadingIndex = -1; // 重置当前节点索引
  headingIndex = 0;
};

/**
 * @description 组件 detached 时清理
 */
Headings.prototype.onDetached = function () {
  this.stopObserver();
};

/**
 * @description 停止滚动监听
 */
Headings.prototype.stopObserver = function () {
  if (this.updateTimer) {
    clearTimeout(this.updateTimer);
    this.updateTimer = null;
  }
  // 断开所有观察器
  if (this.observers && this.observers.length > 0) {
    this.observers.forEach((obs) => {
      if (obs) {
        obs.disconnect();
      }
    });
    this.observers = [];
  }
  this.visibleHeadings.clear();
};

/**
 * @description 解析时收集标题信息
 */
Headings.prototype.onParse = function (node) {
  // 匹配 h1-h6 标签
  const match = node.name ? node.name.match(/^h([1-6])$/i) : null;

  if (match) {
    const level = parseInt(match[1]);

    // 生成唯一标识符（用于外部引用）
    const externalId = 'mp-heading-' + headingIndex++;

    // 生成简短的 DOM ID（用于内部渲染）
    const domId = 'h' + this.headings.length;

    // 建立 ID 映射：外部 ID -> DOM ID
    this.vm._ids[externalId] = domId;

    // 设置 DOM ID
    node.attrs.id = domId;

    // 提取标题文本（移除 HTML 标签）
    const text = this.extractText(node);

    this.headings.push({
      id: externalId, // 保存外部 ID
      _domId: domId, // 保存 DOM ID
      level: level,
      text: text,
      index: this.headings.length,
    });
  }
};

/**
 * @description 提取节点文本内容
 */
Headings.prototype.extractText = function (node) {
  if (!node.children) return '';

  let text = '';
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child.type === 'text') {
      text += child.text;
    } else if (child.children) {
      text += this.extractText(child);
    }
  }
  return text.trim();
};

/**
 * @description 加载完成后触发事件并启动滚动监听
 */
Headings.prototype.onLoad = function () {
  if (this.headings.length === 0) return;

  // 构建树形结构
  const tree = this.buildTree(this.headings);

  // 触发事件通知外部
  this.vm.triggerEvent('headingsready', {
    headings: tree,
    flat: this.headings,
  });

  // 启动滚动监听
  setTimeout(() => {
    this.startObserver();
    // 初始化当前节点为第一个完整可视的节点
    this.updateCurrentHeading();
  }, 500);
};

/**
 * @description 启动滚动监听
 */
Headings.prototype.startObserver = function () {
  if (this.headings.length === 0) return;

  // 为每个标题创建单独的 IntersectionObserver
  // 微信小程序中每个 IntersectionObserver 只能调用一次 observe
  this.headings.forEach((heading) => {
    const domId = heading._domId;
    const selector = `#_root >>> #${domId}`;

    const observer = wx.createIntersectionObserver(this.vm, {
      thresholds: [1],
      nativeMode: true,
    });

    observer.relativeToViewport();

    observer.observe(selector, (res) => {
      // 只保留完整可视的节点（ratio === 1）
      if (res.intersectionRatio === 1) {
        this.visibleHeadings.set(domId, heading);
      } else {
        this.visibleHeadings.delete(domId);
      }

      // 节流更新
      if (this.updateTimer) {
        clearTimeout(this.updateTimer);
      }
      this.updateTimer = setTimeout(() => {
        this.updateCurrentHeading();
      }, 150);
    });

    this.observers.push(observer);
  });
};

/**
 * @description 触发 headingchange 事件
 */
Headings.prototype.triggerHeadingChange = function (heading) {
  console.debug('[headings 插件] 选中标题:', heading.id, 'index:', heading.index);
  this.vm.triggerEvent('headingchange', {
    id: heading.id,
    _domId: heading._domId,
    text: heading.text,
    level: heading.level,
  });
};

/**
 * @description 更新当前标题
 */
Headings.prototype.updateCurrentHeading = function () {
  // 1. 如果有完整可视节点，选择 index 最小的
  if (this.visibleHeadings.size > 0) {
    let bestIndex = Infinity;
    let bestHeading = null;

    this.visibleHeadings.forEach((heading) => {
      if (heading.index < bestIndex) {
        bestIndex = heading.index;
        bestHeading = heading;
      }
    });

    if (bestHeading && bestHeading.index !== this.currentHeadingIndex) {
      this.currentHeadingIndex = bestHeading.index;
      this.triggerHeadingChange(bestHeading);
    }
    return;
  }
};

/**
 * @description 构建树形结构
 */
Headings.prototype.buildTree = function (headings) {
  const root = [];
  const stack = [];

  headings.forEach((heading) => {
    const node = { ...heading, children: [] };

    // 从栈中移除同级或上级节点
    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  });

  return root;
};

module.exports = Headings;
