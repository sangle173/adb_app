const commands = require('./commands');
const adb = require('adbkit');
const client = adb.createClient();
const {exec} = require('child_process');

// Fetch and Display ADB Devices
const updateAdbDevices = () => {
    const deviceList = document.getElementById('deviceInfo');
    deviceList.innerHTML = ''; // Clear existing list

    exec('adb devices', (error, stdout, stderr) => {
        if (error) {
            console.error('Error executing adb devices:', error);
            deviceList.innerHTML = '<li class="list-group-item text-danger">Error fetching devices</li>';
            return;
        }

        if (stderr) {
            console.error('ADB stderr:', stderr);
            deviceList.innerHTML = '<li class="list-group-item text-danger">ADB Error</li>';
            return;
        }

        const devices = stdout
            .split('\n')
            .slice(1) // Skip the header line
            .filter(line => line.trim() && !line.includes('unauthorized')) // Exclude empty lines and unauthorized devices
            .map(line => line.split('\t')[0]); // Extract the device ID

        if (devices.length === 0) {
            deviceList.innerHTML = '<li class="list-group-item text-warning">No devices connected</li>';
        } else {
            devices.forEach(device => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item';
                listItem.textContent = `Device ID: ${device}`;
                deviceList.appendChild(listItem);
            });
        }
    });
};

// Trigger ADB Devices Update when Tab is Clicked
document.getElementById('remote-tab').addEventListener('click', updateAdbDevices);


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
