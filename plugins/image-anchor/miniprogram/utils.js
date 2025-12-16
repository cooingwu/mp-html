/**
 * @description 判断是否是 PC 端
 */
const checkIsPc = () => {
  try {
    const deviceInfo = wx.getDeviceInfo();
    console.log('设备信息：', deviceInfo);
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
    const skylineInfo = wx.getSkylineInfoSync();
    console.log('Skyline 信息：', skylineInfo);
    return skylineInfo.isSupported;
  } catch (e) {
    console.error('获取 Skyline 信息失败', e);
  }
};

export { checkIsPc, checkIsSkyline };
