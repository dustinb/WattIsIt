import React, { createContext, useState, useContext, useEffect } from "react";
import useLocation from "./useLocation";

const EnergyContext = createContext();

export const EnergyProvider = ({ children }) => {
  const [energyData, setEnergyData] = useState({
    volts: 0,
    amps: 0,
    pressure: 0,
    temp: 0,
    altitude: 0,
    humidity: 0,
    wattsIn: 0,
    wattsOut: 0,
    connectionStatus: "Disconnected",
    mv: 0,
    times: { sunrise: "", sunset: "", moonrise: "" },
  });
  const { location } = useLocation(setEnergyData);
  return (
    <EnergyContext.Provider value={{ energyData, setEnergyData }}>
      {children}
    </EnergyContext.Provider>
  );
};

export const useEnergy = () => useContext(EnergyContext);
