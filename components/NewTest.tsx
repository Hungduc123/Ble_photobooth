import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  NativeModules,
  NativeEventEmitter,
  Button,
  Platform,
  PermissionsAndroid,
  FlatList,
  TouchableHighlight,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
} from "react-native";

import { Colors } from "react-native/Libraries/NewAppScreen";

import BleManager, { Peripheral } from "react-native-ble-manager";
import NoDeviceAvailable from "./NoDeviceAvailable";
import { Card } from "native-base";
import { TypePeripheral } from "../data/peripheral";
import { addList } from "../slice/listDevice";
import { useDispatch } from "react-redux";
import { deviceConnected } from "../slice/deviceConnected";
import { useHistory } from "react-router-native";
import { MaterialCommunityIcons, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const NewTest = () => {
  const history = useHistory();
  const [colorBg, setColorBg] = useState<string>("white");
  const dispatch = useDispatch();
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const peripherals = new Map();
  const [list, setList] = useState<Array<TypePeripheral>>([]);
  const [open, setOpen] = useState<boolean | null>();
  const [peripheralStore, setPeripheralStore] = useState<string>("");

  const startScan = () => {
    if (!isScanning) {
      BleManager.scan([], 3, true)
        .then((results) => {
          console.log("Scanning...");
          console.log("1");

          setIsScanning(true);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  };

  const handleStopScan = () => {
    console.log("Scan is stopped");
    console.log("2");

    setIsScanning(false);
  };

  const handleDisconnectedPeripheral = async (data: any) => {
    let peripheral = peripherals.get(data.peripheral);
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      setList(Array.from(peripherals.values()));
    }
    try {
      await AsyncStorage.setItem("peripheralId", "");
    } catch (error) {
      // Error saving data
    }
    console.log("3");

    console.log("Disconnected from " + data.peripheral);
  };

  const handleUpdateValueForCharacteristic = (data: any) => {
    console.log(
      "Received data from " +
        data.peripheral +
        " characteristic " +
        data.characteristic,
      data.value
    );
    console.log("4");
  };

  const retrieveConnected = () => {
    BleManager.getConnectedPeripherals([]).then((results: any) => {
      if (results.length == 0) {
        console.log("No connected peripherals");
      }
      console.log("results");
      console.log(results);

      for (var i = 0; i < results.length; i++) {
        var peripheral = results[i];
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        setList(Array.from(peripherals.values()));

        console.log("list");
        console.log(list);
      }
    });
  };

  const handleDiscoverPeripheral = async (peripheral: Peripheral) => {
    console.log("5");

    console.log("Got ble peripheral", peripheral);
    let p;
    try {
      const value = await AsyncStorage.getItem("peripheralId");
      if (value !== null) {
        // We have data!!
        p = value;
        setPeripheralStore(p);
      }
    } catch (error) {
      // Error retrieving data
    }
    if (peripheral.id === p) {
      console.log("already");
      setOpen(true);
      setColorBg("#E8E8E8B2");
    }
    if (!peripheral.name) {
      peripheral.name = "NO NAME";
    }
    peripherals.set(peripheral.id, peripheral);
    setList(Array.from(peripherals.values()));
    const action = addList(list);
    dispatch(action);
  };

  const connectPeriphery = async (peripheralId: string) => {
    console.log("6");

    BleManager.connect(peripheralId)
      .then(async () => {
        ///////////////////
        BleManager.isPeripheralConnected(peripheralId, []).then(
          (isConnected) => {
            if (isConnected) {
              console.log("Peripheral is connected!");
            } else {
              console.log("Peripheral is NOT connected!");
            }
          }
        );
        ////////////////////////////////////////////////////
        ///////////////////save peripheral ////////////////
        try {
          await AsyncStorage.setItem("peripheralId", peripheralId);
        } catch (error) {
          // Error saving data
        }
        try {
          const value = await AsyncStorage.getItem("peripheralId");
          if (value !== null) {
            // We have data!!
            console.log("save");

            console.log(value);
          }
        } catch (error) {
          // Error retrieving data
        }
        /////////////////////////////////////
        let p = peripherals.get(peripheralId);
        if (p) {
          p.connected = true;
          peripherals.set(peripheralId, p);
          setList(Array.from(peripherals.values()));
        }
        const action = deviceConnected(peripheralId + "");
        dispatch(action);
        console.log("Connected to " + peripheralId);

        Alert.alert("Notification", "Connected completed to " + peripheralId, [
          {
            text: "Cancel",
            onPress: () => console.log("Cancel Pressed"),
            style: "cancel",
          },
          { text: "OK", onPress: () => history.push("/Camera__") },
        ]);
      })
      .catch((error) => {
        console.log("Connection error", error);
      });
  };
  const testPeripheral = (peripheral: Peripheral) => {
    if (peripheral) {
      console.log("peripheral");
      console.log(peripheral);
      BleManager.isPeripheralConnected(peripheral.id, []).then(
        (isConnected) => {
          if (isConnected) {
            console.log("Peripheral is connected!");
            setIsConnected(true);
          } else {
            console.log("Peripheral is NOT connected!");
            setIsConnected(false);
          }
        }
      );
      if (isConnected) {
        BleManager.disconnect(peripheral.id);
      } else {
        connectPeriphery(peripheral.id);
      }
    }
  };

  useEffect(() => {
    console.log("7");

    BleManager.start({ showAlert: false });

    bleManagerEmitter.addListener(
      "BleManagerDiscoverPeripheral",
      handleDiscoverPeripheral
    );
    bleManagerEmitter.addListener("BleManagerStopScan", handleStopScan);
    bleManagerEmitter.addListener(
      "BleManagerDisconnectPeripheral",
      handleDisconnectedPeripheral
    );
    bleManagerEmitter.addListener(
      "BleManagerDidUpdateValueForCharacteristic",
      handleUpdateValueForCharacteristic
    );

    if (Platform.OS === "android" && Platform.Version >= 23) {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      ).then((result) => {
        if (result) {
          console.log("8");

          console.log("Permission is OK");
        } else {
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          ).then((result) => {
            if (result) {
              console.log("User accept");
            } else {
              console.log("User refuse");
            }
          });
        }
      });
    }

    return () => {
      console.log("unmount");
      bleManagerEmitter.removeListener(
        "BleManagerDiscoverPeripheral",
        handleDiscoverPeripheral
      );
      bleManagerEmitter.removeListener("BleManagerStopScan", handleStopScan);
      bleManagerEmitter.removeListener(
        "BleManagerDisconnectPeripheral",
        handleDisconnectedPeripheral
      );
      bleManagerEmitter.removeListener(
        "BleManagerDidUpdateValueForCharacteristic",
        handleUpdateValueForCharacteristic
      );
    };
  }, []);

  const renderItem = (item: Peripheral) => {
    // var color;
    // BleManager.isPeripheralConnected(item.id, []).then((isConnected) => {
    //   if (isConnected) {
    //     color = "green";
    //   } else {
    //     color = "gray";
    //   }
    // });

    return (
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={() => {
          testPeripheral(item);
        }}
      >
        {open && (
          <Modal animationType="slide" transparent={true} visible={open}>
            <SafeAreaView style={styles.container}>
              <Card
                style={{
                  width: "100%",
                  height: 200,
                  borderRadius: 30,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "black", padding: 5 }}>
                  You connected to {peripheralStore} before!
                </Text>
                <Text style={{ paddingBottom: 10 }}>
                  Do you want to connect again?
                </Text>

                <TouchableOpacity
                  style={{
                    width: "70%",
                    backgroundColor: "skyblue",
                    height: "20%",
                    borderRadius: 20,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={() => {
                    connectPeriphery(peripheralStore);
                  }}
                >
                  <Text>Connect</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    width: "70%",
                    backgroundColor: "tomato",
                    height: "20%",
                    borderRadius: 20,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={() => {
                    setOpen(false);
                  }}
                >
                  <Text>cancel</Text>
                </TouchableOpacity>
              </Card>
            </SafeAreaView>
          </Modal>
        )}
        <Card
          style={{
            flex: 1,
            flexDirection: "row",
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            width: "99%",
          }}
        >
          <FontAwesome
            style={{ flex: 3 }}
            name="bluetooth"
            size={60}
            color="skyblue"
          />

          <View style={{ flex: 5 }}>
            <Text
              style={{
                fontSize: 20,
                textAlign: "center",
                color: "#333333",
                padding: 10,
              }}
            >
              {item.name}
            </Text>
            <Text
              style={{
                fontSize: 15,
                textAlign: "center",
                color: "#333333",
                padding: 2,
              }}
            >
              RSSI: {item.rssi}
            </Text>
            <Text
              style={{
                fontSize: 13,
                textAlign: "center",
                color: "#333333",
                padding: 2,
                paddingBottom: 20,
              }}
            >
              {item.id}
            </Text>
          </View>
          <View style={{ flex: 3 }}>
            {item.rssi > -67 ? (
              <MaterialCommunityIcons
                name="signal-cellular-3"
                size={24}
                color="skyblue"
              />
            ) : item.rssi < -68 && item.rssi >= -70 ? (
              <MaterialCommunityIcons
                name="signal-cellular-2"
                size={24}
                color="skyblue"
              />
            ) : item.rssi < -71 && item.rssi >= -80 ? (
              <MaterialCommunityIcons
                name="signal-cellular-1"
                size={24}
                color="skyblue"
              />
            ) : (
              <MaterialCommunityIcons
                name="signal-cellular-outline"
                size={24}
                color="skyblue"
              />
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colorBg }]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView
        style={{
          flex: 9,
          width: "90%",
          alignItems: "center",
          backgroundColor: colorBg,
        }}
      >
        {list.length == 0 ? (
          <View style={{ flex: 9, margin: 20 }}>
            <NoDeviceAvailable />
          </View>
        ) : (
          <>
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 20, color: "black" }}>
                Devices available{" "}
              </Text>
              <Text>choose a device to connect</Text>
            </View>

            <FlatList
              style={{ width: "100%" }}
              data={list}
              renderItem={({ item }) => renderItem(item)}
              keyExtractor={(item) => item.id}
            />
          </>
        )}
      </SafeAreaView>

      <TouchableOpacity
        style={{
          flex: 1,
          width: "90%",
          height: "10%",
          backgroundColor: isScanning ? "gray" : "skyblue",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 20,
        }}
        onPress={() => startScan()}
      >
        <Text style={{ color: "white" }}>
          Scan Bluetooth ({isScanning ? "on" : "off"})
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: "absolute",
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "400",
    color: Colors.dark,
  },
  highlight: {
    fontWeight: "700",
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: "600",
    padding: 4,
    paddingRight: 12,
    textAlign: "right",
  },
});

export default NewTest;
