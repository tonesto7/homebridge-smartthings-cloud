# homebridge-smartthings-cloud

A [Homebridge](https://homebridge.io) plugin that adds Samsung SmartThings
Cloud integration.

This is currently under active development, so I do not recommend using this for
now. 

You should use [homebridge-smartthings-tonesto7][tonesto7] for now until this is complete. 
It requires a lot of setup work at the moment and doesn't respond to device events at all.  
I am actively building this out to replace my existing plugin [tonesto7]: https://github.com/tonesto7/homebridge-smartthings-tonesto7

I'm trying to build this one right.  I want to say thanks to @kejadlen for giving me his starter project to work off of.   I will make an amazing plugin out of it. 


## Setup

(This assumes a working [Homebridge installation][installation].)

Create a new project in the [SmartThings Developer Workspace][workspace] by
following [these instructions][instructions] for the example automation.  This
will get the SmartApp set up and provide the public key that will be used for
configuration.

The public key will need to be base64-encoded. On macOS, you can copy the raw
key and then run `pbpaste | base64` to get the encoded version.

Configure the platform under `platforms` in Homebridge's `config.json`:

```json
 {
   "platform": "SmartThings Cloud",
   "name": "SmartThings Cloud",
   "port": 3000,
   "publicKey": "<base64 encoded public key>"
 }
```

Other options:

- By default, the plugin will store tokens in
  `~/.homebridge/smartthings-cloud.json`, but setting `contextStorePath` allows
  that path to be overridden.

[installation]: https://github.com/nfarina/homebridge#installation
[workspace]: https://smartthings.developer.samsung.com/workspace/projects
[instructions]: https://github.com/SmartThingsCommunity/weather-color-light-smartapp-nodejs#steps
