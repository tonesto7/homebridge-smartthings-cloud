declare module "@smartthings/smartapp" {
  import express from "express";

  export default class SmartApp {
    publicKey(key: string): this;
    enableEventLogging(jsonSpace: number): this;
    contextStore(contextStore: ContextStore): this;
    page(id: string, callback: PageCallback): this;
    handleHttpCallback(req: express.Request, res: express.Response): this;
    updated(callback: UpdateCallback): this;
    subscribedEventHandler(id: string, callback: EventHandlerCallback): this;
    withContext(installedAppId: string): Promise<Context>;
  }

  interface ContextStore { }

  type PageCallback = (context: Context, page: config.Page, data: Data) => void;
  type UpdateCallback = (context: Context, data: Data) => void;
  type EventHandlerCallback = (context: Context, event: Data) => void;

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
    config: Config;
  }

  interface Api {
    devices: platform.Devices;
    subscriptions: platform.Subscriptions;
  }

  namespace platform {
    interface Devices {
      listAll(): Promise<AllDevices>;
      sendCommand(
        item: { deviceConfig: DeviceConfig },
        capabilityName: string,
        command: string,
      ): Promise<void>;

      sendCommands(
        items: { deviceConfig: DeviceConfig },
        capabilityName: string,
        command: string,
      ): Promise<void>;
      getState(deviceId: string): Promise<State>;
      getAttributeValue(
        deviceId: string,
        capability: string,
        attribute: string,
      ): Promise<void>;
    }

    interface Subscriptions {
      list(): Promise<void>;
      get(name: string): Promise<void>;
      update(name: string, data: any): Promise<void>;
      unsubscribe(name: string): Promise<void>;
      unsubscribeAll(): Promise<void>;
      subscribeToDevices(
        devices: config.DeviceSetting,
        capability: string,
        attribute: string,
        subscriptionName: string,
        options?: {},
      ): Promise<void>;
      subscribeToCapability(
        capability: string,
        attribute: string,
        subscriptionName: string,
        options?: {},
      ): Promise<void>;
      subscribeToModeChange(subscriptionName: string): Promise<void>;
      subscribeToDeviceLifecycle(subscriptionName: string): Promise<void>;
      subscribeToDeviceHealth(subscriptionName: string): Promise<void>;
      subscribeToSecuritySystem(subscriptionName: string): Promise<void>;
      subscribeToHubHealth(subscriptionName: string): Promise<void>;
      subscribeToSceneLifecycle(subscriptionName: string): Promise<void>;
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
    interface Data { }

    interface Page {
      name(name: string): this;
      complete(complete: string): this;
      style(value: string): this;
      i18nKey(property: string): this;
      section(name: string, closure: SectionCallback): void;
    }

    interface Section {
      name(name: string): this;

      deviceSetting(id: string): DeviceSetting;
      numberSetting(id: string): NumberSetting;
      booleanSetting(id: string): BooleanSetting;
      modeSetting(id: string): ModeSetting;
      paragraphSetting(id: string): ParagraphSetting;
      enumSetting(id: string): EnumSetting;
    }

    interface DeviceSetting {
      name(name: string): this;
      capability(capability: string): this;
      required(value: boolean): this;
      capabilities(items: string[]): this;
      multiple(value: boolean): this;
      closeOnSelection(value: boolean): this;
      preselect(value: string[]): this;
      description(description: string): this;
      permissions(permissions: string): this;
      excludeCapabilities(capabilities: string): this;
      excludeCapability(value: string[]): this;
    }

    interface BooleanSetting {
      submitOnChange(value: boolean): this;
      image(value: string): this;
    }

    interface NumberSetting {
      max(value: number): this;
      min(value: number): this;
      step(value: string): this;
      style(value: string): this;
      image(value: string): this;
    }

    interface ParagraphSetting {
      text(value: string): this;
      description(value: string): this;
      image(source: string): this;
    }

    interface ModeSetting {
      multiple(value: boolean): this;
      closeOnSelection(value: boolean): this;
      style(value: string): this;
      submitOnChange(value: boolean): this;
    }

    interface EnumSetting {
      multiple(value: boolean): this;
      closeOnSelection(value: boolean): this;
      options(options: EnumOptions[]): this;
      groupedOptions(groups: EnumGroupedOptions[]): this;
      style(value: string): this;
      submitOnChange(value: boolean): this;
    }

    //TODO: type-ify capabilities, permissions
    interface EnumOptions {
      name: string;
      id: string;
    }

    interface EnumGroupedOptions {
      name: string;
      options: EnumOptions[];
    }

    type SectionCallback = (section: Section) => void;
  }
}
