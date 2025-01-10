const commands = require('./commands');
const adb = require('adbkit');
const client = adb.createClient();
const {exec} = require('child_process');

let updateInterval;

// Fetch and Update Device Info
const updateDeviceInfo = () => {
    client.listDevices()
        .then((devices) => {
            if (devices.length === 0) {
                // Handle no devices connected
                document.getElementById('deviceName').textContent = 'No Device Connected';
                document.getElementById('androidVersion').textContent = 'N/A';
                document.getElementById('manufacturer').textContent = 'N/A';
                document.getElementById('model').textContent = 'N/A';
                document.getElementById('nsudBuild').textContent = 'N/A'; // Add a placeholder for NSUD Build
                return;
            }

            const deviceId = devices[0].id;

            // Fetch device properties with error handling
            client.shell(deviceId, 'getprop ro.product.model')
                .then(adb.util.readAll)
                .then((output) => {
                    document.getElementById('deviceName').textContent = output.toString().trim();
                })
                .catch(() => {
                    document.getElementById('deviceName').textContent = 'Error Fetching Name';
                });

            client.shell(deviceId, 'getprop ro.build.version.release')
                .then(adb.util.readAll)
                .then((output) => {
                    document.getElementById('androidVersion').textContent = output.toString().trim();
                })
                .catch(() => {
                    document.getElementById('androidVersion').textContent = 'Error Fetching Version';
                });

            client.shell(deviceId, 'getprop ro.product.manufacturer')
                .then(adb.util.readAll)
                .then((output) => {
                    document.getElementById('manufacturer').textContent = output.toString().trim();
                })
                .catch(() => {
                    document.getElementById('manufacturer').textContent = 'Error Fetching Manufacturer';
                });

            client.shell(deviceId, 'getprop ro.product.model')
                .then(adb.util.readAll)
                .then((output) => {
                    document.getElementById('model').textContent = output.toString().trim();
                })
                .catch(() => {
                    document.getElementById('model').textContent = 'Error Fetching Model';
                });

            // Fetch the NSUD Build info (adb shell getprop ro.build.fingerprint)
            client.shell(deviceId, 'getprop ro.build.fingerprint')
                .then(adb.util.readAll)
                .then((output) => {
                    document.getElementById('nsudBuild').textContent = output.toString().trim();
                })
                .catch(() => {
                    document.getElementById('nsudBuild').textContent = 'Error Fetching NSUD Build';
                });
        })
        .catch((err) => {
            console.error('Error fetching device info:', err);
            document.getElementById('deviceName').textContent = 'Error';
            document.getElementById('androidVersion').textContent = 'Error';
            document.getElementById('manufacturer').textContent = 'Error';
            document.getElementById('model').textContent = 'Error';
            document.getElementById('nsudBuild').textContent = 'Error'; // Error handling for NSUD Build
        });
};

// Start Real-Time Updates
const startRealTimeUpdates = () => {
    if (updateInterval) clearInterval(updateInterval); // Clear existing interval if any
    updateDeviceInfo(); // Initial fetch
    updateInterval = setInterval(updateDeviceInfo, 5000); // Fetch every 5 seconds
};

// Stop Real-Time Updates
const stopRealTimeUpdates = () => {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
};

// Start updates when the TV Remote tab is active
document.getElementById('remote-tab').addEventListener('click', startRealTimeUpdates);

// Stop updates when switching away from the TV Remote tab
document.getElementById('logs-tab').addEventListener('click', stopRealTimeUpdates);
document.getElementById('command-tab').addEventListener('click', stopRealTimeUpdates);


