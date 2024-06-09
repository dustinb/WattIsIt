import { useEffect, useState, useRef } from "react";
import { BleManager } from "react-native-ble-plx";
import base64 from "react-native-base64";

// WattIsIt service UUID
const SERVICE_UUID = "13030a97-68c2-4746-852a-3566bce33d89";
const CHAR_UUID_MV = "6ebe8ad1-ab57-4f57-bf64-fd9ce197d9c4";
const DEVICE_NAME = "WattIsIt";

const bleManager = new BleManager();

const useBLE = (monitor) => {
  const [deviceID, setDeviceID] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("BLE Searching...");
  const deviceRef = useRef(null);
  const charRef = useRef(null);

  const writeMV = (mV, reset) => {
    if (charRef.current) {
      const buffer = new ArrayBuffer(4); // 4 bytes: 2 bytes for each integer (16-bit)
      const view = new DataView(buffer);
      view.setInt16(0, mV, true);
      view.setInt16(2, reset, true);

      // Convert the buffer to a binary string
      const binaryString = String.fromCharCode.apply(
        null,
        new Uint8Array(buffer)
      );
      const base64Value = base64.encode(binaryString);
      charRef.current
        .writeWithResponse(base64Value)
        .then(() => {
          console.log("Write successful");
        })
        .catch((error) => {
          console.error("Failed to write characteristic: ", error);
        });
    } else {
      console.error("Characteristic not found");
    }
  };

  const searchAndConnectToDevice = () => {
    const checkBleState = () => {
      return bleManager
        .state()
        .then((state) => {
          console.log("BLE State: ", state);
          setConnectionStatus("BLE State: " + state);
          if (state === "PoweredOn") {
            return true;
          } else {
            return false;
          }
        })
        .catch((error) => {
          console.error("Failed to get BLE state: ", error);
          return false;
        });
    };

    const waitForPoweredOn = async () => {
      let isPoweredOn = await checkBleState();
      while (!isPoweredOn) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for 1 second
        isPoweredOn = await checkBleState();
      }
      return true;
    };

    waitForPoweredOn().then(() => {
      console.log("Scanning for devices...");
      setConnectionStatus("Scanning for " + DEVICE_NAME + "...");
      bleManager.startDeviceScan([SERVICE_UUID], null, (error, device) => {
        console.log("device: ", device.name);
        if (error) {
          console.error("Wait For On", error);
          setConnectionStatus(error.message);
          return;
        }
        if (device.name === DEVICE_NAME) {
          bleManager.stopDeviceScan();
          setConnectionStatus("Connecting...");
          device.cancelConnection();
          connectToDevice(device);
        }
      });
    });
  };

  const connectToDevice = (device) => {
    return device
      .connect()
      .then((device) => {
        setDeviceID(device.id);
        setConnectionStatus("Connected");
        deviceRef.current = device;
        return device.discoverAllServicesAndCharacteristics();
      })
      .then((device) => {
        return device.services();
      })
      .then((services) => {
        let service = services.find((service) => service.uuid === SERVICE_UUID);
        return service.characteristics();
      })
      .then((characteristics) => {
        // monitor all characteristics
        characteristics.forEach((char) => {
          console.log("char: ", char.uuid);
          if (char.uuid === CHAR_UUID_MV) {
            // read MV characteristic
            charRef.current = char;
            char.read().then((char) => {
              console.log("MV Data: ", char.value);
              monitor(null, char);
            });
          } else {
            char.monitor(monitor);
          }
        });
      })
      .catch((error) => {
        console.log("Connect to device", error);
        setConnectionStatus("Error in Connection");
      });
  };

  useEffect(() => {
    const subscription = bleManager.onDeviceDisconnected(
      deviceID,
      (error, device) => {
        if (error) {
          console.log("Disconnected with error:", error);
        }
        setConnectionStatus("Disconnected");
        console.log("Disconnected device");
        if (deviceRef.current) {
          setConnectionStatus("Reconnecting...");
          connectToDevice(deviceRef.current)
            .then(() => setConnectionStatus("Connected"))
            .catch((error) => {
              console.log("Reconnection failed: ", error);
              setConnectionStatus("Reconnection failed");
            });
        }
      }
    );
    return () => subscription.remove();
  }, [deviceID]);

  useEffect(() => {
    searchAndConnectToDevice();
  }, []);

  return {
    connectionStatus,
    writeMV,
  };
};

export default useBLE;
