/**
 * @fileoverview 解读弹窗组件
 * 用于显示锚点的解读内容，支持多页切换
 * PC端：分页控制翻页，swiper禁止滑动
 * 移动端：swiper滑动翻页，显示原生dots
 */

Component({
  properties: {
    /**
     * @description 锚点数据
     */
    anchor: {
      type: Object,
      value: null,
    },

    /**
     * @description 弹窗位置（容器模式下使用）
     * @type {'top' | 'bottom'}
     */
    position: {
      type: String,
      value: 'bottom',
    },

    /**
     * @description 显示模式
     * @type {'container' | 'modal'}
     */
    mode: {
      type: String,
      value: 'container',
    },

    /**
     * @description 是否显示关闭按钮
     */
    showClose: {
      type: Boolean,
      value: true,
    },

    /**
     * @description 是否是 PC 端
     */
    isPc: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    pages: [], // 解读页列表
    currentIndex: 0, // 当前页索引
    swiperHeight: 0, // swiper 动态高度
    isPlaying: false, // 音频是否播放中
    audioDuration: 0, // 音频时长
    audioCurrentTime: 0, // 音频当前时间
  },

  observers: {
    anchor: function (anchor) {
      if (anchor && anchor.tooltipPages) {
        this.setData(
          {
            pages: anchor.tooltipPages,
            currentIndex: 0,
            swiperHeight: 0,
          },
          () => {
            // 内容更新后计算高度
            this.calculateSwiperHeight();
          }
        );
      } else {
        this.setData({
          pages: [],
          currentIndex: 0,
          swiperHeight: 0,
        });
      }
    },
  },

  lifetimes: {
    detached() {
      // 清理音频资源
      this.destroyAudio();
    },
  },

  methods: {
    /**
     * @description 计算 swiper 的动态高度
     */
    calculateSwiperHeight() {
      const { mode, isPc, pages, currentIndex } = this.data;
      console.log('[calculateSwiperHeight] 开始计算', { mode, isPc, pagesLength: pages.length, currentIndex });

      // 空页面不计算
      if (!pages || pages.length === 0) {
        console.log('[calculateSwiperHeight] 空页面，跳过计算');
        return;
      }

      // 检查是否包含视频类型
      const hasVideo = pages[currentIndex].type === 'video';
      console.log('[calculateSwiperHeight] 是否包含视频:', hasVideo);

      // 延迟执行，确保 DOM 渲染完成
      setTimeout(() => {
        const windowInfo = wx.getWindowInfo();
        const screenHeight = windowInfo.windowHeight;
        const screenWidth = windowInfo.windowWidth;
        const paginationHeight = isPc && pages.length > 1 ? 40 : 0;
        console.log('[calculateSwiperHeight] 屏幕信息', { screenHeight, screenWidth, paginationHeight });

        if (mode === 'container') {
          // container 模式：获取父容器高度，减去分页控制高度
          const query = this.createSelectorQuery();
          query.select('.tooltip-container').boundingClientRect();
          query.exec((res) => {
            const containerHeight = res[0]?.height || 0;
            const swiperHeight = containerHeight - paginationHeight;
            console.log('[calculateSwiperHeight] container模式', { containerHeight, paginationHeight, swiperHeight });
            if (swiperHeight > 0 && swiperHeight !== this.data.swiperHeight) {
              console.log('[calculateSwiperHeight] 设置 swiperHeight:', swiperHeight);
              this.setData({ swiperHeight });
            }
          });
        } else {
          // modal 模式
          const height = screenHeight * 0.4;
          console.log('[calculateSwiperHeight] modal模式', { height });
          this.setData({ swiperHeight: height });
          return;
        }
      }, 100);
    },

    /**
     * @description 关闭弹窗
     */
    onClose() {
      this.destroyAudio();
      this.triggerEvent('close');
    },

    /**
     * @description 上一页（PC 端使用）
     */
    prevPage() {
      const { currentIndex } = this.data;
      if (currentIndex > 0) {
        this.goToPage(currentIndex - 1);
      }
    },

    /**
     * @description 下一页（PC 端使用）
     */
    nextPage() {
      const { currentIndex, pages } = this.data;
      if (currentIndex < pages.length - 1) {
        this.goToPage(currentIndex + 1);
      }
    },

    /**
     * @description 跳转到指定页（PC 端分页控制使用）
     * @param {Number|Object} indexOrEvent 页索引或事件对象
     */
    goToPage(indexOrEvent) {
      let index;
      if (typeof indexOrEvent === 'number') {
        index = indexOrEvent;
      } else {
        index = indexOrEvent.currentTarget.dataset.index;
      }

      const { pages, currentIndex } = this.data;
      if (index >= 0 && index < pages.length && index !== currentIndex) {
        // 停止当前音频
        this.destroyAudio();

        // PC 端：更新 currentIndex，swiper 通过 current 属性响应
        this.setData(
          {
            currentIndex: index,
          },
          () => {
            this.calculateSwiperHeight();
          }
        );

        // 触发页面切换事件
        this.triggerEvent('pagechange', {
          index,
          page: pages[index],
        });
      }
    },

    /**
     * @description Swiper 滑动切换事件（仅移动端使用）
     * @param {Event} e swiper change 事件对象
     */
    onSwiperChange(e) {
      const { current, source } = e.detail;
      const { pages, currentIndex } = this.data;

      // 只处理用户手动滑动
      if (source === 'touch') {
        if (current !== currentIndex && current >= 0 && current < pages.length) {
          // 停止当前音频
          this.destroyAudio();

          // 更新 currentIndex
          this.setData(
            {
              currentIndex: current,
            },
            () => {
              this.calculateSwiperHeight();
            }
          );

          // 触发页面切换事件
          this.triggerEvent('pagechange', {
            index: current,
            page: pages[current],
          });
        }
      }
    },

    /**
     * @description 图片点击预览
     */
    onImageTap(e) {
      const src = e.currentTarget.dataset.src;
      if (src) {
        // 触发 imgtap 事件给父组件处理
        this.triggerEvent('imgtap', { src });
      }
    },

    /**
     * @description 视频播放事件
     */
    onVideoPlay() {
      // 可以在此处理视频播放统计等
    },

    /**
     * @description 视频全屏状态变化事件
     * @param {Event} e 全屏状态变化事件对象
     */
    onVideoFullscreenChange(e) {
      const { fullScreen } = e.detail;
      console.log('[onVideoFullscreenChange] 全屏状态变化:', fullScreen);
      // 触发事件通知父组件
      this.triggerEvent('videofullscreenchange', { fullScreen });
    },

    audioContext: null, // 音频上下文

    /**
     * @description 初始化音频播放器
     * @param {Boolean} autoPlay 是否自动播放
     */
    initAudio(autoPlay = false) {
      const { pages, currentIndex } = this.data;
      const currentPage = pages[currentIndex];
      if (!currentPage || currentPage.type !== 'audio' || !currentPage.audio) return;

      this.destroyAudio();

      const audioContext = wx.createInnerAudioContext();
      audioContext.src = currentPage.audio;

      audioContext.onCanplay(() => {
        console.log('[initAudio] 音频准备就绪, duration:', audioContext.duration);
        this.setData({
          audioDuration: audioContext.duration,
        });
        // 如果需要自动播放
        if (autoPlay) {
          audioContext.play();
        }
      });

      audioContext.onTimeUpdate(() => {
        const updateData = {
          audioCurrentTime: audioContext.currentTime,
        };
        // 移动端 duration 可能在 onCanplay 时还未获取到，需要在播放过程中更新
        if (audioContext.duration > 0 && this.data.audioDuration !== audioContext.duration) {
          updateData.audioDuration = audioContext.duration;
        }
        this.setData(updateData);
      });

      audioContext.onPlay(() => {
        console.log('[initAudio] 开始播放, duration:', audioContext.duration);
        const updateData = { isPlaying: true };
        // 移动端可能在播放开始时才能获取到 duration
        if (audioContext.duration > 0 && this.data.audioDuration !== audioContext.duration) {
          updateData.audioDuration = audioContext.duration;
        }
        this.setData(updateData);
      });

      audioContext.onPause(() => {
        console.log('[initAudio] 暂停');
        this.setData({ isPlaying: false });
      });

      audioContext.onEnded(() => {
        console.log('[initAudio] 播放结束');
        this.setData({
          isPlaying: false,
          audioCurrentTime: 0,
        });
      });

      audioContext.onError((err) => {
        console.error('[initAudio] 音频播放错误', err);
        this.setData({ isPlaying: false });
      });

      this.audioContext = audioContext;
    },

    /**
     * @description 播放/暂停音频
     */
    toggleAudio() {
      console.log('[toggleAudio] 点击, isPlaying:', this.data.isPlaying, 'audioContext:', !!this.audioContext);

      if (!this.audioContext) {
        // 初始化并自动播放
        this.initAudio(true);
        return;
      }

      if (this.data.isPlaying) {
        this.audioContext.pause();
      } else {
        this.audioContext.play();
      }
    },

    /**
     * @description 销毁音频上下文
     */
    destroyAudio() {
      if (this.audioContext) {
        this.audioContext.stop();
        this.audioContext.destroy();
        this.audioContext = null;
        this.setData({
          isPlaying: false,
          audioCurrentTime: 0,
          audioDuration: 0,
        });
      }
    },

    /**
     * @description 阻止事件冒泡
     */
    stopPropagation() {
      // 空函数，用于阻止点击穿透
    },
  },
});
