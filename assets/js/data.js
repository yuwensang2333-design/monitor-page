/* ==========================================================================
   模拟数据源（真实项目中可替换为 WebSocket / HTTP 接口）
   ========================================================================== */
(function (global) {
  'use strict';

  const SR = global.SR = global.SR || {};

  /* ---------------- 总览大屏数据 ---------------- */
  const summary = {
    total: 1081,
    normal: 1024,
    alarmDevice: 181
  };
  summary.rate = (summary.alarmDevice / summary.total) * 100;

  // 设备健康度（%）
  const health = [
    { name: '交换机', value: 100 },
    { name: '隧道PLC', value: 94 },
    { name: '隧道火大', value: 94 },
    { name: '电话广播', value: 95.3 },
    { name: 'NVR', value: 95.1 },
    { name: '情报板', value: 96 },
    { name: '服务器', value: 100 },
    { name: '摄像机', value: 92.3 },
    { name: '电力监控', value: 95 },
    { name: '对讲终端', value: 95 }
  ];

  // 设备分类数量
  const deviceCount = [
    { name: '交换机', value: 9, key: 'switch' },
    { name: '隧道PLC', value: 303, key: 'plc' },
    { name: '隧道火大', value: 1034, key: 'fire' },
    { name: '电话广播', value: 328, key: 'broadcast' },
    { name: 'NVR', value: 43, key: 'nvr' },
    { name: '情报板', value: 50, key: 'signboard' },
    { name: '服务器', value: 4, key: 'server' },
    { name: '摄像机', value: 599, key: 'camera' },
    { name: '电力监控', value: 66, key: 'power' },
    { name: '对讲终端', value: 48, key: 'intercom' }
  ];

  // 告警等级数量分布
  const alarmLevels = [
    { name: '普通', value: 136, color: '#ff8a1f', dark: '#a34f00' },
    { name: '重要', value: 43, color: '#ff3b4e', dark: '#9c1224' },
    { name: '紧急', value: 37, color: '#8f1b24', dark: '#4d0a12' },
    { name: '提示', value: 0, color: '#8fa3bb', dark: '#4b5b70' }
  ];

  // 当前告警列表（大屏）
  const alarms = [
    { name: 'PLC主机获取数据失败', device: 'XBLJLS_2_PLC12', level: '重要', dur: 330 },
    { name: 'Nvr_通道异常', device: '平安收费站NVR29', level: '普通', dur: 356 },
    { name: '摄像机_无法获取数据告警', device: '九台山隧道CA73', level: '普通', dur: 793 },
    { name: '摄像机_无法获取数据告警', device: '蓝田收费站蓝田值机(监控)网络异常', level: '普通', dur: 1213 },
    { name: '隧道水泵房监测设备, 报警时间异常', device: '九连山隧道阳下X3K42+340消防水泵', level: '普通', dur: 1443 },
    { name: 'PLC主机获取数据失败', device: 'XBLJLS_3_PLC17', level: '重要', dur: 1550 },
    { name: '摄像机_离线告警', device: '九连山隧道CA42', level: '紧急', dur: 2713 },
    { name: '隧道风机故障', device: 'JF4.2', level: '重要', dur: 3050 },
    { name: 'Nvr_通道异常', device: '平安收费站NVR31', level: '普通', dur: 3836 },
    { name: 'Nvr_磁盘异常告警', device: '平安收费站NVR31', level: '普通', dur: 3836 }
  ];

  // 过去 7 天转采设备产生告警数量
  const weekTop = [
    { name: '交换机', value: 1 },
    { name: '隧道PLC', value: 34 },
    { name: '隧道火大', value: 4 },
    { name: '电话广播', value: 16 },
    { name: 'NVR', value: 8 },
    { name: '情报板', value: 4 },
    { name: '服务器', value: 4 },
    { name: '摄像机', value: 8 },
    { name: '电力监控', value: 25 },
    { name: '对讲终端', value: 1 }
  ];

  /* ---------------- 告警监测页数据 ---------------- */
  const deviceAlarms = [
    { name: '交换机', key: 'switch', count: 3 },
    { name: '隧道火灾设备', key: 'fire', count: 3 },
    { name: '电话和广播', key: 'broadcast', count: 0 },
    { name: 'NVR', key: 'nvr', count: 0 },
    { name: '摄像机', key: 'camera', count: 0 },
    { name: '采集服务状态', key: 'collect', count: 0 },
    { name: '情报板', key: 'signboard', count: 0 },
    { name: '动环监控', key: 'env', count: 0 },
    { name: '隧道PLC', key: 'plc', count: 0 },
    { name: '隧道消防', key: 'firefight', count: 28 },
    { name: '收费站网络质量监测', key: 'net', count: 0 },
    { name: '收费站车道监测', key: 'lane', count: 36 },
    { name: '门架监测', key: 'gantry', count: 19 },
    { name: '隧道风机', key: 'fan', count: 91 },
    { name: '隧道照明', key: 'light', count: 0 },
    { name: 'Linux服务器', key: 'server', count: 0 },
    { name: '软件进程端口', key: 'process', count: 1 },
    { name: '隧道车道指示灯', key: 'laneLight', count: 0 },
    { name: '隧道交通灯', key: 'trafficLight', count: 0 },
    { name: '卷帘门', key: 'roller', count: 14 },
    { name: '电力监控', key: 'power', count: 12 },
    { name: 'Windows服务器', key: 'windows', count: 1 }
  ];

  // 当前确认告警数占比
  const confirmShare = [
    { name: '普通告警', value: 118, color: '#8f3a86' },
    { name: '重要告警', value: 46, color: '#2f5fbf' },
    { name: '紧急告警', value: 19, color: '#1f8f8f' },
    { name: '提示告警', value: 9, color: '#3f7fa8' }
  ];

  // 告警明细
  const alarmRows = [
    {
      name: 'Nvr_时间偏差告警', device: '研发设计部nvr',
      desc: '录像机研发设计部nvr 时间偏差大于一分钟', level: '重要', dur: 5 * 3600 + 6 * 60 + 35
    },
    {
      name: 'Nvr_时间偏差告警', device: '研发设计部nvr2',
      desc: '录像机研发设计部nvr2 时间偏差大于一分钟', level: '重要', dur: 5 * 3600 + 6 * 60 + 35
    },
    {
      name: '进程未运行告警', device: '陆运一体化主机',
      desc: '主机路运一体化主机进程报警服务未运行', level: '普通', dur: 5 * 3600 + 5 * 60 + 17
    },
    {
      name: '摄像机_离线告警', device: '九连山隧道CA42',
      desc: '摄像机与平台通信中断，最后在线时间为 08:12:04', level: '紧急', dur: 6 * 3600 + 41 * 60 + 8
    },
    {
      name: '隧道风机故障', device: 'JF4.2',
      desc: '风机反馈信号异常，就地控制箱启动失败', level: '重要', dur: 7 * 3600 + 12 * 60 + 46
    },
    {
      name: 'PLC主机获取数据失败', device: 'XBLJLS_2_PLC12',
      desc: 'PLC 心跳超时，连续 3 个周期未收到数据报文', level: '重要', dur: 8 * 3600 + 3 * 60 + 12
    },
    {
      name: '车道指示灯通信异常', device: '蓝田收费站LD-06',
      desc: '车道指示灯与区域控制器通信异常，状态不可信', level: '普通', dur: 9 * 3600 + 26 * 60 + 51
    },
    {
      name: '卷帘门状态异常', device: '九台山隧道JL-03',
      desc: '卷帘门限位开关未复位，当前处于半开状态', level: '紧急', dur: 10 * 3600 + 8 * 60 + 2
    },
    {
      name: 'Nvr_磁盘异常告警', device: '平安收费站NVR31',
      desc: '录像机磁盘可用空间低于 10%，请及时清理', level: '普通', dur: 11 * 3600 + 32 * 60 + 27
    },
    {
      name: '情报板通信超时', device: '九连山隧道QB-12',
      desc: '可变情报板通信超时，当前显示内容与中心不一致', level: '普通', dur: 12 * 3600 + 15 * 60 + 33
    },
    {
      name: '电力监控_电压越限', device: '九台山隧道配电房',
      desc: 'A 相电压 268V 超过上限阈值，持续时间超过 5 分钟', level: '重要', dur: 13 * 3600 + 44 * 60 + 19
    },
    {
      name: '隧道消防_水压异常', device: '九连山隧道XFS-07',
      desc: '消防管网水压低于 0.25MPa，疑似管道泄漏', level: '紧急', dur: 14 * 3600 + 2 * 60 + 40
    },
    {
      name: '收费站网络质量监测_丢包', device: '平安收费站出口车道',
      desc: '链路丢包率 12.6%，连续 10 个采样周期异常', level: '普通', dur: 15 * 3600 + 9 * 60 + 5
    },
    {
      name: '门架监测_识别率下降', device: '蓝田门架GJ-02',
      desc: '门架车牌识别率 91.2% 低于 95% 考核阈值', level: '普通', dur: 16 * 3600 + 21 * 60 + 14
    }
  ];

  SR.data = {
    summary, health, deviceCount, alarmLevels, alarms, weekTop,
    deviceAlarms, confirmShare, alarmRows
  };

  /* ---------------- 实时变化模拟 ---------------- */
  const EXTRA_ALARMS = [
    { name: '摄像机_离线告警', device: '蓝田收费站出口广场CA18', level: '普通' },
    { name: 'PLC主机获取数据失败', device: 'XBLJLS_4_PLC21', level: '重要' },
    { name: 'Nvr_通道异常', device: '九台山隧道NVR07', level: '普通' },
    { name: '隧道风机故障', device: 'JF2.6', level: '紧急' },
    { name: '隧道消防_水压异常', device: '九连山隧道XFS-11', level: '紧急' },
    { name: '情报板通信超时', device: '蓝田收费站QB-04', level: '普通' }
  ];

  /**
   * 生成一条新的告警（用于演示实时推送）
   */
  SR.nextAlarm = function nextAlarm() {
    const base = EXTRA_ALARMS[Math.floor(Math.random() * EXTRA_ALARMS.length)];
    return {
      name: base.name,
      device: base.device,
      level: base.level,
      dur: Math.floor(Math.random() * 40) + 5
    };
  };

  SR.nextDetailAlarm = function nextDetailAlarm(index) {
    const base = EXTRA_ALARMS[Math.floor(Math.random() * EXTRA_ALARMS.length)];
    return {
      name: base.name,
      device: base.device,
      desc: '设备运行状态异常，系统已自动派单并推送至运维值班人员',
      level: base.level,
      dur: Math.floor(Math.random() * 600) + 30
    };
  };
})(window);
