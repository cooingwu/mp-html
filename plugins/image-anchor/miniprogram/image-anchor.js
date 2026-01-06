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
     * @description 节点数据（包含图片信息和锚点数据）- 插件模式
     */
    node: {
      type: Object,
      value: {},
    },

    /**
     * @description 组件选项 - 插件模式
     */
    opts: {
      type: Array,
      value: [],
    },

    // ========== 独立模式属性 ==========

    /**
     * @description 图片地址 - 独立模式
     */
    src: {
      type: String,
      value: '',
    },

    /**
     * @description 图片裁剪/缩放模式 - 独立模式
     */
    imgMode: {
      type: String,
      value: 'widthFix',
    },

    /**
     * @description 是否懒加载 - 独立模式
     */
    lazyLoad: {
      type: Boolean,
      value: false,
    },

    /**
     * @description 长按显示菜单（默认关闭）- 独立模式
     */
    showMenuByLongpress: {
      type: Boolean,
      value: false,
    },

    /**
     * @description 图片样式 - 独立模式
     */
    imgStyle: {
      type: String,
      value: '',
    },

    /**
     * @description 图片 ID - 独立模式
     */
    imgId: {
      type: String,
      value: '',
    },

    /**
     * @description 图片索引 - 独立模式
     * 用于追踪图片在多图列表中的位置，类似插件模式的 node.i
     */
    imgIndex: {
      type: Number,
      value: -1,
    },

    /**
     * @description 图片 CSS 类名 - 独立模式
     */
    imgClass: {
      type: String,
      value: '',
    },

    /**
     * @description 自定义 data 属性 - 独立模式
     * 用于传递自定义数据，如 data-id、data-custom 等
     * 传入对象形式：{ id: '123', custom: 'value' }
     * 会被转换为 attrs 中的 data-id、data-custom
     */
    dataAttrs: {
      type: Object,
      value: {},
    },

    /**
     * @description 锚点数据数组 - 独立模式
     */
    anchors: {
      type: Array,
      value: [],
    },

    /**
     * @description 预设样式 - 独立模式
     */
    styles: {
      type: Array,
      value: [],
    },

    /**
     * @description 弹窗显示模式 - 独立模式
     */
    mode: {
      type: String,
      value: 'container',
    },

    /**
     * @description 是否显示锚点动画 - 独立模式
     */
    animation: {
      type: Boolean,
      value: true,
    },

    /**
     * @description 是否使用 root-portal - 独立模式
     * false 时 modal 会在组件内部显示（可能在 movable-view 中受影响）
     * true 时 modal 会使用 root-portal 脱离父容器（需要基础库 2.26.1+）
     */
    useRootPortal: {
      type: Boolean,
      value: true,
    },
  },

  data: {
    imageLoaded: false, // 图片是否加载完成
    imageWidth: 0, // 图片实际显示宽度
    imageHeight: 0, // 图片实际显示高度
    imageLeft: 0, // 图片在容器中的左侧偏移
    imageTop: 0, // 图片在容器中的顶部偏移
    originalImageWidth: 0, // 图片原始宽度
    originalImageHeight: 0, // 图片原始高度
    activeAnchor: null, // 当前激活的锚点
    tooltipPosition: 'bottom', // 弹窗位置
    tooltipTop: 0, // 弹窗 top 位置（像素）
    tooltipBottom: 0, // 弹窗 bottom 位置（像素）
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
    isStandalone: false, // 是否是独立模式
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
     * @description 从节点数据和根组件获取配置（支持双模式）
     */
    initFromRoot() {
      let anchors, styles, mode, animation;

      // 判断使用哪种模式
      const isStandalone = !this.properties.node || Object.keys(this.properties.node).length === 0;

      // 设置模式状态
      this.setData({ isStandalone });

      if (!isStandalone) {
        // 模式 1：插件模式 - 从 node 对象和根组件获取
        console.log('[image-anchor] 使用插件模式');
        const { node } = this.properties;
        anchors = node.anchorData?.anchors || [];

        // 从根组件获取全局配置（避免在每个节点重复存储）
        const root = this.getRoot();
        styles = root?.properties.anchorStyles || [];
        mode = root?.properties.tooltipMode || 'container';
        animation = root?.properties.showAnchorAnimation !== false;
        this.setData({
          anchors,
          styles,
          mode,
          animation,
        });
      }
    },

    /**
     * @description 图片加载完成
     */
    onImageLoad(e) {
      const { width, height } = e.detail;
      console.log('[image-anchor] 图片加载完成，原始尺寸：', width, height);

      // 保存图片原始尺寸
      this.setData({
        originalImageWidth: width,
        originalImageHeight: height,
      });

      this.initImageDimensions();

      // 触发原有的图片加载事件
      this.triggerEvent('imgload', e.detail);
    },

    initImageDimensions() {
      // 获取图片实际显示尺寸和位置
      const query = this.createSelectorQuery();
      query
        .select('.anchor-image')
        .boundingClientRect((rect) => {
          if (rect) {
            // 同时获取容器的位置
            this.createSelectorQuery()
              .select('.image-anchor-container')
              .boundingClientRect((containerRect) => {
                if (containerRect) {
                  const { originalImageWidth, originalImageHeight } = this.data;

                  let imageLeft = rect.left - containerRect.left;
                  let imageTop = rect.top - containerRect.top;
                  let imageWidth = rect.width;
                  let imageHeight = rect.height;

                  // 如果有原始图片尺寸，计算 aspectFit 模式下的实际内容区域
                  if (originalImageWidth && originalImageHeight && rect.width && rect.height) {
                    // 判断是否使用 aspectFit 或类似保持比例的模式
                    const imgMode = this.properties.imgMode || (!this.properties.node?.h ? 'widthFix' : (!this.properties.node?.w ? 'heightFix' : (this.properties.node?.m || 'scaleToFill')));
                    const isAspectFit = imgMode === 'aspectFit' || imgMode === 'aspectFill';

                    if (isAspectFit) {
                      // 计算容器的宽高比
                      const containerRatio = containerRect.width / containerRect.height;
                      // 计算图片的宽高比
                      const imageRatio = originalImageWidth / originalImageHeight;

                      if (imgMode === 'aspectFit') {
                        // aspectFit: 保持完整图片，可能留白
                        if (imageRatio > containerRatio) {
                          // 图片更宽，宽度填满，高度可能留白
                          imageWidth = containerRect.width;
                          imageHeight = containerRect.width / imageRatio;
                          imageLeft = 0;
                          imageTop = (containerRect.height - imageHeight) / 2;
                        } else {
                          // 图片更高，高度填满，宽度可能留白
                          imageWidth = containerRect.height * imageRatio;
                          imageHeight = containerRect.height;
                          imageLeft = (containerRect.width - imageWidth) / 2;
                          imageTop = 0;
                        }
                      } else if (imgMode === 'aspectFill') {
                        // aspectFill: 填满容器，可能裁剪
                        if (imageRatio > containerRatio) {
                          // 图片更宽，高度填满，宽度被裁剪
                          imageWidth = containerRect.height * imageRatio;
                          imageHeight = containerRect.height;
                          imageLeft = (containerRect.width - imageWidth) / 2;
                          imageTop = 0;
                        } else {
                          // 图片更高，宽度填满，高度被裁剪
                          imageWidth = containerRect.width;
                          imageHeight = containerRect.width / imageRatio;
                          imageLeft = 0;
                          imageTop = (containerRect.height - imageHeight) / 2;
                        }
                      }

                      console.log('[image-anchor] aspectFit 计算结果：', {
                        containerRatio: containerRatio.toFixed(2),
                        imageRatio: imageRatio.toFixed(2),
                        resultSize: { width: imageWidth, height: imageHeight },
                        offset: { left: imageLeft, top: imageTop }
                      });
                    }
                  }

                  this.setData({
                    imageLoaded: true,
                    imageWidth,
                    imageHeight,
                    imageLeft,
                    imageTop,
                  });
                  console.log('[image-anchor] 图片实际显示尺寸和位置：', {
                    width: imageWidth,
                    height: imageHeight,
                    left: imageLeft,
                    top: imageTop
                  });
                } else {
                  // 如果无法获取容器位置，使用默认值
                  this.setData({
                    imageLoaded: true,
                    imageWidth: rect.width,
                    imageHeight: rect.height,
                  });
                  console.log('[image-anchor] 图片实际显示尺寸：', rect.width, rect.height);
                }
              })
              .exec();
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

      // 判断使用哪种模式
      const isStandalone = !this.properties.node || Object.keys(this.properties.node).length === 0;

      if (isStandalone) {
        // 独立模式：构建完整的 attrs 对象
        const attrs = {
          src: this.properties.src,
          id: this.properties.imgId,
          class: this.properties.imgClass,
          style: this.properties.imgStyle,
        };

        // 添加 data-* 属性
        const dataAttrs = this.properties.dataAttrs || {};
        for (const key in dataAttrs) {
          attrs[`data-${key}`] = dataAttrs[key];
        }

        this.triggerEvent('imgtap', attrs);
      } else {
        // 插件模式：传递 node.attrs
        const { node } = this.properties;
        this.triggerEvent('imgtap', node.attrs);
      }
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

      const { mode, imageLeft, imageTop, imageWidth, imageHeight } = this.data;

      // 计算弹窗位置（安全访问 position）
      // 锚点在图片上半部分（y < 50%）时弹窗在锚点下方，否则在锚点上方
      const position = anchor.position || { x: 50, y: 50 };
      const tooltipPosition = position.y >= 50 ? 'top' : 'bottom';
      // 保存锚点的 y 坐标用于定位弹窗
      const anchorY = position.y;
      // 获取锚点大小（百分比，相对于图片宽度）
      const anchorSizePercent = anchor.style?.size || 8;

      // 计算弹窗偏移量（锚点高度的一半，转换为相对于图片高度的百分比）
      let tooltipOffset = anchorSizePercent / 2; // 默认值
      if (imageWidth && imageHeight) {
        // 锚点实际高度相对于图片高度的百分比
        const anchorHeightPercent = anchorSizePercent * (imageWidth / imageHeight);
        tooltipOffset = anchorHeightPercent / 2;
      }

      // 计算弹窗的实际像素位置
      let tooltipTop = 0;
      let tooltipBottom = 0;
      if (tooltipPosition === 'bottom') {
        // 弹窗在锚点下方：top = 图片top + 锚点y位置 + 偏移
        tooltipTop = imageTop + imageHeight * (anchorY / 100) + imageHeight * (tooltipOffset / 100);
      } else if (tooltipPosition === 'top') {
        // 弹窗在锚点上方：top = 图片top + 锚点y位置 - 偏移 - 预估弹窗高度
        // 预估弹窗高度为图片高度的 40%（与 max-height 一致）
        const estimatedTooltipHeight = imageHeight * 0.4;
        tooltipTop = imageTop + imageHeight * (anchorY / 100) - imageHeight * (tooltipOffset / 100) - estimatedTooltipHeight;
        // 确保 top 不会小于 0
        if (tooltipTop < 0) tooltipTop = 0;
      }

      console.log('[image-anchor] 弹窗位置计算：', {
        tooltipPosition,
        imageTop,
        imageHeight,
        anchorY,
        tooltipOffset,
        tooltipTop,
        tooltipBottom
      });

      this.setData({
        activeAnchor: anchor,
        tooltipPosition,
        anchorY,
        anchorSizePercent,
        tooltipOffset,
        tooltipTop,
        tooltipClosing: false,
        showModal: mode === 'modal',
        showMask: mode === 'container', // 容器模式显示遮罩
      });

      // 如果是 modal 模式，触发事件让父组件显示 modal（用于在页面级别显示，摆脱 transform context）
      if (mode === 'modal') {
        this.triggerEvent('modalshow', { anchor });
      }

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
