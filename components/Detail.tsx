import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  NativeModules,
  NativeEventEmitter,
} from "react-native";
import { useSelector } from "react-redux";
import BleManager, { disconnect } from "react-native-ble-manager";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useHistory } from "react-router-native";
import styles from "../styles";

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
export default function Detail() {
  const history = useHistory();
  const deviceConnected = useSelector((state: any) => state.DeviceConnected);
  const [characteristicW, setCharacteristicW] = useState<string>("");
  const [characteristicN, setCharacteristicN] = useState<string>("");

  const [service, setServices] = useState<string>("");
  const handleUpdateValueForCharacteristic = (data: any) => {
    console.log(
      "Received data from " +
        data.peripheral +
        " characteristic " +
        data.characteristic,
      data.value
    );
  };

  useEffect(() => {
    BleManager.retrieveServices(deviceConnected).then((peripheralData: any) => {
      console.log("Retrieved peripheral services", peripheralData);

      setServices(peripheralData.advertising.serviceUUIDs[0]);
      console.log(service);

      setCharacteristicW(peripheralData.characteristics[4].characteristic);
      console.log(peripheralData.characteristics[4].characteristic);

      setCharacteristicN(peripheralData.characteristics[3].characteristic);
      console.log(peripheralData.characteristics[3].characteristic);

      BleManager.readRSSI(deviceConnected).then((rssi) => {
        console.log("Retrieved actual RSSI value", rssi);
      });
    });
    bleManagerEmitter.addListener(
      "BleManagerDidUpdateValueForCharacteristic",
      handleUpdateValueForCharacteristic
    );
    return () => {
      console.log("unmount");
      bleManagerEmitter.removeListener(
        "BleManagerDidUpdateValueForCharacteristic",
        handleUpdateValueForCharacteristic
      );
    };
  }, []);
  const stringToBytes = (str: string): Array<number> => {
    var url = str;
    var data = [];
    for (var i = 0; i < url.length; i++) {
      data.push(url.charCodeAt(i));
    }
    return data;
  };

  const control = (str: string) => {
    BleManager.startNotification(deviceConnected, service, characteristicN)
      .then(() => {
        // console.log("Started notification on " + deviceConnected);
        var data = stringToBytes(str);

        BleManager.write(deviceConnected, service, characteristicW, data).then(
          () => {
            console.log("controlled led");
          }
        );
      })
      .catch((error) => {
        console.log("Notification error", error);
      });
  };
  const disconnect = () => {
    BleManager.disconnect(deviceConnected)
      .then(async () => {
        // Success code
        console.log("Disconnected");
        try {
          await AsyncStorage.setItem("peripheralId", "");
        } catch (error) {
          // Error saving data
        }
        history.push("/");
      })
      .catch((error) => {
        // Failure code
        console.log(error);
      });
  };

  return (
    <View style={styles.container}>
      <Text>{deviceConnected}</Text>
      <TouchableOpacity
        onPress={() => {
          control("AT+LEDON");
        }}
      >
        <Text>Turn on</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          control("AT+LEDOFF");
        }}
      >
        <Text>Turn off</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          disconnect();
        }}
      >
        <Text>disconnectDevice</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          history.push("/Camera__");
        }}
      >
        <Text>camera</Text>
      </TouchableOpacity>
    </View>
  );
}
