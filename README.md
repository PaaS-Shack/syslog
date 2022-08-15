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
