module.exports = [
    { name: 'List Directory', description: 'List all files and directories', command: 'dir' },
    { name: 'Check Network', description: 'Ping Google DNS', command: 'ping 8.8.8.8 -n 4' },
    { name: 'System Info', description: 'Display system information', command: 'systeminfo' },
    { name: 'IP Configuration', description: 'Show network configurations', command: 'ipconfig' },
    { name: 'Clear Console', description: 'Clear the console output', command: 'cls' },
    { name: 'Check Devices', description: 'Check the devices are connected', command: 'adb devices' },
    { name: 'Monitor log', description: 'Monitor adb logcat', command: 'adb logcat' },
];
