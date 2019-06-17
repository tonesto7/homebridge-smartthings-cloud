declare module "homebridge" {
  import HAPNodeJS from "hap-nodejs";

  export default interface Homebridge {
    API: typeof API;
  }

  export type Log = (s: string) => void;

  export class API {
    hap: HAPNodeJS.HAPNodeJS;
    platformAccessory: typeof PlatformAccessory;

    constructor();

    registerPlatform(
      pluginName: string,
      platformName: string,
      konstructor: object,
      dynamic?: boolean,
    ): void;
  }

  export class PlatformAccessory {
    UUID: string;

    constructor(displayName: string, uuid: string);

    on(
      eventName: "identify",
      listener: (paired: any, callback: () => void) => void,
    ): void;

    addService(service: HAPNodeJS.PredefinedService): HAPNodeJS.Service;
    getService(
      service: HAPNodeJS.PredefinedService,
    ): HAPNodeJS.Service | undefined;
  }
}
