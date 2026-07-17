// ==========================================
// 页面联动系统 - 实现页面间数据传递和跳转
// ==========================================

window.LinkageSystem = {
    // 当前选中的设备
    currentDevice: null,
    
    // 选中设备后跳转并高亮
    selectDevice(deviceId, deviceName, deviceType) {
        this.currentDevice = { id: deviceId, name: deviceName, type: deviceType };
        
        // 根据类型跳转到对应页面
        if (deviceType === 'substation') {
            navigateTo('substations');
        } else if (deviceType === 'powerplant') {
            navigateTo('powerplants');
        } else if (deviceType === 'alarm') {
            navigateTo('alarms');
        }
        
        // 存储到全局状态，目标页面可以读取
        sessionStorage.setItem('selectedDevice', JSON.stringify(this.currentDevice));
    },
    
    // 从告警跳转到故障推演
    startSimulationFromAlarm(alarmId) {
        navigateTo('simulation');
        sessionStorage.setItem('simulationAlarm', alarmId);
    },
    
    // 查看设备详情
    viewDeviceDetail(deviceId) {
        // 可以在这里实现弹窗详情
        alert(`正在查看设备: ${deviceId}\n\n（完整功能开发中...）`);
    },
    
    // 钻取分析
    drillDown(type, params) {
        switch(type) {
            case 'load':
                navigateTo('forecast');
                break;
            case 'health':
                navigateTo('health');
                break;
            case 'renewable':
                navigateTo('renewable');
                break;
            case 'alarm':
                navigateTo('alarms');
                break;
        }
    }
};

// 页面加载完成后检查是否有传递的参数
document.addEventListener('DOMContentLoaded', () => {
    const selectedDevice = sessionStorage.getItem('selectedDevice');
    if (selectedDevice) {
        console.log('选中设备:', JSON.parse(selectedDevice));
        // 可以在这里实现自动定位和高亮
    }
});

console.log('✅ 页面联动系统已加载');
