const dgram = require('dgram');
const udp = dgram.createSocket('udp4');

let gameservers = [];
let gameserversBuffer = '';

updateGameserversBuffer();

udp.on('message', (buffer, rinfo) => {
    const cleanBuffer = buffer.toString('utf-8', 4, buffer.length).replace(new RegExp('\\s', 'g'), ' ');

    const command = cleanBuffer.substring(0, cleanBuffer.indexOf(' ')).trim();
    const args = cleanBuffer.substring(cleanBuffer.indexOf(' ') + 1).trim();

    if(command == 'heartbeat') {
        cmdHeartbeat(args, rinfo);
    } else if(command == 'getservers') {
        cmdGetServers(args, rinfo);
    }
});

udp.bind(20510);

function cmdHeartbeat(args, rinfo) {
    if(args == 'COD-1') {
        saveServer(rinfo);
    } else if(args == 'flatline') {
        removeServer(rinfo);
    }
}

function cmdGetServers(args, rinfo) {
    udp.send(gameserversBuffer, 0, gameserversBuffer.length, rinfo.port, rinfo.address);
}

function updateGameserversBuffer() {
    const buffer = [];

    buffer.push(new Buffer.from('\xFF\xFF\xFF\xFFgetserversResponse\x0a\x00\x5c', 'binary'));

    for(const server of gameservers) {
        buffer.push(new Buffer.from(getServerHexIp(server), 'hex'));
        buffer.push(new Buffer.from('\x5c', 'binary'));
    }

    buffer.push(new Buffer.from('\E\O\T', 'binary'));

    gameserversBuffer = Buffer.concat(buffer);
}

function saveServer(rinfo) {
    for(const server of gameservers) {
        if(server.ip === rinfo.address && server.port === rinfo.port) {
            return;
        }
    }

    gameservers.push({ ip: rinfo.address, port: rinfo.port });
    updateGameserversBuffer();
}

function removeServer(rinfo) {
    for(const s in servers) {
        if(servers[s].ip === rinfo.address && servers[s].port === rinfo.port) {
            gameservers.splice(s, 1);
            updateGameserversBuffer();
            break;
        }
    }
}

function getServerHexIp(server) {
    let hex = '';
    const split = server.ip.split('.');

    for(const s of split) {
        const i = parseInt(s);
        if(i < 10) {
            hex += (0 + '' + i.toString(16));
        } else {
            hex += i.toString(16);
        }
    }

    hex += '' + parseInt(server.port).toString(16);
    
    return hex;
}
