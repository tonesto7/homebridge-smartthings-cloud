import SmartApp, { Context } from "@smartthings/smartapp";
import express from "express";
import HAPNodeJS from "hap-nodejs";
import { API, Log, PlatformAccessory } from "homebridge";
import os from "os";
import path from "path";
import Accessorizer from "./accessorizer";
import { SingleContextStore } from "./fileContextStore";
// import { promises } from "fs";

let Accessory: typeof PlatformAccessory;
let UUID: typeof HAPNodeJS.uuid;

export default function (homebridge: API) {
  Accessory = homebridge.platformAccessory;
  UUID = homebridge.hap.uuid;

  homebridge.registerPlatform(
    "homebridge-smartthings-cloud",
    "SmartThings Cloud",
    Platform,
    true,
  );
}

export interface Config {
  port: number;
  publicKey: string;
  contextStorePath: string | undefined;
}

export class Platform {
  private accessories: { [index: string]: PlatformAccessory } = {};
  private accessorizer = new Accessorizer();
  private contextStore: SingleContextStore;
  private smartApp: SmartApp;

  constructor(private log: Log, config: Config, private api: any) {
    const publicKey = Buffer.from(config.publicKey, "base64").toString();
    const contextStorePath = path.normalize(
      (
        config.contextStorePath || "~/.homebridge/smartthings-cloud.json"
      ).replace(/^~/, os.homedir()),
    );
    this.contextStore = new SingleContextStore(contextStorePath);
    // console.log("StorePath: ", contextStorePath);

    const pageDeviceOpts: { name: string, capability: string, attribute: string, id: string, description?: string | 'Tap to Configure...', required?: boolean | false, multiple?: boolean | true, image?: string | '' }[] = [
      { name: 'Switches', capability: 'switch', attribute: 'switch', id: "switchDevices", description: 'Tap to configure...', multiple: true },
      // { name: 'Motion Sensors', capability: 'motionSensor', attribute: 'motion', id: 'motionSensors', description: 'Tap to configure...', multiple: true },
      // { name: 'Contact Sensors', capability: 'contactSensor', attribute: 'contact', id: 'contactSensors', description: 'Tap to configure...', multiple: true },
      // { name: 'Temp Sensors', capability: 'temperatureMeasurement', attribute: 'temperature', id: 'tempSensors', description: 'Tap to configure...', multiple: true },
      // { name: 'Humidity Sensors', capability: 'relativeHumidityMeasurement', attribute: 'humidity', id: 'humiditySensors', description: 'Tap to configure...', multiple: true },
      // { name: 'Illuminance Sensors', capability: 'illuminanceMeasurement', attribute: 'illuminance', id: 'lightSensors', description: 'Tap to configure...', multiple: true },
    ];

    this.smartApp = new SmartApp()
      .publicKey(publicKey)
      .enableEventLogging(2)
      .contextStore(this.contextStore)

      //Main SmartApp Page
      .page("mainPage", (_context, page, _config) =>
        page
          .name("Setup Homebridge Plugin")
          .section("Device Selection", section => {

            for (const i in pageDeviceOpts) {
              const deviceSetting = section.deviceSetting(pageDeviceOpts[i].id);
              deviceSetting
                .name(`Select ${pageDeviceOpts[i].name}`)
                .capability(pageDeviceOpts[i].capability)
                .description(pageDeviceOpts[i].description)
                .multiple(pageDeviceOpts[i].multiple)
                .required(pageDeviceOpts[i].required)
                .permissions("rx");
            }
          }),
      )
      .updated(async ctx => {
        await ctx.api.subscriptions.unsubscribeAll();
        let subs: Array<object> = []
        for (const i in pageDeviceOpts) {
          subs.push(ctx.api.subscriptions.subscribeToDevices(
            ctx.config.deviceSetting[pageDeviceOpts[i].id],
            pageDeviceOpts[i].capability,
            pageDeviceOpts[i].attribute,
            "deviceEventHandler",
          ))
        }
        Promise.all(subs);
        this.updateAccessories(ctx);
      })
      .subscribedEventHandler("deviceEventHandler", (_context, event) => {
        console.log(event);
        // const value = event.value === 'open' ? 'on' : 'off';
        // context.api.devices.sendCommands(context.config.lights, 'switch', value);
      });

    const app = express();
    app.use(express.json());

    app.post("/", (req, res, _next) => {
      this.smartApp.handleHttpCallback(req, res);
    });

    (async () => {
      app.listen(config.port, () =>
        this.log(`Server is up and running on port ${config.port}`),
      );
    })();

    this.api.on("didFinishLaunching", this.updateAccessories);
  }

  configureAccessory(accessory: PlatformAccessory): void {
    this.accessories[accessory.UUID] = accessory;
  }

  removeAccessory(accessory: PlatformAccessory): void {
    this.accessories[accessory.UUID] = accessory;
  }

  private updateAccessories = async (maybeContext?: Context) => {
    const context = maybeContext || (await this.withContext());
    if (!context) {
      return;
    }
    const devices = await context.api.devices.listAll();
    console.log(devices);
    const unregisteredAccessories = [];
    for (const device of devices.items) {
      const uuid = UUID.generate(device.deviceId);
      const accessory =
        this.accessories[uuid] ||
        (() => {
          const accessory = new Accessory(device.label, uuid);
          unregisteredAccessories.push(accessory);
          return accessory;
        })();
      this.accessorizer.update(accessory, device, context);
      this.accessories[uuid] = accessory;
    }

    this.api.registerPlatformAccessories(
      "homebridge-smartthings-cloud",
      "SmartThings Cloud",
      unregisteredAccessories,
    );
  };

  private withContext = async () => {
    const context = await this.contextStore.readContext();
    if (!context) {
      return undefined;
    }
    const installedAppId = context.installedAppId;
    return await this.smartApp.withContext(installedAppId);
  };
}
