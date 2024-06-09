import { StyleSheet } from "react-native";
import { useEffect } from "react";
import { atob } from "react-native-quick-base64";
import Energy from "./src/Energy";
import Weather from "./src/Weather";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { EnergyProvider } from "./src/EnergyContext";
import { useEnergy } from "./src/EnergyContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import useBLE from "./src/useBLE";

export default function App() {
  return (
    <EnergyProvider>
      <MainApp />
    </EnergyProvider>
  );
}

const CHAR_UUID_WEATHER_DATA = "eb19820c-c6cc-46a8-93a6-3645803d8e8f";
const CHAR_UUID_ENERGY_DATA = "1dc27998-20cd-4cf5-a5f3-3fe25f55c0f8";
const CHAR_UUID_MV = "6ebe8ad1-ab57-4f57-bf64-fd9ce197d9c4";

function MainApp() {
  const { setEnergyData } = useEnergy();

  // Receive characteristic updates
  const monitor = (error, char) => {
    if (error) {
      console.error(error);
      return;
    }

    const value = atob(char.value);
    switch (char.uuid) {
      case CHAR_UUID_WEATHER_DATA:
        const {
          f1: tempurature,
          f2: humidity,
          f3: pressure,
          f4: altitude,
        } = unpackSensorData(value);
        setEnergyData((prevData) => ({
          ...prevData,
          temp: tempurature,
          humidity: humidity,
          pressure: pressure,
          altitude: altitude,
        }));
        break;
      case CHAR_UUID_ENERGY_DATA:
        const {
          f1: volts,
          f2: amps,
          f3: wattsIn,
          f4: wattsOut,
        } = unpackSensorData(value);
        setEnergyData((prevData) => ({
          ...prevData,
          volts: volts,
          amps: amps,
          wattsIn: wattsIn,
          wattsOut: wattsOut,
        }));
        break;
      case CHAR_UUID_MV:
        const byteArray = new Uint8Array(value.length);
        for (let i = 0; i < value.length; i++) {
          byteArray[i] = value.charCodeAt(i);
        }
        const dataView = new DataView(byteArray.buffer);
        const mv = dataView.getUint8(0);
        console.log("MV Data: ", mv);
        setEnergyData((prevData) => ({
          ...prevData,
          mv: mv,
        }));
        break;
      default:
        console.log("Unknown characteristic: ", char.uuid, value);
        break;
    }
  };

  const { connectionStatus, writeMV } = useBLE(monitor);

  const unpackSensorData = (binaryString) => {
    // Convert binary string to byte array
    const byteArray = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      byteArray[i] = binaryString.charCodeAt(i);
      i;
    }

    // Create DataView to extract values
    const dataView = new DataView(byteArray.buffer);

    // Each float is 4 bytes
    const f1 = dataView.getFloat32(0, true); // true for little-endian
    const f2 = dataView.getFloat32(4, true);
    const f3 = dataView.getFloat32(8, true);
    const f4 = dataView.getFloat32(12, true);

    return {
      f1,
      f2,
      f3,
      f4,
    };
  };

  useEffect(() => {
    setEnergyData((prevData) => ({
      ...prevData,
      connectionStatus: connectionStatus,
    }));
  }, [connectionStatus]);

  const Stack = createNativeStackNavigator();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName="Energy"
        >
          <Stack.Screen
            name="Energy"
            component={Energy}
            initialParams={{ writeMV: writeMV }}
          />
          <Stack.Screen name="Weather" component={Weather} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
