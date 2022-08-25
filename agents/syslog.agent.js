const dgram = require('dgram')
const Stream = require('stream')

const parser = require("nsyslog-parser");
const wcmatch = require('wildcard-match')

class Store {
    constructor(info) {
        this.info = info;
        this.key = info.key;
        this.consoleLog = false;

        this.logs = [];
        this.maxStore = 50;
        this.read = new Stream.PassThrough()
        this.write = new Stream.PassThrough()

        this.write.on('data', (message) => this.append(new Date(), message.toString()))
    }
    pipe(stream) {
        this.read.pipe(stream)
    }
    enableConsole() {
        this.consoleLog = true;
    }
    disableConsole() {
        this.consoleLog = false;
    }
    append(ts, message) {
        this.logs.push([ts, message])

        if (this.logs.length > this.maxStore) {
            this.logs.shift()
        }
        if (this.consoleLog)
            console.log(message)
        this.read.write(message)
    }
}

/**
 * Syslog service for Moleculer microservices framework.
 *
 * @service
 */
module.exports = {

    // Default service name
    name: "syslog.agent",

    version: 1,

    // Default settings
    settings: {

        // Exposed port
        port: process.env.PORT || 514,

        // Exposed IP
        ip: process.env.IP || "0.0.0.0",

        // Used server instance. If null, it will create a new HTTP(s)(2) server
        // If false, it will start without server in middleware mode
        server: true,

    },

    // Service's metadata
    metadata: {
        $category: "agent",
        $description: "Syslog agent",
        $official: false,
        $package: {
            // name: pkg.name,
            // version: pkg.version,
            // repo: pkg.repository ? pkg.repository.url : null
        }
    },

    actions: {

        /**
         * REST request handler
         */
        message: {
            params: {
                rinfo: { type: "object", optional: false },
                msg: { type: "string", convert: true, optional: false },
            },
            timeout: 0,
            async handler(ctx) {
                const { msg, rinfo } = Object.assign({}, ctx.params);

                const message = parser(msg)
                message.docker = false;
                if (message.appName.length == 64)
                    message.docker = true;


                return this.appendMessage(message, rinfo)

            }
        },
        enableConsole: {
            params: {
                key: { type: "string", optional: true },
            },
            timeout: 0,
            async handler(ctx) {
                const { key } = Object.assign({}, ctx.params);

                if (!key) {
                    for (const [_key, store] of this.stores.entries()) {
                        store.enableConsole()
                    }
                    return true;
                }


                if (!this.stores.has(key)) {
                    throw Error(`Key not found ${key}`)
                }
                return this.stores.get(key).enableConsole()
            }
        },
        disableConsole: {
            params: {
                key: { type: "string", optional: true },
            },
            timeout: 0,
            async handler(ctx) {
                const { key } = Object.assign({}, ctx.params);

                if (!key) {
                    for (const [_key, store] of this.stores.entries()) {
                        store.disableConsole()
                    }
                    return true;
                }

                if (!this.stores.has(key)) {
                    throw Error(`Key not found ${key}`)
                }
                return this.stores.get(key).disableConsole()
            }
        },
        getLog: {
            params: {
                key: { type: "string", optional: false },
            },
            timeout: 0,
            async handler(ctx) {
                const { key } = Object.assign({}, ctx.params);
                const stores = []
                const isMatch = wcmatch(key)
                for (const [_key, store] of this.stores.entries()) {
                    console.log(_key)
                    if (isMatch(_key)) {
                        stores.push(store)
                    }
                }
                const logs = {}


                for (let index = 0; index < stores.length; index++) {
                    const store = stores[index];
                    logs[store.key] = store.logs.map((a) => a[1])
                }


                return logs
            }
        },
        getStream: {
            async handler(ctx) {


                const { key } = Object.assign({}, ctx.meta);
                if (!this.stores.has(key))
                    throw Error(`Key not found ${key}`)
                const store = this.stores.get(key);

                const stream = new Stream.PassThrough()

                let onWriteData = (data) => {
                    store.write.write(data)
                }
                let onReadData = (data) => {
                    stream.write(data)
                }

                let onEnd = (data) => {
                    ctx.params.removeListener('data', onWriteData);
                    store.read.removeListener('data', onReadData)
                }

                ctx.params.on('data', onWriteData);
                ctx.params.once('finish', onEnd);

                store.read.on('data', onReadData)

                return stream
            }
        },
        matchStream: {
            rest: 'POST /query',
            params: {
                key: [
                    { type: "array", items: "string", optional: false },
                    { type: "string", optional: false }
                ],
            },
            async handler(ctx) {
                const { key } = Object.assign({}, ctx.params);

                const isMatch = wcmatch(key)
                console.log(`key ${key}`)

                const stream = new Stream.PassThrough()

                stream.isMatch = isMatch
                stream.key = key
                for (const [_key, store] of this.stores.entries()) {
                    if (isMatch(_key)) {
                        store.pipe(stream)
                    }
                }

                this.streams.push(stream)

                stream.once('close', () => {
                    const index = this.streams.indexOf(5);
                    if (index > -1)
                        this.streams.splice(index, 1);
                    console.log('stream closed')
                })

                return stream
            }
        },
        test: {
            params: {
                key: { type: "string", optional: false },
                count: { type: "number", default: 10, optional: true },
            },
            timeout: 0,
            async handler(ctx) {
                const { key, count } = Object.assign({}, ctx.params);

                let i = 0;

                const readStream = await this.actions.matchStream({ key })


                return new Promise((resolve) => {
                    const onData = (data) => {
                        console.log(i, data.toString())
                        if (i++ == count) {
                            readStream.destroy()
                            resolve()
                        }
                    }
                    readStream.on('data', onData)
                })
            }
        },

        /**
         * REST request handler
         */
        keys: {
            async handler(ctx) {
                return Array.from(this.stores.keys())
            }
        },

    },


    methods: {
        /**
         * Create HTTP server
         */
        createServer() {
            /* istanbul ignore next */
            if (this.server) return;

            this.server = dgram.createSocket('udp4')
        },
        async appendMessage(message, rinfo) {

            const key = `${message.host}.${message.appName}`

            if (!this.stores.has(key)) {
                const store = new Store({
                    key,
                    prival: message.prival,
                    facilityval: message.facilityval,
                    levelval: message.levelval,
                    facility: message.facility,
                    level: message.level,
                    host: message.host,
                    appName: message.appName
                })
                this.stores.set(key, store)
                for (let index = 0; index < this.streams.length; index++) {
                    const stream = this.streams[index];
                    if (stream.isMatch(key)) {
                        store.pipe(stream)
                    }
                }

            }


            this.stores.get(key).append(message.ts, message.message)
        }
    },

    events: {

    },

    /**
     * Service created lifecycle event handler
     */
    created() {

        this.stores = new Map()

        this.streams = []


        this.createServer();

        /* istanbul ignore next */
        this.server.on("error", err => {
            this.logger.error("Server error", err);
        });

        this.server.on('message', async (msg, rinfo) => {

            const result = await this.actions.message({ msg, rinfo }, {});

        })

        this.logger.info("Syslog server created.");


    },


    /**
     * Service started lifecycle event handler
     */
    started() {

        /* istanbul ignore next */
        return new this.Promise((resolve, reject) => {
            this.server.bind(this.settings.port, this.settings.ip, err => {
                if (err)
                    return reject(err);

                const addr = this.server.address();
                const listenAddr = addr.address;
                this.logger.info(`Syslog listening on ${listenAddr}:${addr.port}`);
                resolve();
            });
        });
    },

    /**
     * Service stopped lifecycle event handler
     */

    stopped() {
        while (this.streams.length > 0) {
            this.streams.shift().destroy()
        }


        return new this.Promise((resolve, reject) => {
            this.server.close(err => {
                if (err)
                    return reject(err);

                this.logger.info("Syslog stopped!");
                resolve();
            });
        });
    },
}