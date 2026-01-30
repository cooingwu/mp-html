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

    /**
     * @description 是否自动监听图片尺寸变化
     * true 时使用定时轮询监听并重新计算锚点位置
     * false 时需要手动监听容器尺寸变化
     */
    autoResize: {
      type: Boolean,
      value: false,
    },

    /**
     * @description 容器缩放比例因子
     * 当父容器被 transform: scale() 缩放时，传入缩放值（如 0.333）
     * 组件会将查询到的容器尺寸除以该值，得到真实布局尺寸
     * 用于解决高分辨率渲染方案中的 transform 影响问题
     */
    containerScaleFactor: {
      type: Number,
      value: 1,  // 默认为 1，不影响现有使用场景
    },
  },

  data: {
    imageLoaded: false, // 图片是否加载完成
    imageWidth: 0, // 图片实际显示宽度
    imageHeight: 0, // 图片实际显示高度
    imageLeft: 0, // 图片在容器中的左侧偏移
    imageTop: 0, // 图片在容器中的顶部偏移
    activeAnchor: null, // 当前激活的锚点
    tooltipPosition: 'bottom', // 弹窗位置
    tooltipTop: 0, // 弹窗 top 位置（像素）
    tooltipVisible: false, // 弹窗是否可见（用于动画控制）
    tooltipClosing: false, // 弹窗是否正在关闭（用于关闭动画）
    showModal: false, // 是否显示 modal 弹窗
    modalClosing: false, // Modal 弹窗是否正在关闭（用于关闭动画）
    showMask: false, // 是否显示遮罩层
    isPc: false, // 是否是 PC 端
    isSkyline: false, // 是否使用 Skyline 渲染引擎（传递给子组件）
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
      // 获取根组件的配置（包括 autoResize）
      this.initFromRoot();
    },

    detached() {
      // 清理定时器
      this._stopSizeCheck();
    }
  },

  pageLifetimes: {
    resize() {
      this.initImageDimensions();
    }
  },

  methods: {
    /**
     * @description 启动定时检查尺寸变化
     * @private
     */
    _startSizeCheck() {
      console.debug('[image-anchor] 启动定时尺寸检查');

      // 避免重复启动
      if (this._sizeCheckTimer) {
        return;
      }

      // 每 1000ms 检查一次尺寸变化
      this._sizeCheckTimer = setInterval(() => {
        if (!this.data.imageLoaded) {
          return;
        }

        // 获取当前图片尺寸
        this.createSelectorQuery()
          .select('.anchor-image')
          .boundingClientRect((rect) => {
            if (!rect) return;

            // 首次检查时只记录尺寸
            if (!this._lastImageSize) {
              this._lastImageSize = {
                width: rect.width,
                height: rect.height
              };
              return;
            }

            // 获取当前尺寸
            const currentWidth = rect.width;
            const currentHeight = rect.height;
            const previousWidth = this._lastImageSize.width;
            const previousHeight = this._lastImageSize.height;

            // 检测尺寸变化（阈值 2px）
            const widthChanged = Math.abs(currentWidth - previousWidth) > 2;
            const heightChanged = Math.abs(currentHeight - previousHeight) > 2;

            if (widthChanged || heightChanged) {
              console.debug('[image-anchor] 检测到图片尺寸变化:', {
                old: { width: previousWidth, height: previousHeight },
                new: { width: currentWidth, height: currentHeight }
              });

              // 重新计算锚点位置
              this.initImageDimensions();

              // 更新缓存的尺寸
              this._lastImageSize = {
                width: currentWidth,
                height: currentHeight
              };
            }
          })
          .exec();
      }, 500);
    },

    /**
     * @description 停止定时检查
     * @private
     */
    _stopSizeCheck() {
      if (this._sizeCheckTimer) {
        clearInterval(this._sizeCheckTimer);
        this._sizeCheckTimer = null;
        console.debug('[image-anchor] 停止定时尺寸检查');
      }
    },

    /**
     * @description 从节点数据和根组件获取配置（支持双模式）
     */
    initFromRoot() {
      let anchors, styles, mode, animation, autoResize;

      // 判断使用哪种模式
      const isStandalone = !this.properties.node || Object.keys(this.properties.node).length === 0;

      // 设置模式状态
      this.setData({ isStandalone });

      if (!isStandalone) {
        // 模式 1：插件模式 - 从 node 对象和根组件获取
        console.debug('[image-anchor] 使用插件模式');
        const { node } = this.properties;
        anchors = node.anchorData?.anchors || [];

        // 从根组件获取全局配置（避免在每个节点重复存储）
        const root = this.getRoot();
        styles = root?.properties.anchorStyles || [];
        mode = root?.properties.tooltipMode || 'container';
        animation = root?.properties.showAnchorAnimation !== false;
        autoResize = root?.properties.anchorAutoResize || false;

        console.debug('[image-anchor] 从根组件获取配置:', {
          hasAnchorStyles: !!(root?.properties.anchorStyles),
          tooltipMode: mode,
          showAnchorAnimation: animation,
          anchorAutoResize: autoResize
        });

        this.setData({
          anchors,
          styles,
          mode,
          animation,
          autoResize,
        });
      }

      // 如果启用了自动监听，启动定时检查
      // 注意：使用刚获取的 autoResize 变量，而不是 this.data.autoResize（因为 setData 是异步的）
      if (autoResize || this.properties.autoResize) {
        console.debug('[image-anchor] 启动自动尺寸监听');
        this._startSizeCheck();
      }
    },

    /**
     * @description 图片加载完成
     */
    onImageLoad(e) {
      const { width, height } = e.detail;
      console.debug('[image-anchor] 图片加载完成，原始尺寸：', width, height);

      // ✅ 保存图片原始尺寸到实例变量（不需要 setData）
      this._originalImageWidth = width;
      this._originalImageHeight = height;

      // ✅ 使用 wx.nextTick 确保视图已渲染后再查询
      wx.nextTick(() => {
        this.initImageDimensions();
      });

      // 触发原有的图片加载事件
      this.triggerEvent('imgload', e.detail);
    },

    initImageDimensions() {
      // ✅ 使用批量查询确保获取同一时刻的快照
      const query = this.createSelectorQuery();
      query.select('.anchor-image').boundingClientRect();
      query.select('.image-anchor-container').boundingClientRect();

      query.exec((res) => {
        const rect = res[0];
        const containerRect = res[1];

        if (!rect) {
          console.warn('[image-anchor] 无法获取图片位置信息');
          return;
        }

        if (!containerRect) {
          // 如果无法获取容器位置，使用默认值
          this.setData({
            imageLoaded: true,
            imageWidth: rect.width,
            imageHeight: rect.height,
          });
          console.debug('[image-anchor] 图片实际显示尺寸：', rect.width, rect.height);
          return;
        }

        // ✅ 此时 rect 和 containerRect 是同一时刻的快照
        const { _originalImageWidth: originalImageWidth, _originalImageHeight: originalImageHeight } = this;

        // ✅ 添加日志验证数据是否已更新
        console.debug('[image-anchor] 原始图片尺寸:', {
          originalImageWidth,
          originalImageHeight,
          hasData: !!(originalImageWidth && originalImageHeight)
        });

        // 获取缩放因子（默认为 1）
        const scaleFactor = this.properties.containerScaleFactor || 1;

        // 将查询到的容器尺寸除以缩放因子，得到真实布局尺寸
        const realContainerWidth = containerRect.width / scaleFactor;
        const realContainerHeight = containerRect.height / scaleFactor;

        console.debug('[image-anchor] 查询结果（同一时刻快照）:', {
          image: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
          container: { top: containerRect.top, left: containerRect.left, width: containerRect.width, height: containerRect.height },
          scaleFactor: scaleFactor
        });

        // 图片在容器中的偏移也需要除以缩放因子
        let imageLeft = (rect.left - containerRect.left) / scaleFactor;
        let imageTop = (rect.top - containerRect.top) / scaleFactor;
        let imageWidth = rect.width;
        let imageHeight = rect.height;

        // 如果有原始图片尺寸，根据图片模式计算实际显示尺寸
        if (originalImageWidth && originalImageHeight && rect.width && rect.height) {
          // 判断图片模式
          const imgMode = this.properties.imgMode || (!this.properties.node?.h ? 'widthFix' : (!this.properties.node?.w ? 'heightFix' : (this.properties.node?.m || 'scaleToFill')));

          console.debug('[image-anchor] 图片模式:', { imgMode, propImgMode: this.properties.imgMode, nodeH: this.properties.node?.h, nodeW: this.properties.node?.w, nodeM: this.properties.node?.m });

          if (imgMode === 'widthFix') {
            // ✅ widthFix 模式：宽度固定，高度根据原始尺寸计算
            // 不依赖查询到的高度（因为查询时可能不准确）
            imageWidth = rect.width;
            if (rect.width > 0) {
              imageHeight = rect.width / originalImageWidth * originalImageHeight;
            }
            console.debug('[image-anchor] widthFix 模式计算:', {
              containerWidth: rect.width,
              originalWidth: originalImageWidth,
              originalHeight: originalImageHeight,
              calculatedHeight: imageHeight
            });
          } else if (imgMode === 'heightFix') {
            // heightFix 模式：高度固定，宽度根据原始尺寸计算
            imageHeight = rect.height;
            if (rect.height > 0) {
              imageWidth = rect.height / originalImageHeight * originalImageWidth;
            }
          } else if (imgMode === 'aspectFit' || imgMode === 'aspectFill') {
            // aspectFit/aspectFill 模式：保持宽高比，可能裁剪或留白
            const containerRatio = realContainerWidth / realContainerHeight;
            const imageRatio = originalImageWidth / originalImageHeight;

            if (imgMode === 'aspectFit') {
              // aspectFit: 保持完整图片，可能留白
              if (imageRatio > containerRatio) {
                // 图片更宽，宽度填满，高度可能留白
                imageWidth = realContainerWidth;
                imageHeight = realContainerWidth / imageRatio;
                imageLeft = 0;
                imageTop = (realContainerHeight - imageHeight) / 2;
              } else {
                // 图片更高，高度填满，宽度可能留白
                imageWidth = realContainerHeight * imageRatio;
                imageHeight = realContainerHeight;
                imageLeft = (realContainerWidth - imageWidth) / 2;
                imageTop = 0;
              }
            } else {
              // aspectFill: 填满容器，可能裁剪
              if (imageRatio > containerRatio) {
                // 图片更宽，高度填满，宽度被裁剪
                imageWidth = realContainerHeight * imageRatio;
                imageHeight = realContainerHeight;
                imageLeft = (realContainerWidth - imageWidth) / 2;
                imageTop = 0;
              } else {
                // 图片更高，宽度填满，高度被裁剪
                imageWidth = realContainerWidth;
                imageHeight = realContainerWidth / imageRatio;
                imageLeft = 0;
                imageTop = (realContainerHeight - imageHeight) / 2;
              }
            }

            console.debug('[image-anchor] aspectFit/aspectFill 计算结果：', {
              mode: imgMode,
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

        console.debug('[image-anchor] ✅ 最终计算结果：', {
          width: imageWidth,
          height: imageHeight,
          left: imageLeft,
          top: imageTop,
          valid: imageTop >= 0 && imageLeft >= 0
        });
      });
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

      // 注意：不需要使用缩放因子，因为 imageWidth 和 imageHeight 已经是补偿后的真实尺寸
      // 计算弹窗偏移量（锚点高度的一半，转换为相对于图片高度的百分比）
      let tooltipOffset = anchorSizePercent / 2; // 默认值
      if (imageWidth && imageHeight) {
        // 锚点实际高度相对于图片高度的百分比
        const anchorHeightPercent = anchorSizePercent * (imageWidth / imageHeight);
        tooltipOffset = anchorHeightPercent / 2;
      }

      // 计算弹窗的实际像素位置
      let tooltipTop = 0;
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

      console.debug('[image-anchor] 弹窗位置计算：', {
        tooltipPosition,
        imageTop,
        imageHeight,
        anchorY,
        tooltipOffset,
        tooltipTop
      });

      this.setData({
        activeAnchor: anchor,
        tooltipPosition,
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
      console.debug('[image-anchor] 视频全屏状态变化:', fullScreen);
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
    stopPropagation(e) {
      // 空函数，用于阻止点击穿透
      console.debug('[image-anchor] stopPropagation', e);
    },
  },
});
