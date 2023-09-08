process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const net = require('net');
const Logger = require('./logger.js');
const chalk = require('chalk');
const DataHolder = require('./dataHolderClass.js');
const socketHandler = require('./socketHandler.js');
const { v4: uuid } = require('uuid');
const ws = require('ws');
const fs = require('fs');

const socketPort = 8124
const clientStats = new DataHolder()
const logger = new Logger(clientStats)



function newRemoteHosts() {
    logger.info("Finding remote hosts...")
    return new Promise((res, rej) => {
        //return res(["gatekeeper-service-REPLACE.mitchellonii.me"])

        var baseDomains = ["gatekeeper-service-REPLACE.mitchellonii.me", "gatekeeper-service-REPLACE.vijays.dad"]
        var newHosts = []

        function gen() {
            var testHost = baseDomains[~~(Math.random() * 2)].replace("REPLACE", uuid())
            let socket = new ws("wss://" + testHost, { rejectUnauthorized: false })
            socket.onopen = () => {
                newHosts.push(testHost)
                logger.trace("Found host " + chalk.blueBright(testHost))
                socket.close()
                if (newHosts.length == 8) res(newHosts)
                else gen()
            }
            socket.onerror = (e) => {
                console.log(e)
                gen()
            }
        }

        gen()


    })

}

function authenticate() {
    logger.info("Authenticating...")
    return new Promise(async (res, rej) => {

        if (await fs.existsSync("./gatekeeper.config")) {
            try {
                var data = convertParamsToJSON(fs.readFileSync("./gatekeeper.config", "utf-8"))
                if (!(data.username && data.password)) rej()
                clientStats.authorization = Buffer.from(`${data.username}:${data.password}`).toString("base64")
                res()
            } catch (e) {
                rej()
            }
        } else {
            fs.writeFileSync("./gatekeeper.config", "username=replace;password=replace")
            rej()
        }
    })
}


logger.trace("Starting Gatekeeper client")

authenticate().then(() => {
    newRemoteHosts().then(async (remoteHosts) => {
        const server = net.createServer(socketHandler(logger, clientStats, remoteHosts, socketPort));

        server.on('error', (err) => {
            logger.error('SERVER ERROR ' + err.toString());
            throw err;
        });



        server.listen(socketPort, () => {
            logger.info(`Gatekeeper service running at ${chalk.blueBright("localhost:" + socketPort)}`);
        });
    })



}, () => {
    logger.error("Failed to authenticate, please insert your gatekeeper credientials into the 'gatekeeper.config' file in the format 'username=abcde;password=fghij'")
    process.exit(0)
})

function convertParamsToJSON(paramsString) {
    const jsonObject = {};
    const paramsArray = paramsString.split(';');

    for (const param of paramsArray) {
        const [key, value] = param.split('=');
        jsonObject[key] = value;
    }

    return jsonObject;
}