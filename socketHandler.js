const websocket = require('websocket-stream');
const chalk = require('chalk');
const net = require('net');

const knownGood = ["gatekeeper.mitchellonii.me"]


function socketHandler(logger, clientStats, remoteHosts, port) {

    return (socket) => {
        socket.once('data', (data) => {

            data = data.toString().split('\r\n')
            data.splice(1, 0, `Gatekeeper-Authorization: Basic ${clientStats.authorization}`)
            data = data.join("\r\n")
            let isTLSConnection = data.indexOf('CONNECT') !== -1;
            let serverPort = 80;
            let serverAddress;
            if (isTLSConnection) {
                serverPort = data.split('CONNECT ')[1].split(' ')[0].split(':')[1];;
                serverAddress = data.split('CONNECT ')[1].split(' ')[0].split(':')[0];
            } else {
                serverAddress = data.toString().split('Host: ')[1].split('\r\n')[0];
            }


            var remoteHost;
            if (serverAddress == "proxy.status" && !isTLSConnection) {
                socket.write(`HTTP/1.1 200 OK \r\n\nGatekeeper connected\n${JSON.stringify(clientStats)}\r\r\n`)
                return socket.end()

            } else if (knownGood.includes(serverAddress) || serverAddress.includes("gatekeeper-service-")) {
                console.log("Bypassing known-good " + serverAddress)
                remoteHost = net.createConnection({
                    host: serverAddress,
                    port: serverPort
                })

                if (isTLSConnection) socket.write("HTTP/1.1 200 OK \r\n\n")
                else remoteHost.write(data.toString("base64"))
            } else {
                var randomHost = remoteHosts[Math.floor(Math.random() * remoteHosts.length)]

                remoteHost = websocket(`wss://${randomHost}`, {
                    perMessageDeflate: false
                })


                remoteHost.addListener("data", (d) => {
                    clientStats.totalData += d.length
                })
                socket.addListener("data", (d) => {
                    clientStats.totalData += d.length
                })


                remoteHost.write(data)
                logger.debug(`Establishing request to ${chalk.blueBright(serverAddress)} through ${chalk.blueBright(randomHost)}`)
                remoteHost.on("close", (e) => {
                    logger.warn(`Request to ${chalk.blueBright(serverAddress)} closed`)
                })
            }

            socket.pipe(remoteHost)


            remoteHost.pipe(socket)





            remoteHost.on("error", (e) => {
                logger.error(e)
            })
            socket.on("error", (e) => {
                logger.error(e)
            })

            socket.on("close", () => { })


        });
    }
}

module.exports = socketHandler
