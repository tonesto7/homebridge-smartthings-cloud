import { Context, platform } from "@smartthings/smartapp";
import { Characteristic, Service } from "hap-nodejs";
import { PlatformAccessory } from "homebridge";

export default class Accessorizer {
  update(
    accessory: PlatformAccessory,
    device: platform.Device,
    context: Context,
  ) {
    for (const component of device.components) {
      for (const capability of component.capabilities) {
        switch (capability.id) {
          case "switch":
            const service =
              accessory.getService(Service.Switch) ||
              accessory.addService(Service.Switch);
            const characteristic = service.getCharacteristic(Characteristic.On);
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
