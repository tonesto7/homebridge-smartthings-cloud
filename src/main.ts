import os from "os";
import path from "path";

import SmartApp, { Context } from "@smartthings/smartapp";
import express from "express";
import HAPNodeJS from "hap-nodejs";
import { API, Log, PlatformAccessory } from "homebridge";

import Accessorizer from "./accessorizer";
import { SingleContextStore } from "./fileContextStore";

let Accessory: typeof PlatformAccessory;
let UUID: typeof HAPNodeJS.uuid;

export default function(homebridge: API) {
  Accessory = homebridge.platformAccessory;
  UUID = homebridge.hap.uuid;

  homebridge.registerPlatform(
    "homebridge-smartthings-cloud",
    "SmartThings Cloud",
    Platform,
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

    this.smartApp = new SmartApp()
      .publicKey(publicKey)
      .enableEventLogging(2)
      .contextStore(this.contextStore)
      .page("mainPage", (_context, page, _config) =>
        page.name("Setup Homebridge Plugin").section("Devices", section => {
          const capabilities: { [index: string]: string } = {
            motionSensor: "motion sensors",
            switch: "switches",
          };
          for (const capability in capabilities) {
            const plural = capabilities[capability];
            const deviceSetting = section.deviceSetting(capability);
            deviceSetting
              .name(`Select ${plural}`)
              .capability(capability)
              .multiple(true)
              .permissions("rx");
          }
        }),
      )
      .updated(async context => {
        this.updateAccessories(context);
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

  private updateAccessories = async (maybeContext?: Context) => {
    const context = maybeContext || (await this.withContext());
    if (!context) {
      return;
    }
    const devices = await context.api.devices.listAll();

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
  }

  private withContext = async () => {
    const context = await this.contextStore.readContext();
    if (!context) {
      return;
    }
    const installedAppId = context.installedAppId;
    return await this.smartApp.withContext(installedAppId);
  }
}
