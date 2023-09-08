const chalk = require("chalk")

class Logger {
    constructor(data) {
        this.info = (msg) => {
            console.log(`${chalk.gray(getCurrentTime())} ${chalk.greenBright("[INFO]  ")}  ${chalk.white(msg)}`)
        }
        this.debug = (msg) => {
            console.log(`${chalk.gray(getCurrentTime())} ${chalk.magentaBright("[DEBUG] ")}  ${chalk.white(msg)}`)
        }
        this.warn = (msg) => {
            console.log(`${chalk.gray(getCurrentTime())} ${chalk.yellowBright("[WARN]  ")}  ${chalk.white(msg)}`)
        }
        this.error = (msg) => {
            console.log(`${chalk.gray(getCurrentTime())} ${chalk.redBright("[ERROR] ")}  ${chalk.white(msg)}`)
        }
        this.trace = (msg) => {
            console.log(`${chalk.gray(getCurrentTime())} ${chalk.cyan("[TRACE] ")}  ${chalk.white(msg)}`)
        }

        var logStats = () => {
            this.info(`Uptime - ${chalk.green(msToHMS(Date.now() - data.startTime))}, bandwidth: ${chalk.green(formatBytes(data.totalData))}`)
        }
        setInterval(logStats, 60000)
    }
}

function getCurrentTime() {
    const currentDate = new Date();
    const currentTime = currentDate.toLocaleTimeString('en-US', {
        hour12: false
    });

    return (currentTime);

}
function msToHMS(milliseconds) {
    const seconds = Math.floor((milliseconds / 1000) % 60);
    const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
    const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);

    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return formattedTime;
}




function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

module.exports = Logger