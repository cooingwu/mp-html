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
        this.setData({
          pages: anchor.tooltipPages,
          currentIndex: 0,
          currentPage: anchor.tooltipPages[0] || null
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
      const { currentIndex, pages } = this.data
      if (currentIndex < pages.length - 1) {
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
