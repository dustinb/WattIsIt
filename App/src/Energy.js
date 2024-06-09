import { React } from "react";
import { View, Text, ImageBackground, Pressable } from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Bar } from "react-native-progress";
import { useEnergy } from "./EnergyContext";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import useImage from "./useImage";
import * as Haptics from "expo-haptics";
import styles from "./Styles";

export default function Energy({ navigation, route }) {
  const { energyData, setEnergyData } = useEnergy();
  const { volts, amps, wattsIn, wattsOut, connectionStatus, mv } = energyData;
  const { image, rotateImage } = useImage();
  const { writeMV } = route.params;

  // Range of battery voltage
  var length = 12.7 - 11.0; // volt range
  var position = volts - 11.0;
  const percent = position / length;
  const chargeState = percent * 100;

  const onSwipe = (event) => {
    if (
      event.nativeEvent.translationX < -50 &&
      event.nativeEvent.state === State.END
    ) {
      navigation.navigate("Weather");
    }
  };

  const toggleValues = [
    { value: "50 mV", id: 0 },
    { value: "75 mV", id: 1 },
    { value: "100 mV", id: 2 },
  ];

  const resetWattHours = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    writeMV(mv, 1);
  };
  const switchMv = (newMv) => {
    if (mv === newMv) {
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    writeMV(newMv, 0);
    setEnergyData((prevData) => ({
      ...prevData,
      mv: newMv,
    }));
  };

  return (
    <ImageBackground source={image} style={styles.container}>
      <PanGestureHandler
        onGestureEvent={onSwipe}
        onHandlerStateChange={onSwipe}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.topTitle}>
            <Text style={styles.title}>Camp Sense</Text>
          </View>

          <AnimatedCircularProgress
            size={200}
            width={15}
            fill={chargeState}
            lineCap="flat"
            tintColor="#FB975C"
            backgroundColor="#3d5875"
          >
            {(fill) => (
              <View style={styles.voltsWrapper}>
                <Text style={styles.volts}>{volts.toFixed(2)}</Text>

                <Ionicons
                  style={styles.charging}
                  name={amps < 0 ? "battery-charging" : "battery-half"}
                  size={40}
                  color="white"
                />
              </View>
            )}
          </AnimatedCircularProgress>

          <View style={styles.panelWrapper}>
            <View style={styles.batteryWrapper}>
              <Text style={styles.text}>{Math.round(wattsIn)} Wh</Text>
              <Bar
                indeterminate={amps < 0}
                indeterminateAnimationDuration={1000}
                color="green"
                width={50}
                borderWidth={0}
              />
              <Pressable onLongPress={() => resetWattHours()}>
                <MaterialCommunityIcons
                  name="car-battery"
                  size={60}
                  color="white"
                />
              </Pressable>
              <Bar
                indeterminate={amps > 0}
                indeterminateAnimationDuration={1000}
                color="red"
                width={50}
                borderWidth={0}
              />
              <Text style={styles.text}>{Math.round(wattsOut)} Wh</Text>
            </View>

            <View style={styles.panel}>
              <View style={styles.panelItem}>
                <Text style={styles.text}>{Math.abs(amps.toFixed(1))}</Text>
                <Text style={styles.textUnit}>Amps</Text>
              </View>
              <View style={styles.panelItem}>
                <Text style={styles.text}>
                  {Math.abs(Math.round(volts * amps))}
                </Text>
                <Text style={styles.textUnit}>Watts</Text>
              </View>
            </View>

            {connectionStatus == "Connected" && (
              <View style={styles.panel}>
                {toggleValues.map((item, index) => (
                  <Pressable key={index} onLongPress={() => switchMv(item.id)}>
                    <View style={styles.toggleView}>
                      <Text
                        style={mv == item.id ? styles.text : styles.toggleText}
                      >
                        {item.value}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {connectionStatus !== "Connected" && (
              <View style={styles.panel}>
                <Ionicons name="bluetooth" size={24} color="white" />
                <Text style={styles.text}>{connectionStatus}</Text>
              </View>
            )}
          </View>
        </View>
      </PanGestureHandler>
    </ImageBackground>
  );
}
