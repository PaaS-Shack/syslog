![Moleculer logo](https://moleculer.services/images/banner.png)

# Syslog

Moleculer remote Syslog server

# Features
- UDP

# Install

```bash
$ git clone https://github.com/PaaS-Shack/agent.git
$ cd agent
$ npm i
```

# Usage

```js
"use strict";

const { ServiceBroker } = require("moleculer");


const broker = new ServiceBroker();


broker.start()

// Get node hearbeat
.then(() => broker.call("v1.node.heartbeat", {}))
//Tests a user's permissions for the file or directory specified by path.
.then(() => broker.call("v1.node.fs.access", {
    path:'/root'
}))

```

# Settings

| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |


# Actions

## `v1.syslog.enableConsole`

Enable console logging.

### Parameters
| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| `key` | `String` | **required** | Log key ${hostname}.${service}. |

### Results
**Type:** `<Object>`

## `v1.syslog.disableConsole`

Disable console logging.

### Parameters
| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| `key` | `String` | **required** | Log key ${hostname}.${service}. |

### Results
**Type:** `<Object>`

## `v1.syslog.getLog`

Disable console logging.

### Parameters
| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| `key` | `String` | **required** | Log key ${hostname}.${service}. |

### Results
**Type:** `<Object>`

## `v1.syslog.getStream`

Pass a readable stream as params and meta.key. Responds with a readable

### Metadata
| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| `key` | `String` | **required** | Log key ${hostname}.${service}. |

### Parameters 
| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| - | `ReadStream` | **required** | Log key ${hostname}.${service}. |

### Results
**Type:** `<ReadStream>`

## `v1.syslog.matchStream`

Get readable stream that matchs a wildcard key. 
Key `myhost.*` will stream all logs from the host with the hostname of `myhost`
Key `*` will stream all avalable streams and any new ones.

https://www.npmjs.com/package/wildcard-match

### Parameters
| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| `key` | `String` | **required** | Wild card key |

### Results
**Type:** `<ReadStream>`
