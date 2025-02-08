const { Server } = require('node-ssdp');
const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = 8080;

// Generate a unique IP address for each device
const generateUniqueIP = (index) => `192.168.1.${100 + index}`;

// Generate a random MAC address
const generateMacAddress = () => {
    return [...Array(6)].map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':');
};

// Define multiple devices with unique IPs
const devices = [
    { name: "Media Server", type: "urn:schemas-upnp-org:device:MediaServer:1" },
    { name: "Internet Router", type: "urn:schemas-upnp-org:device:InternetGatewayDevice:1" },
    { name: "Network Printer", type: "urn:schemas-upnp-org:device:Printer:1" },
    { name: "Smart TV", type: "urn:schemas-upnp-org:device:Television:1" },
    { name: "IoT Device", type: "urn:schemas-upnp-org:device:IoTDevice:1" }
].map((device, index) => ({
    ...device,
    uuid: `uuid:${device.name.replace(/\s+/g, '-').toLowerCase()}-${crypto.randomUUID()}`,
    mac: generateMacAddress(),
    ip: generateUniqueIP(index)
}));

// Serve XML descriptions for each device
devices.forEach((device, index) => {
    app.get(`/device-${index}.xml`, (req, res) => {
        res.set('Content-Type', 'application/xml');
        res.send(`
            <root xmlns="urn:schemas-upnp-org:device-1-0">
                <specVersion>
                    <major>1</major>
                    <minor>0</minor>
                </specVersion>
                <device>
                    <deviceType>${device.type}</deviceType>
                    <friendlyName>${device.name}</friendlyName>
                    <manufacturer>FakeUPnP Inc.</manufacturer>
                    <modelName>${device.name} Model X</modelName>
                    <UDN>${device.uuid}</UDN>
                    <MACAddress>${device.mac}</MACAddress>
                    <IPAddress>${device.ip}</IPAddress>
                    <iconList>
                        <icon>
                            <mimetype>image/png</mimetype>
                            <width>64</width>
                            <height>64</height>
                            <depth>24</depth>
                            <url>/images/${device.name.replace(/\s+/g, '-').toLowerCase()}.png</url>
                        </icon>
                    </iconList>
                </device>
            </root>
        `);
    });
});

// Start Express Web Server
app.listen(PORT, () => {
    console.log("Fake UPnP devices broadcasting:");
    devices.forEach((device, index) => {
        console.log(`${device.name} - UUID: ${device.uuid} - MAC: ${device.mac} - IP: ${device.ip}`);
        console.log(`Device XML: http://127.0.0.1:${PORT}/device-${index}.xml`);
    });
});

// Start UPnP SSDP Advertisement
const servers = devices.map((device, index) => {
    const server = new Server({
        location: `http://127.0.0.1:${PORT}/device-${index}.xml`,
        udn: device.uuid,
        ssdpSig: 'FakeUPnP/1.0',
    });

    server.addUSN('upnp:rootdevice');
    server.addUSN(device.type);

    server.start();
    return server;
});

console.log("UPnP devices broadcasting...");

process.on('exit', () => servers.forEach(server => server.stop()));
