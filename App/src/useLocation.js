import { useState, useEffect } from "react";
import * as Location from "expo-location";

const API_KEY = process.env.EXPO_PUBLIC_IPGEO_API_KEY;

const convertTo12HourFormat = (time24, meridiem) => {
  let [hour, minute] = time24.split(":");
  hour = parseInt(hour);

  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  hour = hour ? hour : 12;

  if (meridiem) {
    return `${hour}:${minute} ${ampm}`;
  }
  return `${hour}:${minute}`;
};

const useLocation = (setEnergyData) => {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      const lat = location.coords.latitude;
      const long = location.coords.longitude;

      return fetch(
        `https://api.ipgeolocation.io/astronomy?apiKey=${API_KEY}&lat=${lat}&long=${long}`
      )
        .then((response) => response.json())
        .then((json) => {
          if (json.message) {
            console.log(json.message);
            return;
          }
          console.log(json);
          setEnergyData((prev) => ({
            ...prev,
            times: {
              sunrise: convertTo12HourFormat(json.sunrise),
              sunset: convertTo12HourFormat(json.sunset),
              moonrise: convertTo12HourFormat(json.moonrise, true),
            },
          }));
        })
        .catch((error) => {
          console.log(error);
        });
    })();
  }, []);

  return { location };
};

export default useLocation;
