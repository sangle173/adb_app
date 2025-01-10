module.exports = [
    { name: 'List Directory', description: 'List all files and directories', command: 'dir' },
    { name: 'Check Network', description: 'Ping Google DNS', command: 'ping 8.8.8.8 -n 4' },
    { name: 'System Info', description: 'Display system information', command: 'systeminfo' },
    { name: 'IP Configuration', description: 'Show network configurations', command: 'ipconfig' },
    { name: 'Clear Console', description: 'Clear the console output', command: 'cls' },
    { name: 'Check Devices', description: 'Check the devices are connected', command: 'adb devices' },
    { name: 'Monitor log', description: 'Monitor adb logcat', command: 'adb logcat' },
    { name: 'Check NSUD Build', description: 'Build Info', command: 'adb shell getprop ro.build.fingerprint' },
    { name: 'Check ApexVersion', description: 'Check Apex', command: 'adb shell cat /apex/com.sonos.player/VERSION' },
    { name: 'Skip BLE', description: 'Force to AP Connect', command: 'adb shell setprop persist.sonos.ble_advertise 0'},
    { name: 'Reboot', description: 'Reboot devices', command: 'adb reboot'},
];
