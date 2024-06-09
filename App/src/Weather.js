import { React, useState, useEffect } from "react";
import { View, Text, ImageBackground } from "react-native";
import { useEnergy } from "./EnergyContext";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import useImage from "./useImage";
import styles from "./Styles";

export default function Weather({ navigation }) {
  const { energyData } = useEnergy();
  const { temp, altitude, humidity, times } = energyData;
  const [displayTemp, setDisplayTemp] = useState(0);
  const { image } = useImage();

  const fahrenheit = Math.round((temp * 9) / 5 + 32);

  useEffect(() => {
    if (Math.abs(fahrenheit - displayTemp) > 1) {
      setDisplayTemp(fahrenheit);
    }
  }, [fahrenheit, displayTemp]);

  const onSwipe = (event) => {
    if (
      event.nativeEvent.translationX > 50 &&
      event.nativeEvent.state === State.END
    ) {
      navigation.navigate("Energy");
    }
  };

  return (
    <ImageBackground source={image} style={styles.container}>
      <PanGestureHandler
        onGestureEvent={onSwipe}
        onHandlerStateChange={onSwipe}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.tempWrapper}>
            <Text style={styles.temp}>{displayTemp}°</Text>
          </View>
          <View style={[styles.panel, { height: "12%", marginBottom: 20 }]}>
            <View style={styles.panelItem}>
              <Text style={styles.text}>{Math.round(humidity)}%</Text>
              <Text style={styles.textUnit}>Humidity</Text>
            </View>
            <View style={styles.panelItem}>
              <Text style={styles.text}>{Math.round(altitude)}</Text>
              <Text style={styles.textUnit}>Feet</Text>
            </View>
          </View>
          {times.sunrise && (
            <View style={[styles.panel, { height: "12%" }]}>
              <View style={styles.panelItem}>
                <Text style={styles.text}>{times.sunrise}</Text>
                <Text style={styles.textUnit}>Sunrise</Text>
              </View>
              <View style={styles.panelItem}>
                <Text style={styles.text}>{times.sunset}</Text>
                <Text style={styles.textUnit}>Sunset</Text>
              </View>
              <View style={styles.panelItem}>
                <Text style={styles.text}>{times.moonrise}</Text>
                <Text style={styles.textUnit}>Moonrise</Text>
              </View>
            </View>
          )}
        </View>
      </PanGestureHandler>
    </ImageBackground>
  );
}
