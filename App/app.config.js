const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return "com.roundporch.wattisit.dev";
  }

  if (IS_PREVIEW) {
    return "com.roundporch.wattisit.preview";
  }

  return "com.roundporch.wattisit";
};

const getAppName = () => {
  if (IS_DEV) {
    return "Camp Sense (Dev)";
  }

  if (IS_PREVIEW) {
    return "Camp Sense (Preview)";
  }

  return "Camp Sense";
};

export default {
  expo: {
    name: getAppName(),
    slug: "WattIsIt",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/camp4.jpg",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    env: {
      EXPO_PUBLIC_IPGEO_API_KEY: process.env.EXPO_PUBLIC_IPGEO_API_KEY,
    },
    plugins: [
      "react-native-ble-plx",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Allow $(PRODUCT_NAME) to use your location.",
        },
      ],
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: getUniqueIdentifier(),
      infoPlist: {
        NSBluetoothAlwaysUsageDescription:
          "Camp Senses uses Bluetooth to connect to devices.",
        NSBluetoothPeripheralUsageDescription:
          "Camp Sense needs access to your Bluetooth.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: getUniqueIdentifier(),
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      eas: {
        projectId: "b36ab266-2a21-4099-9502-a3a48f6e3816",
      },
    },
    owner: "oldbute",
  },
};
