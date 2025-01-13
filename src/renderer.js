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
const {shell} = require('electron');

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

// Extract FATAL EXCEPTION and surrounding lines
const extractFatalExceptionSections = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const exceptionSections = [];
    let exceptionCount = 0;

    lines.forEach((line, index) => {
        if (line.includes('FATAL EXCEPTION')) {
            exceptionCount++;
            const start = index;
            const end = Math.min(index + 20, lines.length - 1);
            exceptionSections.push(lines.slice(start, end + 1).join('\n'));
        }
    });

    return {exceptionSections, exceptionCount};
};

// Display Logs List
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
            const {exceptionSections, exceptionCount} = extractFatalExceptionSections(filePath);
            return {
                file,
                filePath,
                createdAt: stats.birthtime,
                exceptionSections,
                exceptionCount,
            };
        });

        // Sort files by creation time in descending order
        filesWithStats.sort((a, b) => b.createdAt - a.createdAt);

        // Render the sorted file list
        filesWithStats.forEach(({file, filePath, createdAt, exceptionSections, exceptionCount}) => {
            const hasExceptions = exceptionCount > 0;

            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';

            listItem.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <strong>${file}</strong>
            <p class="mb-0 text-muted">
              Created: ${formatDate(createdAt)}
              ${
                hasExceptions
                    ? ` | <span class="badge bg-danger">${exceptionCount} FATAL EXCEPTION${
                        exceptionCount > 1 ? 'S' : ''
                    }</span>`
                    : ''
            }
            </p>
          </div>
          <div>
            <button class="btn btn-secondary btn-sm collapse-btn" data-bs-toggle="collapse" data-bs-target="#collapse-${file}" aria-expanded="false" aria-controls="collapse-${file}">
              Collapse
            </button>
            <button class="btn btn-primary btn-sm view-btn" data-file="${filePath}">View</button>
            <button class="btn btn-secondary btn-sm folder-btn" data-folder="${logsDir}">Open Folder</button>
          </div>
        </div>
        <div class="collapse mt-2" id="collapse-${file}">
          <pre class="bg-light p-3 rounded">${exceptionSections.join('\n\n') || 'No FATAL EXCEPTIONS found in this log.'}</pre>
        </div>
      `;

            // Add click listener for "View" button
            listItem.querySelector('.view-btn').addEventListener('click', (e) => {
                const fileToOpen = e.target.getAttribute('data-file');
                shell.openPath(fileToOpen) // Open file in the default text editor
                    .catch((err) => alert('Failed to open file: ' + err.message));
            });

            // Add click listener for "Open Folder" button
            listItem.querySelector('.folder-btn').addEventListener('click', (e) => {
                const folderToOpen = e.target.getAttribute('data-folder');
                shell.openPath(folderToOpen) // Open folder in the default file explorer
                    .catch((err) => alert('Failed to open folder: ' + err.message));
            });

            logList.appendChild(listItem);
        });
    });
};

// Add Event Listener for Save Log Button
document.getElementById('saveLog').addEventListener('click', () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFilename = `adb-log-${timestamp}.txt`;
    const logFilePath = path.join(logsDir, logFilename);

    exec('adb logcat -d > "' + logFilePath + '"', (error) => {
        if (error) {
            alert('Failed to save log. Ensure ADB is connected.');
            console.error(error);
            return;
        }
        alert('Log saved: ' + logFilename);
        displayLogs(); // Refresh the log list
    });
});

// Load Logs List on Tab Click
document.getElementById('logs-tab').addEventListener('click', displayLogs);


// discovery tab
const {Client} = require('node-ssdp');
const fetch = require('node-fetch');

let devices = []; // Store all discovered devices

const updateStatus = (message, showSpinner = false) => {
    const spinner = document.getElementById('spinner');
    const statusMessage = document.getElementById('statusMessage');

    if (showSpinner) {
        spinner.style.display = 'inline-block'; // Show spinner
    } else {
        spinner.style.display = 'none'; // Hide spinner
    }

    statusMessage.textContent = message;
};

const discoverDevices = () => {
    const tableBody = document.getElementById('deviceTableBody');
    tableBody.innerHTML = ''; // Clear previous results
    devices = []; // Reset the devices array

    const client = new Client();
    const discoveredIPs = new Set(); // Use a Set to track unique devices by IP

    updateStatus('Discovering devices on the network...', true);

    client.on('response', async (headers, statusCode, rinfo) => {
        const deviceIP = rinfo.address;
        const location = headers.LOCATION || 'Unknown';
        let iconUrl = null;
        let macAddress = 'Unknown';
        let softwareVersion = 'Unknown';
        let modelName = 'Unknown';
        let latency = 'Unknown';

        // Skip duplicates based on the IP address
        if (discoveredIPs.has(deviceIP)) {
            console.log(`Skipping duplicate device: ${deviceIP}`);
            return;
        }

        discoveredIPs.add(deviceIP); // Add the unique IP to the Set

        try {
            // Fetch additional details from the LOCATION URL
            const response = await fetch(location);
            const xml = await response.text();

            // Parse XML for required fields
            iconUrl = xml.match(/<url>(.*?)<\/url>/)?.[1];
            if (iconUrl) {
                const baseUrl = new URL(location).origin;
                iconUrl = `${baseUrl}${iconUrl}`;
            }

            macAddress = xml.match(/<MACAddress>(.*?)<\/MACAddress>/)?.[1] || macAddress;
            softwareVersion = xml.match(/<softwareVersion>(.*?)<\/softwareVersion>/)?.[1] || softwareVersion;
            modelName = xml.match(/<modelName>(.*?)<\/modelName>/)?.[1] || modelName;
            udn = xml.match(/<UDN>(.*?)<\/UDN>/)?.[1] || udn;
            // Fetch the WiFi SSID

            latency = await new Promise((resolve) => {
                exec(`ping -n 1 ${deviceIP}`, (error, stdout) => {
                    if (error) {
                        resolve('Timeout');
                    } else {
                        const latencyMatch = stdout.match(/time[<|=]([\d.]+)ms/);
                        resolve(latencyMatch ? `${latencyMatch[1]} ms` : 'Unknown');
                    }
                });
            });
        } catch (err) {
            console.error(`Failed to fetch details from ${location}:`, err);
        }

        // Add the device to the devices array
        const device = {deviceIP, macAddress, softwareVersion, modelName, latency, iconUrl, location};
        devices.push(device);

        // Render the updated table
        renderTable(devices);
    });

    // Start discovery for UPnP devices
    client.search('ssdp:all');

    // Stop after 10 seconds to prevent endless search
    setTimeout(() => {
        client.stop();
        updateStatus('Discovery completed.', false);
        console.log('Discovery completed.');
    }, 10000);
};

// Function to filter devices based on search query
const filterDevices = (searchTerm) => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filteredDevices = devices.filter((device) => {
        const matchesModel = device.modelName.toLowerCase().includes(lowerSearchTerm);
        const matchesMAC = device.macAddress.toLowerCase().includes(lowerSearchTerm);
        const matchesIP = device.deviceIP.toLowerCase().includes(lowerSearchTerm);
        return matchesModel || matchesMAC || matchesIP;
    });
    renderTable(filteredDevices);
};

// Attach event listener to the search input
document.getElementById('deviceSearch').addEventListener('input', (event) => {
    const searchTerm = event.target.value;
    filterDevices(searchTerm);
});

// Render the table with actions column
const renderTable = (filteredDevices) => {
    const tableBody = document.getElementById('deviceTableBody');
    tableBody.innerHTML = ''; // Clear the table

    filteredDevices.forEach((device) => {
        const row = document.createElement('tr');

        row.innerHTML = `
      <td>
        ${device.iconUrl ? `<img src="${device.iconUrl}" alt="Device Icon" style="width: 50px; height: 50px;">` : 'N/A'}
      </td>
      <td>${device.modelName}</td>
      <td>${device.deviceIP}</td>
      <td>${device.macAddress}</td>
      <td>${device.softwareVersion}</td>
      <td>${device.latency || 'N/A'}</td>
<!--       <td><a href="${device.location}" target="_blank">${device.location}</a></td>-->
      <td>
        <button class="btn btn-sm btn-primary action-ping" data-ip="${device.deviceIP}" title="Ping">
          <i class="bi bi-wifi"></i>
        </button>
        <button class="btn btn-sm btn-info action-details" data-ip="${device.deviceIP}" title="Details">
          <i class="bi bi-info-circle"></i>
        </button>
        <button class="btn btn-sm btn-danger action-setstring" data-ip="${device.deviceIP}" title="SetString">
          <i class="bi bi-gear"></i>
        </button>
        <button class="btn btn-sm btn-secondary action-open-link" data-ip="${device.deviceIP}" title="Open Link">
          <i class="bi bi-box-arrow-up-right"></i>
        </button>
      </td>
    `;

        tableBody.appendChild(row);
    });

    // Attach event listeners for action buttons
    attachActionListeners();
};

const attachActionListeners = () => {
    document.querySelectorAll('.action-ping').forEach((button) => {
        button.addEventListener('click', (event) => {
            const ip = event.target.closest('button').getAttribute('data-ip');
            handlePing(ip);
        });
    });

    document.querySelectorAll('.action-details').forEach((button) => {
        button.addEventListener('click', (event) => {
            const buttonElement = event.target.closest('button');
            const ip = buttonElement.getAttribute('data-ip');
            const modelName = buttonElement.getAttribute('data-model');
            handleDetails(ip, modelName);
        });
    });

    document.querySelectorAll('.action-setstring').forEach((button) => {
        button.addEventListener('click', (event) => {
            const ip = event.target.closest('button').getAttribute('data-ip');
            handleSetString(ip);
        });
    });

    document.querySelectorAll('.action-open-link').forEach((button) => {
        button.addEventListener('click', (event) => {
            const ip = event.target.closest('button').getAttribute('data-ip');
            handleOpenLink(ip);
        });
    });
};

// Open the link in a new tab
const handleOpenLink = (ip) => {
    const link = `http://${ip}:1400/support/directsubmit`;
    window.open(link, '_blank');
};
// Handle Ping action
const handlePing = (ip) => {
    exec(`ping -n 1 ${ip}`, (error, stdout, stderr) => {
        if (error) {
            alert(`Ping to ${ip} failed:\n${stderr}`);
        } else {
            const latencyMatch = stdout.match(/time[<|=]([\d.]+)ms/);
            const latency = latencyMatch ? `${latencyMatch[1]} ms` : 'Unknown';
            alert(`Ping to ${ip} succeeded with latency: ${latency}`);
        }
    });
};
// Handle SetString action
const handleSetString = (ip) => {
    const link = `http://${ip}:1400/setstring`;
    window.open(link, '_blank');
};
// Handle Details action
const handleDetails = (ip, modelName) => {
    const link = `http://${ip}:1400/status/zp`;

    // Open the link in a new tab with a dynamic title
    const newTab = window.open(link, '_blank');

    // Wait for the new tab to load and update its title
    newTab.onload = () => {
        newTab.document.title = `${modelName} - ${ip}`;
    };
};

// // Attach event listeners to action buttons
// const attachActionListeners = () => {
//     document.querySelectorAll('.action-ping').forEach((button) => {
//         button.addEventListener('click', (event) => {
//             const ip = event.target.closest('button').getAttribute('data-ip');
//             handlePing(ip);
//         });
//     });
//
//     document.querySelectorAll('.action-details').forEach((button) => {
//         button.addEventListener('click', (event) => {
//             const ip = event.target.closest('button').getAttribute('data-ip');
//             handleDetails(ip);
//         });
//     });
//
//     document.querySelectorAll('.action-delete').forEach((button) => {
//         button.addEventListener('click', (event) => {
//             const ip = event.target.closest('button').getAttribute('data-ip');
//             handleDelete(ip);
//         });
//     });
// };

// Attach event listener to Discover Devices button
document.getElementById('discoverDevices').addEventListener('click', discoverDevices);


//end discovery