// Key Mappings for Keyboard Control
const keyboardMappings = {
    ArrowUp: {keycode: 19, buttonId: 'up'},        // D-Pad Up
    ArrowDown: {keycode: 20, buttonId: 'down'},    // D-Pad Down
    ArrowLeft: {keycode: 21, buttonId: 'left'},    // D-Pad Left
    ArrowRight: {keycode: 22, buttonId: 'right'},  // D-Pad Right
    Enter: {keycode: 23, buttonId: 'center'},      // OK button
    Backspace: {keycode: 4, buttonId: 'back'},     // Back button
    VolumeUp: {keycode: 24, buttonId: 'volume-up'},// Volume Up
    VolumeDown: {keycode: 25, buttonId: 'volume-down'},// Volume Down
    KeyV: {keycode: 79, buttonId: 'call-voice'},   // Voice input
    KeyH: {keycode: 3, buttonId: 'home'}          // H key for Home
};

// Send ADB Key Event
const sendKeyEvent = (keycode) => {
    client.listDevices()
        .then((devices) => {
            devices.forEach((device) => {
                client.shell(device.id, `input keyevent ${keycode}`);
            });
        })
        .catch((err) => console.error('ADB Error:', err));
};

// Highlight Button
const highlightButton = (buttonId) => {
    const button = document.getElementById(buttonId);
    if (button) {
        button.classList.add('active'); // Add the active class
        setTimeout(() => button.classList.remove('active'), 200); // Remove after 200ms
    }
};

// Handle Keyboard Events
document.addEventListener('keydown', (event) => {
    const mapping = keyboardMappings[event.code];
    if (mapping) {
        sendKeyEvent(mapping.keycode);
        highlightButton(mapping.buttonId);
    }
});

// Button Click Listeners for Remote
Object.keys(keyboardMappings).forEach((key) => {
    const {keycode, buttonId} = keyboardMappings[key];
    const button = document.getElementById(buttonId);
    if (button) {
        button.addEventListener('click', () => {
            sendKeyEvent(keycode);
            highlightButton(buttonId);
        });
    }
});

// Reboot and reset device function
// Reboot the device
const rebootDevice = () => {
    exec('adb reboot', (error, stdout, stderr) => {
        if (error) {
            console.error('Error during reboot:', stderr || error);
            alert('Failed to reboot the device. Ensure ADB is connected.');
        } else {
            alert('Device is rebooting...');
        }
        const rebootModal = bootstrap.Modal.getInstance(document.getElementById('rebootModal'));
        if (rebootModal) rebootModal.hide();
    });
};

// Factory Reset the device
const factoryResetDevice = () => {
    exec('adb root && adb shell am broadcast -p "android" --receiver-foreground -a android.intent.action.FACTORY_RESET', (error, stdout, stderr) => {
        if (error) {
            console.error('Error during factory reset:', stderr || error);
            alert('Failed to perform factory reset. Ensure ADB is connected.');
        } else {
            alert('Factory reset initiated. The device will erase all data.');
        }

        // Dismiss the modal
        const factoryResetModal = bootstrap.Modal.getInstance(document.getElementById('factoryResetModal'));
        if (factoryResetModal) factoryResetModal.hide();
    });
};

// Add event listeners for modal buttons
document.getElementById('confirmReboot').addEventListener('click', () => {
    rebootDevice();
});

document.getElementById('confirmFactoryReset').addEventListener('click', () => {
    factoryResetDevice();
});
//End Reboot and reset



// Command Line Functionality
const commandList = document.getElementById('commandList');
const commandOutput = document.getElementById('commandOutput');

// Populate the command list
commands.forEach((cmd, index) => {
    const listItem = document.createElement('li');
    listItem.className = 'list-group-item d-flex justify-content-between align-items-center';

    listItem.innerHTML = `
    <div>
      <strong>${cmd.name}</strong>
      <p class="mb-0 text-muted">${cmd.description}</p>
    </div>
    <button class="btn btn-primary btn-sm" id="runCommand-${index}">Run</button>
  `;

    commandList.appendChild(listItem);

    // Add event listener for Run button
    document.getElementById(`runCommand-${index}`).addEventListener('click', () => {
        executeCommand(cmd.command);
    });
});

