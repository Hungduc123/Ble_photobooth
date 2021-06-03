import React, { useEffect, useReducer, useState } from "react";
import {
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from "react-native";
import {
  BleManager,
  Characteristic,
  Device,
  Service,
} from "react-native-ble-plx";
import {
  Header,
  Left,
  Right,
  Body,
  View,
  Text,
  Button,
  CardItem,
  Card,
  Title,
} from "native-base";
import { addList } from "../slice/listDevice";
import { useDispatch } from "react-redux";

const manager = new BleManager();

const reducer = (
  state: Device[],
  action: { type: "ADD_DEVICE"; payload: Device } | { type: "CLEAR" }
): Device[] => {
  switch (action.type) {
    case "ADD_DEVICE":
      const { payload: device } = action;
      if (device && !state.find((dev) => dev.id === device.id)) {
        return [...state, device];
      }
      return state;
    case "CLEAR":
      return [];
    default:
      return state;
  }
};

export default function App() {
  const dispatch_ = useDispatch<any>();
  const [devicesArray, dispatch] = useReducer(reducer, []);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [isConnected, setIsConnected] = useState<boolean>(false);

  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const [services, setServices] = useState<Service[]>([]);

  const startScan = () => {
    console.log("Start scan");
    setIsLoading(true);
    dispatch({ type: "CLEAR" });

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.warn(error);
      }
      if (device) {
        dispatch({ type: "ADD_DEVICE", payload: device });
        // const action = addList(device);
        // dispatch_(action);
      }
    });

    setTimeout(() => {
      manager.stopDeviceScan();
      setIsLoading(false);
      console.log("Stop scan");
    }, 5000);
  };

  const connectDevice = async (device: Device) => {
    setIsConnecting(true);

    const connectedDevice = await manager.connectToDevice(device.id);

    setIsConnected(true);
    console.log("Device connected");
    alert("Device connected!");
    const allServicesAndCharacteristics =
      await connectedDevice.discoverAllServicesAndCharacteristics();

    const discoveredServices = await allServicesAndCharacteristics.services();
    setServices(discoveredServices);
    discoveredServices.forEach((value) => {
      console.log("   ", value.uuid);
    });
    setIsConnecting(false);
  };

  const disconnectDevice = async (device: Device) => {
    const isDeviceConnected = await device.isConnected();
    if (isDeviceConnected) {
      await device.cancelConnection();
    }
    setIsConnected(false);
    alert("Device disconnected!");
    console.log("Device disconnected");
  };

  // useEffect(() => {
  //   return () => {
  //     manager.destroy();
  //   };
  // }, []);
  const connect = (device: Device) => {
    device.connect().then((device) => {
      return device.discoverAllServicesAndCharacteristics();
    });
    // .then((device) => {
    //   return setupNotifications(device);
    // });
  };
  const turnon = async (device: Device) => {
    // const service =
    // const characteristicW = this.writeUUID(id)
    // const characteristicN = this.notifyUUID(id)

    const characteristic: Characteristic =
      await device.writeCharacteristicWithoutResponseForService(
        device.serviceUUIDs![0],
        "00001527-1212-efde-1523-785feabcd123",
        "QVQrTEVET04=" /* 0x01 in hex */
      );
  };
  const turnoff = async (device: Device) => {
    const characteristic =
      await device.writeCharacteristicWithoutResponseForService(
        device.serviceUUIDs![0],
        "00001527-1212-efde-1523-785feabcd123",
        "QVQrTEVET0ZG" /* 0x01 in hex */
      );
  };
  return (
    <View style={styles.container}>
      <Header>
        <Left>
          <Button transparent onPress={() => {}}>
            <Text>Back</Text>
          </Button>
        </Left>
        <Right>
          {isLoading ? (
            <ActivityIndicator color={"white"} size={25} />
          ) : (
            <Button transparent onPress={startScan}>
              <Text>Scan</Text>
            </Button>
          )}
        </Right>
      </Header>
      <FlatList
        keyExtractor={(item) => item.id}
        data={devicesArray}
        extraData={devicesArray}
        renderItem={(items) => {
          const item = items.item;
          return (
            <Card>
              <CardItem>
                <Text>ID: {item.id}</Text>
              </CardItem>
              <CardItem>
                {item.name !== null ? (
                  <Text>Name: {item.name}</Text>
                ) : (
                  <Text>Name: Unnamed</Text>
                )}
              </CardItem>
              {!isConnected ? (
                <CardItem style={styles.cardButton}>
                  <Button disabled={isConnecting} onPress={() => connect(item)}>
                    <Text>Connect</Text>
                  </Button>
                </CardItem>
              ) : (
                <CardItem style={styles.cardButton}>
                  <Button onPress={() => disconnectDevice(item)}>
                    <Text>Disconnect</Text>
                  </Button>
                </CardItem>
              )}
              <TouchableOpacity
                onPress={() => {
                  turnoff(item);
                }}
              >
                <Text>turn off</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  turnon(item);
                }}
              >
                <Text>turn on</Text>
              </TouchableOpacity>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardButton: {
    alignSelf: "center",
  },
});
