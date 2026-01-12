/**
 * @description 判断是否是 PC 端
 */
const checkIsPc = () => {
  try {
    const deviceInfo = wx.getDeviceInfo();
    return deviceInfo.platform === 'windows' || deviceInfo.platform === 'mac' || deviceInfo.platform === 'ohos_pc';
  } catch (e) {
    console.error('获取系统信息失败', e);
  }
};

/**
 * @description 判断是否是 Skyline 渲染引擎
 */
const checkIsSkyline = () => {
  try {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    return currentPage.renderer === 'skyline';
  } catch (e) {
    console.error('获取 Skyline 信息失败', e);
  }
};

export { checkIsPc, checkIsSkyline };
