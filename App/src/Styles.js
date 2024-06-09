import { StyleSheet } from "react-native";

export default styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 40,
    width: "100%",
    marginBottom: 20,
  },
  topTitle: {
    marginTop: 30,
    flexDirection: "row",
    paddingVertical: 20,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 25,
    color: "white",
    fontWeight: "bold",
  },
  voltsWrapper: {
    marginTop: 15,
    alignItems: "center",
  },
  volts: {
    fontSize: 40,
    color: "white",
    fontWeight: "bold",
    fontFamily: "Sytem",
  },
  panelWrapper: {
    flex: 1,
    direction: "row",
    alignItems: "center",
    width: "100%",
    rowGap: 30,
  },
  batteryWrapper: {
    marginTop: "auto",
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "90%",
  },
  panel: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(251, 150, 92, 0.1)",
    borderRadius: 20,
    borderColor: "white",
    borderWidth: 1,
    width: "90%",
    height: "20%",
  },
  toggleText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "grey",
    textAlign: "center",
    fontFamily: "System",
  },
  panelItem: {
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
    fontFamily: "System",
  },
  toggleView: {
    paddingRight: 15,
    paddingLeft: 15,
  },
  textUnit: {
    fontSize: 12,
    color: "white",
    fontWeight: "bold",
    fontFamily: "System",
  },
  charging: {
    marginLeft: 8,
  },
  tempWrapper: {
    flex: 1,
    justifyContent: "center",
    marginBottom: 100,
  },
  temp: {
    fontSize: 150,
    fontWeight: "light",
    textAlign: "right",
    color: "white",
    paddingRight: 35,
    fontFamily: "System",
  },
});
