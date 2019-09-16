import { Context, platform } from "@smartthings/smartapp";
import { Characteristic, Service } from "hap-nodejs";
import { PlatformAccessory } from "homebridge";

export default class Accessorizer {
  update(
    accessory: PlatformAccessory,
    device: platform.Device,
    context: Context,
  ) {
    let getTheService = Service => {
      return accessory.getService(Service) || accessory.addService(Service);
    };
    for (const component of device.components) {
      getTheService(Service.AccessoryInformation).setCharacteristic(
        Characteristic.Identify,
        component.capabilities["Switch"] !== undefined,
      );
      // .setCharacteristic(Characteristic.FirmwareRevision, component.firmwareVersion)
      // .setCharacteristic(Characteristic.Manufacturer, component.manufacturerName)
      // .setCharacteristic(Characteristic.Model, `${toTitleCase(component.modelName)}`)
      // .setCharacteristic(Characteristic.Name, component.name)
      // .setCharacteristic(Characteristic.SerialNumber, component.serialNumber);
      for (const capability of component.capabilities) {
        switch (capability.id) {
          case "switch":
            let characteristic = getTheService(
              Service.Switch,
            ).getCharacteristic(Characteristic.On);
            characteristic.removeAllListeners("get");
            characteristic.removeAllListeners("set");
            characteristic.on("get", callback => {
              context.api.devices
                .getState(device.deviceId)
                .then(
                  state => state.components.main.switch.switch.value === "on",
                )
                .then(value => callback(null, value))
                .catch(callback);
            });
            characteristic.on("set", (value, callback) => {
              const command = value ? "on" : "off";
              context.api.devices
                .sendCommand(
                  {
                    deviceConfig: {
                      deviceId: device.deviceId,
                      componentId: "main",
                    },
                  },
                  "switch",
                  command,
                )
                .then(() => callback())
                .catch(callback);
            });
            break;
        }
      }
    }
  }
}
