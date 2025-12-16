/**
 * @fileoverview 图片锚点容器组件
 * 用于在图片上显示锚点，并管理解读弹窗
 */
import { checkIsPc, checkIsSkyline } from './utils';

Component({
  options: {
    addGlobalClass: true,
  },

  properties: {
    /**
     * @description 节点数据（包含图片信息和锚点数据）
     */
    node: {
      type: Object,
      value: {},
    },

    /**
     * @description 组件选项
     */
    opts: {
      type: Array,
      value: [],
    },
  },

  data: {
    imageLoaded: false, // 图片是否加载完成
    imageWidth: 0, // 图片实际显示宽度
    imageHeight: 0, // 图片实际显示高度
    anchors: [], // 锚点数组
    styles: [], // 预设样式
    mode: 'container', // 弹窗模式
    animation: true, // 是否显示动画
    activeAnchor: null, // 当前激活的锚点
    tooltipPosition: 'bottom', // 弹窗位置
    anchorY: 50, // 锚点 y 坐标（百分比）
    anchorSizePercent: 8, // 锚点大小（百分比，相对于图片宽度）
    tooltipOffset: 4, // 弹窗偏移量（百分比，相对于图片高度）
    tooltipVisible: false, // 弹窗是否可见（用于动画控制）
    tooltipClosing: false, // 弹窗是否正在关闭（用于关闭动画）
    showModal: false, // 是否显示 modal 弹窗
    modalClosing: false, // Modal 弹窗是否正在关闭（用于关闭动画）
    showMask: false, // 是否显示遮罩层
    isPc: false, // 是否是 PC 端
    isSkyline: false, // 是否使用 Skyline 渲染引擎
    isVideoFullscreen: false, // 视频是否全屏
  },

  lifetimes: {
    attached() {
      // 判断是否是 PC 端
      this.setData({
        isPc: checkIsPc(),
        isSkyline: checkIsSkyline(),
      })
      // 获取根组件的配置
      this.initFromRoot();
    },
  },

  pageLifetimes: {
    resize() {
      this.initImageDimensions();
    }
  },

  methods: {
    /**
     * @description 从节点数据获取配置
     */
    initFromRoot() {
      const { node } = this.properties;

      // 从 node.anchorData 获取所有配置（由 index.js 在解析时设置）
      let anchors = [];
      let styles = [];
      let mode = 'container';
      let animation = true;

      if (node.anchorData) {
        anchors = node.anchorData.anchors || [];
        styles = node.anchorData.styles || [];
        mode = node.anchorData.tooltipMode || 'container';
        animation = node.anchorData.showAnimation !== false;
      }

      this.setData({
        anchors,
        styles,
        mode,
        animation,
      });
    },

    /**
     * @description 图片加载完成
     */
    onImageLoad(e) {
      const { width, height } = e.detail;
      console.log('[image-anchor] 图片加载完成，原始尺寸：', width, height);

      this.initImageDimensions();

      // 触发原有的图片加载事件
      this.triggerEvent('imgload', e.detail);
    },

    initImageDimensions() {
      // 获取图片实际显示尺寸
      const query = this.createSelectorQuery();
      query
        .select('.anchor-image')
        .boundingClientRect((rect) => {
          if (rect) {
            this.setData({
              imageLoaded: true,
              imageWidth: rect.width,
              imageHeight: rect.height,
            });
            console.log('[image-anchor] 图片实际显示尺寸：', rect.width, rect.height);
          }
        })
        .exec();
    },

    /**
     * @description 图片加载失败
     */
    onImageError(e) {
      this.triggerEvent('imgerror', e.detail);
    },

    /**
     * @description 图片点击
     */
    onImageTap(e) {
      // 如果点击的是锚点，不处理
      if (e.target && e.target.dataset && e.target.dataset.anchor) {
        return;
      }

      const { node } = this.data;
      this.triggerEvent('imgtap', node.attrs);
    },

    /**
     * @description 锚点点击
     */
    onAnchorTap(e) {
      const { anchor } = e.detail || {};
      if (!anchor) return;
      this.setData({
        activeAnchor: null, // 先清空当前锚点，确保每次点击都能触发更新
        tooltipVisible: false, // 先设为 false
      });

      const { mode } = this.data;

      // 计算弹窗位置（安全访问 position）
      // 锚点在图片上半部分（y < 50%）时弹窗在锚点下方，否则在锚点上方
      const position = anchor.position || { x: 50, y: 50 };
      const tooltipPosition = position.y >= 50 ? 'top' : 'bottom';
      // 保存锚点的 y 坐标用于定位弹窗
      const anchorY = position.y;
      // 获取锚点大小（百分比，相对于图片宽度）
      const anchorSizePercent = anchor.style?.size || 8;

      // 计算弹窗偏移量（锚点高度的一半，转换为相对于图片高度的百分比）
      const { imageWidth, imageHeight } = this.data;
      let tooltipOffset = anchorSizePercent / 2; // 默认值
      if (imageWidth && imageHeight) {
        // 锚点实际高度相对于图片高度的百分比
        const anchorHeightPercent = anchorSizePercent * (imageWidth / imageHeight);
        tooltipOffset = anchorHeightPercent / 2;
      }

      this.setData({
        activeAnchor: anchor,
        tooltipPosition,
        anchorY,
        anchorSizePercent,
        tooltipOffset,
        tooltipClosing: false,
        showModal: mode === 'modal',
        showMask: mode === 'container', // 容器模式显示遮罩
      });

      // 延迟设置 visible，确保 DOM 渲染后再触发动画
      if (mode === 'container') {
        setTimeout(() => {
          this.setData({ tooltipVisible: true });
        }, 20);
      }

      // 触发锚点点击事件
      this.triggerEvent('anchortap', { anchor });

      // 触发弹窗显示事件
      this.triggerEvent('tooltipshow', { anchor });
    },

    /**
     * @description 关闭弹窗
     */
    onTooltipClose() {
      const { activeAnchor, mode } = this.data;

      if (mode === 'container') {
        // 容器模式：先播放关闭动画，再移除元素
        this.setData({
          tooltipClosing: true,
        });

        // 动画结束后移除元素
        setTimeout(() => {
          this.setData({
            activeAnchor: null,
            tooltipVisible: false,
            tooltipClosing: false,
            showMask: false,
          });
          // 触发弹窗隐藏事件
          this.triggerEvent('tooltiphide', { anchor: activeAnchor });
        }, 300); // 与 CSS 动画时长一致
      } else {
        // Modal 模式：先播放关闭动画，再移除元素
        this.setData({
          modalClosing: true,
        });

        // 动画结束后移除元素
        setTimeout(() => {
          this.setData({
            activeAnchor: null,
            showModal: false,
            modalClosing: false,
            showMask: false,
            tooltipVisible: false,
          });
          // 触发弹窗隐藏事件
          this.triggerEvent('tooltiphide', { anchor: activeAnchor });
        }, 300); // 与 CSS 动画时长一致
      }
    },

    /**
     * @description 页面切换事件
     */
    onPageChange(e) {
      this.triggerEvent('pagechange', {
        ...e.detail,
        anchor: this.data.activeAnchor,
      });
    },

    /**
     * @description 视频全屏状态变化事件
     * @param {Event} e 全屏状态变化事件对象
     */
    onVideoFullscreenChange(e) {
      const { fullScreen } = e.detail;
      console.log('[image-anchor] 视频全屏状态变化:', fullScreen);
      this.setData({
        isVideoFullscreen: fullScreen,
      });
    },

    /**
     * @description 点击遮罩关闭
     */
    onMaskTap() {
      this.onTooltipClose();
    },

    /**
     * @description 点击容器内遮罩关闭弹窗
     */
    onContainerMaskTap() {
      this.onTooltipClose();
    },

    /**
     * @description 弹窗中图片点击事件（使用与 node 组件相同的处理逻辑）
     */
    onTooltipImgTap(e) {
      const { src } = e.detail || {};
      if (!src) return;

      // 获取根组件（mp-html）
      const root = this.getRoot();
      if (!root) {
        // 如果没有根组件，直接预览图片
        wx.previewImage({
          urls: [src],
          current: src,
        });
        return;
      }

      // 触发 imgtap 事件
      root.triggerEvent('imgtap', { src });

      // 如果开启了图片预览，使用根组件的图片列表进行预览
      if (root.properties.previewImg) {
        const imgList = root.imgList || [src];
        wx.previewImage({
          showmenu: root.properties.showImgMenu,
          current: src,
          urls: imgList.includes(src) ? imgList : [src],
        });
      }
    },

    /**
     * @description 获取根组件（mp-html）
     */
    getRoot() {
      // 向上查找 mp-html 根组件
      let parent = this.selectOwnerComponent();
      while (parent) {
        if (parent.imgList !== undefined) {
          return parent;
        }
        parent = parent.selectOwnerComponent ? parent.selectOwnerComponent() : null;
      }
      return null;
    },

    /**
     * @description 阻止事件冒泡
     */
    stopPropagation() {
      // 空函数，用于阻止点击穿透
    },
  },
});
