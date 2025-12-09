/**
 * @fileoverview 解读弹窗组件
 * 用于显示锚点的解读内容，支持多页切换
 */

Component({
  properties: {
    /**
     * @description 锚点数据
     */
    anchor: {
      type: Object,
      value: null
    },

    /**
     * @description 弹窗位置（容器模式下使用）
     * @type {'top' | 'bottom'}
     */
    position: {
      type: String,
      value: 'bottom'
    },

    /**
     * @description 显示模式
     * @type {'container' | 'modal'}
     */
    mode: {
      type: String,
      value: 'container'
    }
  },

  data: {
    pages: [], // 解读页列表
    currentIndex: 0, // 当前页索引
    currentPage: null, // 当前页数据
    audioContext: null, // 音频上下文
    isPlaying: false, // 音频是否播放中
    audioDuration: 0, // 音频时长
    audioCurrentTime: 0 // 音频当前时间
  },

  observers: {
    'anchor': function(anchor) {
      if (anchor && anchor.tooltipPages) {
        // 转换云存储链接
        this.convertCloudUrls(anchor.tooltipPages).then(pages => {
          this.setData({
            pages: pages,
            currentIndex: 0,
            currentPage: pages[0] || null
          })
        })
      } else {
        this.setData({
          pages: [],
          currentIndex: 0,
          currentPage: null
        })
      }
    }
  },

  lifetimes: {
    detached() {
      // 清理音频资源
      this.destroyAudio()
    }
  },

  methods: {
    /**
     * @description 判断是否为云存储链接
     * @param {String} url 链接地址
     * @returns {Boolean}
     */
    isCloudUrl(url) {
      return url && typeof url === 'string' && url.startsWith('cloud://')
    },

    /**
     * @description 转换云存储链接为临时链接
     * @param {Array} pages 解读页列表
     * @returns {Promise<Array>} 转换后的页面列表
     */
    async convertCloudUrls(pages) {
      if (!pages || !pages.length) return pages

      // 收集所有需要转换的云存储链接
      const fileList = []
      const fileMap = {} // 记录链接在pages中的位置

      pages.forEach((page, pageIndex) => {
        const fields = ['image', 'videoCover', 'video', 'audioCover', 'audio']
        fields.forEach(field => {
          if (this.isCloudUrl(page[field])) {
            fileList.push({
              fileID: page[field],
              maxAge: 7200 // 2小时有效期
            })
            fileMap[page[field]] = { pageIndex, field }
          }
        })
      })

      // 没有需要转换的链接
      if (!fileList.length) return pages

      // 调用云存储接口转换
      try {
        const res = await wx.cloud.getTempFileURL({
          fileList: fileList.map(f => f.fileID)
        })

        // 复制pages避免修改原数据
        const newPages = JSON.parse(JSON.stringify(pages))

        // 替换为临时链接
        if (res.fileList) {
          res.fileList.forEach(file => {
            if (file.tempFileURL && fileMap[file.fileID]) {
              const { pageIndex, field } = fileMap[file.fileID]
              newPages[pageIndex][field] = file.tempFileURL
            }
          })
        }

        return newPages
      } catch (err) {
        console.error('转换云存储链接失败', err)
        return pages
      }
    },

    /**
     * @description 关闭弹窗
     */
    onClose() {
      this.destroyAudio()
      this.triggerEvent('close')
    },

    /**
     * @description 上一页
     */
    prevPage() {
      const { currentIndex, pages } = this.data
      if (currentIndex > 0) {
        this.goToPage(currentIndex - 1)
      }
    },

    /**
     * @description 下一页
     */
    nextPage() {
      const { currentIndex } = this.data
      if (currentIndex < this.data.pages.length - 1) {
        this.goToPage(currentIndex + 1)
      }
    },

    /**
     * @description 跳转到指定页
     * @param {Number|Object} indexOrEvent 页索引或事件对象
     */
    goToPage(indexOrEvent) {
      let index
      if (typeof indexOrEvent === 'number') {
        index = indexOrEvent
      } else {
        index = indexOrEvent.currentTarget.dataset.index
      }

      const { pages, currentIndex } = this.data
      if (index >= 0 && index < pages.length && index !== currentIndex) {
        // 停止当前音频
        this.destroyAudio()

        this.setData({
          currentIndex: index,
          currentPage: pages[index]
        })

        // 触发页面切换事件
        this.triggerEvent('pagechange', {
          index,
          page: pages[index]
        })
      }
    },

    /**
     * @description 图片点击预览
     */
    onImageTap(e) {
      const src = e.currentTarget.dataset.src
      if (src) {
        wx.previewImage({
          urls: [src],
          current: src
        })
      }
    },

    /**
     * @description 视频播放事件
     */
    onVideoPlay() {
      // 可以在此处理视频播放统计等
    },

    /**
     * @description 初始化音频播放器
     */
    initAudio() {
      const { currentPage } = this.data
      if (!currentPage || currentPage.type !== 'audio' || !currentPage.audio) return

      this.destroyAudio()

      const audioContext = wx.createInnerAudioContext()
      audioContext.src = currentPage.audio

      audioContext.onCanplay(() => {
        this.setData({
          audioDuration: audioContext.duration
        })
      })

      audioContext.onTimeUpdate(() => {
        this.setData({
          audioCurrentTime: audioContext.currentTime
        })
      })

      audioContext.onPlay(() => {
        this.setData({ isPlaying: true })
      })

      audioContext.onPause(() => {
        this.setData({ isPlaying: false })
      })

      audioContext.onEnded(() => {
        this.setData({
          isPlaying: false,
          audioCurrentTime: 0
        })
      })

      audioContext.onError((err) => {
        console.error('音频播放错误', err)
        this.setData({ isPlaying: false })
      })

      this.audioContext = audioContext
    },

    /**
     * @description 播放/暂停音频
     */
    toggleAudio() {
      if (!this.audioContext) {
        this.initAudio()
      }

      if (this.data.isPlaying) {
        this.audioContext.pause()
      } else {
        this.audioContext.play()
      }
    },

    /**
     * @description 销毁音频上下文
     */
    destroyAudio() {
      if (this.audioContext) {
        this.audioContext.stop()
        this.audioContext.destroy()
        this.audioContext = null
        this.setData({
          isPlaying: false,
          audioCurrentTime: 0,
          audioDuration: 0
        })
      }
    },

    /**
     * @description 格式化时间
     * @param {Number} seconds 秒数
     * @returns {String} 格式化后的时间
     */
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    },

    /**
     * @description 阻止事件冒泡
     */
    stopPropagation() {
      // 空函数，用于阻止点击穿透
    }
  }
})
