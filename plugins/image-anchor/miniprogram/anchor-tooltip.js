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
        // 处理云存储路径，获取临时 URL
        this.processCloudUrls(anchor.tooltipPages).then((processedPages) => {
          this.setData(
            {
              pages: processedPages,
              currentIndex: 0,
              swiperHeight: 0,
            },
            () => {
              // 内容更新后计算高度
              this.calculateSwiperHeight();
            }
          );
        });
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
     * @description 处理云存储路径，获取临时 URL
     * @param {Array} pages 解读页列表
     * @returns {Promise<Array>} 处理后的解读页列表
     */
    async processCloudUrls(pages) {
      if (!pages || pages.length === 0) return pages;

      // 收集所有需要转换的云存储路径
      const cloudPaths = [];
      pages.forEach((page) => {
        if (page.image && page.image.startsWith('cloud://')) {
          cloudPaths.push(page.image);
        }
        if (page.video && page.video.startsWith('cloud://')) {
          cloudPaths.push(page.video);
        }
        if (page.videoCover && page.videoCover.startsWith('cloud://')) {
          cloudPaths.push(page.videoCover);
        }
        if (page.audio && page.audio.startsWith('cloud://')) {
          cloudPaths.push(page.audio);
        }
        if (page.audioCover && page.audioCover.startsWith('cloud://')) {
          cloudPaths.push(page.audioCover);
        }
      });

      if (cloudPaths.length === 0) return pages;

      try {
        // 获取临时 URL
        const res = await wx.cloud.getTempFileURL({ fileList: cloudPaths });

        // 构建 fileID -> tempFileURL 的映射
        const urlMap = {};
        res.fileList.forEach((item) => {
          if (item.tempFileURL) {
            urlMap[item.fileID] = item.tempFileURL;
          }
        });

        // 手动深拷贝，避免 JSON 序列化问题
        const processedPages = pages.map((page) => {
          const newPage = {
            id: page.id,
            type: page.type,
            title: page.title,
            content: page.content,
            image: page.image,
            video: page.video,
            videoCover: page.videoCover,
            audio: page.audio,
            audioCover: page.audioCover,
            audioTitle: page.audioTitle,
          };

          // 替换云存储路径
          if (newPage.image && urlMap[newPage.image]) {
            newPage.image = urlMap[newPage.image];
          }
          if (newPage.video && urlMap[newPage.video]) {
            newPage.video = urlMap[newPage.video];
          }
          if (newPage.videoCover && urlMap[newPage.videoCover]) {
            newPage.videoCover = urlMap[newPage.videoCover];
          }
          if (newPage.audio && urlMap[newPage.audio]) {
            newPage.audio = urlMap[newPage.audio];
          }
          if (newPage.audioCover && urlMap[newPage.audioCover]) {
            newPage.audioCover = urlMap[newPage.audioCover];
          }

          return newPage;
        });

        return processedPages;
      } catch (err) {
        console.error('获取云存储临时 URL 失败:', err);
        return pages;
      }
    },

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
          const maxHeight = screenHeight * 0.7;
          const minHeight = screenHeight * 0.2;
          console.log('[calculateSwiperHeight] modal模式', { maxHeight, minHeight });

          // 如果包含视频，使用最大高度以确保视频完整显示
          if (hasVideo) {
            // 计算视频需要的高度：padding(32) + 视频(4:3比例)
            const containerWidth = screenWidth - 24; // 减去左右 padding
            const videoHeight = (containerWidth - 32) * 0.75; // 4:3 比例
            let swiperHeight = videoHeight + 32; // 加上 padding
            console.log('[calculateSwiperHeight] 视频高度计算', { containerWidth, videoHeight, swiperHeight });

            // 应用 max 约束
            swiperHeight = Math.min(swiperHeight, maxHeight - paginationHeight);
            console.log('[calculateSwiperHeight] 应用max约束后:', swiperHeight);

            if (swiperHeight > 0 && swiperHeight !== this.data.swiperHeight) {
              console.log('[calculateSwiperHeight] 设置视频 swiperHeight:', swiperHeight);
              this.setData({ swiperHeight });
            }
            return;
          }

          // 非视频内容：根据内容计算高度
          const query = this.createSelectorQuery();
          query.selectAll('.content-edge-' + currentIndex).boundingClientRect();
          query.exec((res) => {
            const scrollRects = res[0] || [];
            console.log('[calculateSwiperHeight] 查询 .content-edge 结果:', scrollRects);

            // 取所有页面内容的最大高度
            let maxContentHeight = 0;
            scrollRects.forEach((rect, idx) => {
              console.log(`[calculateSwiperHeight] 第${idx}页内容高度:`, rect?.height);
              if (rect && rect.height > maxContentHeight) {
                maxContentHeight = rect.height;
              }
            });

            if (maxContentHeight <= 0) {
              maxContentHeight = 150;
              console.log('[calculateSwiperHeight] 内容高度为0，使用默认值:', maxContentHeight);
            }

            // 计算 swiper 高度
            let swiperHeight = maxContentHeight;
            console.log('[calculateSwiperHeight] 初始 swiperHeight:', swiperHeight);

            // 应用 min/max 约束
            swiperHeight = Math.max(swiperHeight, minHeight - paginationHeight);
            swiperHeight = Math.min(swiperHeight, maxHeight - paginationHeight);
            console.log('[calculateSwiperHeight] 应用min/max约束后:', swiperHeight);

            if (swiperHeight > 0 && swiperHeight !== this.data.swiperHeight) {
              console.log('[calculateSwiperHeight] 设置 swiperHeight:', swiperHeight);
              this.setData({ swiperHeight });
            } else {
              console.log('[calculateSwiperHeight] 高度未变化，跳过设置', { swiperHeight, current: this.data.swiperHeight });
            }
          });
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
        this.setData({
          currentIndex: index,
        }, () => {
          this.calculateSwiperHeight();
        });

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
          this.setData({
            currentIndex: current,
          }, () => {
            this.calculateSwiperHeight();
          });

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

    audioContext: null, // 音频上下文

    /**
     * @description 初始化音频播放器
     */
    initAudio() {
      const { pages, currentIndex } = this.data;
      const currentPage = pages[currentIndex];
      if (!currentPage || currentPage.type !== 'audio' || !currentPage.audio) return;

      this.destroyAudio();

      const audioContext = wx.createInnerAudioContext();
      audioContext.src = currentPage.audio;

      audioContext.onCanplay(() => {
        this.setData({
          audioDuration: audioContext.duration,
        });
      });

      audioContext.onTimeUpdate(() => {
        this.setData({
          audioCurrentTime: audioContext.currentTime,
        });
      });

      audioContext.onPlay(() => {
        this.setData({ isPlaying: true });
      });

      audioContext.onPause(() => {
        this.setData({ isPlaying: false });
      });

      audioContext.onEnded(() => {
        this.setData({
          isPlaying: false,
          audioCurrentTime: 0,
        });
      });

      audioContext.onError((err) => {
        console.error('音频播放错误', err);
        this.setData({ isPlaying: false });
      });

      this.audioContext = audioContext;
    },

    /**
     * @description 播放/暂停音频
     */
    toggleAudio() {
      if (!this.audioContext) {
        this.initAudio();
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