// Function to execute a command
const executeCommand = (command) => {
    const process = exec(command);

    commandOutput.textContent = ''; // Clear previous output

    process.stdout.on('data', (data) => {
        commandOutput.textContent += data;
    });

    process.stderr.on('data', (data) => {
        commandOutput.textContent += `Error: ${data}`;
    });

    process.on('close', (code) => {
        commandOutput.textContent += `\nProcess exited with code ${code}`;
    });
};



const fs = require('fs');
const path = require('path');
const { shell } = require('electron');

// Absolute path for logs directory
const logsDir = path.resolve(__dirname, 'logs');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Format Date for Display
const formatDate = (date) => {
    return date.toLocaleString(); // Use system date format
};

// Format File Size
const formatFileSize = (size) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

// Count FATAL EXCEPTION occurrences
const countFatalExceptions = (filePath) => {
    if (!fs.existsSync(filePath)) return 0;

    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(/FATAL EXCEPTION/g);
    return matches ? matches.length : 0;
};

// Save ADB Log
const saveAdbLog = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFilename = `adb-log-${timestamp}.txt`;
    const logFilePath = path.join(logsDir, logFilename);

    // Run ADB command to save log
    const adbProcess = exec(`adb logcat -d > "${logFilePath}"`);

    adbProcess.on('close', (code) => {
        if (code === 0) {
            alert(`Log saved: ${logFilename}`);
            displayLogs(); // Refresh the log list
        } else {
            alert('Failed to save log. Ensure ADB is connected.');
        }
    });
};

// Display Logs List (Sorted by Latest)
const displayLogs = () => {
    const logList = document.getElementById('logList');
    logList.innerHTML = ''; // Clear existing list

    fs.readdir(logsDir, (err, files) => {
        if (err) {
            console.error('Error reading logs directory:', err);
            return;
        }

        // Get file stats and sort by creation time (latest first)
        const filesWithStats = files.map((file) => {
            const filePath = path.join(logsDir, file);
            const stats = fs.statSync(filePath);
            const fatalExceptions = countFatalExceptions(filePath);

            return {
                file,
                filePath,
                createdAt: stats.birthtime,
                size: stats.size, // File size in bytes
                fatalExceptions, // Count of FATAL EXCEPTION
            };
        });

        // Sort files by creation time in descending order
        filesWithStats.sort((a, b) => b.createdAt - a.createdAt);

        // Render the sorted file list
        filesWithStats.forEach(({ file, filePath, createdAt, size, fatalExceptions }) => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item d-flex justify-content-between align-items-center';

            listItem.innerHTML = `
        <div>
          <strong>${file}</strong>
          <p class="mb-0 text-muted">
            Created: ${formatDate(createdAt)} | File Size: ${formatFileSize(size)} | FATAL EXCEPTIONS: ${fatalExceptions}
          </p>
        </div>
        <div>
          <button class="btn btn-secondary btn-sm view-btn" data-path="${filePath}">View</button>
          <button class="btn btn-secondary btn-sm open-folder-btn" data-folder="${logsDir}">Open Folder</button>
        </div>
      `;

            // Add click listener for "View" button
            listItem.querySelector('.view-btn').addEventListener('click', (e) => {
                const fileToOpen = e.target.getAttribute('data-path');
                shell.openPath(fileToOpen); // Open file in the default text editor
            });

            // Add click listener for "Open Folder" button
            listItem.querySelector('.open-folder-btn').addEventListener('click', (e) => {
                const folderToOpen = e.target.getAttribute('data-folder');
                shell.openPath(folderToOpen) // Open folder in the default file explorer
                    .catch((err) => alert('Failed to open folder: ' + err.message));
            });

            logList.appendChild(listItem);
        });
    });
};

// Add Event Listener for Save Log Button
document.getElementById('saveLog').addEventListener('click', saveAdbLog);

// Load Logs List on Tab Click
document.getElementById('logs-tab').addEventListener('click', displayLogs);
