import Accessorizer from "../src/accessorizer";

import { platform, Context } from "@smartthings/smartapp";
import { uuid, Characteristic, Service } from "hap-nodejs";
import { API } from "homebridge";
import * as td from "testdouble";

// Why, Homebridge, why?
const api = new API();
const PlatformAccessory = api.platformAccessory;

describe(Accessorizer, () => {
  let accessorizer: Accessorizer;
  let device: platform.Device;
  let context: Context;

  beforeEach(() => {
    accessorizer = new Accessorizer();

    device = {
      deviceId: "device id",
      label: "my device",
      components: [
        {
          id: "component id",
          capabilities: [{ id: "switch" }],
        },
      ],
    };
    context = {
      api: {
        devices: td.object<platform.Devices>(),
      },
    };
  });

  afterEach(() => {
    td.reset();
  });

  describe("when there are no existing accessories", () => {
    describe("updateAccessory", () => {
      it("adds services when they don't exist", async () => {
        const accessory = new PlatformAccessory(
          device.label,
          uuid.generate(device.deviceId),
        );

        accessorizer.update(accessory, device, context);

        const service = accessory.getService(Service.Switch);
        expect(service).not.toBeUndefined();
        const characteristic = service.getCharacteristic(Characteristic.On);

        await verifyGet(characteristic);
        await verifySet(characteristic);
      });

      it("updates services if they exist", async () => {
        const accessory = new PlatformAccessory(
          device.label,
          uuid.generate(device.deviceId),
        );
        accessory.addService(Service.Switch);

        accessorizer.update(accessory, device, context);

        const service = accessory.getService(Service.Switch);
        expect(service).not.toBeUndefined();
        const characteristic = service.getCharacteristic(Characteristic.On);

        await verifyGet(characteristic);
        await verifySet(characteristic);
      });

      it("does not add extra handlers to characteristics", async () => {
        const accessory = new PlatformAccessory(
          device.label,
          uuid.generate(device.deviceId),
        );
        accessory.addService(Service.Switch);

        accessorizer.update(accessory, device, context);
        accessorizer.update(accessory, device, context);

        const service = accessory.getService(Service.Switch);
        expect(service).not.toBeUndefined();
        const characteristic = service.getCharacteristic(Characteristic.On);

        await verifyGet(characteristic);
        await verifySet(characteristic);
      });

      const verifyGet = async (characteristic: typeof Characteristic) => {
        const getPromise = Promise.resolve({
          components: { main: { switch: { switch: { value: "on" } } } },
        });
        td.when(context.api.devices.getState(device.deviceId)).thenReturn(
          getPromise,
        );
        const getCallback = td.func();
        characteristic.emit("get", getCallback);
        await getPromise;
        td.verify(getCallback(null, true), { times: 1 });
      };

      const verifySet = async (characteristic: typeof Characteristic) => {
        const setPromise = Promise.resolve();
        td.when(
          context.api.devices.sendCommand(
            {
              deviceConfig: {
                deviceId: device.deviceId,
                componentId: "main",
              },
            },
            "switch",
            "off",
          ),
        ).thenReturn(setPromise);
        const setCallback = td.func();
        characteristic.emit("set", false, setCallback);
        await setPromise;
        td.verify(setCallback(), { times: 1 });
      };
    });
  });
});
