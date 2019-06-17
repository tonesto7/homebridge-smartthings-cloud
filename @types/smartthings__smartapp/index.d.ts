declare module "@smartthings/smartapp" {
  import express from "express";

  export default class SmartApp {
    publicKey(key: string): this;
    enableEventLogging(jsonSpace: number): this;
    contextStore(contextStore: ContextStore): this;
    page(id: string, callback: PageCallback): this;
    handleHttpCallback(req: express.Request, res: express.Response): this;
    updated(callback: UpdateCallback): this;
    withContext(installedAppId: string): Promise<Context>;
  }

  interface ContextStore {}

  type PageCallback = (context: Context, page: config.Page, data: Data) => void;
  type UpdateCallback = (context: Context, data: Data) => void;

  interface Config {
    [index: string]: Device[];
  }

  interface Data {
    installedApp: InstalledApp;
  }

  interface InstalledApp {
    config: Config;
  }

  interface Device {
    // valueType: DeviceType;
    deviceConfig: DeviceConfig;
  }

  // type DeviceType = "DEVICE";

  interface DeviceConfig {
    deviceId: string;
    componentId: string;
  }

  interface Context {
    api: Api;
  }

  interface Api {
    devices: platform.Devices;
  }

  namespace platform {
    interface Devices {
      listAll(): Promise<AllDevices>;
      sendCommand(
        item: { deviceConfig: DeviceConfig },
        capabilityName: string,
        command: string,
      ): Promise<void>;
      getState(deviceId: string): Promise<State>;
    }

    interface AllDevices {
      items: Device[];
    }

    interface Device {
      deviceId: string;
      label: string;
      components: Component[];
    }

    interface Component {
      id: string;
      capabilities: Capability[];
    }

    interface Capability {
      id: string;
    }

    interface State {
      components: Components;
    }

    interface Components {
      main: any;
    }
  }

  namespace config {
    // type Capability = "motionSensor" | "switch";
    interface Data {}
    interface Page {
      name(name: string): this;
      section(name: string, closure: SectionCallback): void;
    }
    interface Section {
      name(name: string): this;
      deviceSetting(id: string): DeviceSetting;
    }
    interface DeviceSetting {
      name(name: string): this;
      capability(capability: string): this;
      capabilities(items: string[]): this;
      multiple(value: boolean): this;
      permissions(permissions: string): this;
    }

    //TODO: type-ify capabilities, permissions

    type SectionCallback = (section: Section) => void;
  }
}
