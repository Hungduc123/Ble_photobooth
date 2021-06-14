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
import { useHistory } from "react-router-native";

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
  const [characteristics, setCharacteristics] = useState<Array<Characteristic>>(
    []
  );
  const [characteristicsW, setCharacteristicsW] = useState<string>("");
  const [characteristicsN, setCharacteristicsN] = useState<string>("");

  const [serviceUUID, setServiceUUID] = useState<string>("");
  const history = useHistory();

  const startScan = () => {
    console.log("Start scan");
    setIsLoading(true);
    dispatch({ type: "CLEAR" });

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.warn(error);
      }
      if (device && device.name === "TEST_BLE") {
        dispatch({ type: "ADD_DEVICE", payload: device });
        // console.log(device);
        // connectDevice(device);
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
    console.log(
      "before------------------------------------------------------------"
    );
    const is = await device.isConnected();
    console.log("isConnected +++++++++++++++" + is);

    console.log(device);
    device
      .connect()
      .then(async (device: Device) => {
        setIsConnected(true);
        console.log("Device connected");
        alert("Device connected!");
        console.log(
          "after------------------------------------------------------------"
        );

        const is = await device.isConnected();
        console.log(device);
        console.log("isConnected+++++++++++++++" + is);

        return device.discoverAllServicesAndCharacteristics();
      })
      .then(() => {
        getChr(device);
      })
      .catch((error) => {
        // Handle errors
      });

    setIsConnecting(false);
  };
  const getChr = async (device: Device) => {
    const serviceUUID = device.serviceUUIDs![0];
    const char: Characteristic[] = await device.characteristicsForService(
      serviceUUID
    );
    // char.forEach((characteristic) => {
    //   console.log(characteristic + "\n");
    // });
    for (let key in char) {
      console.log(
        "---------------------------------------------------------------------"
      );

      console.log(key + ":", char[key]);
    }
    setServiceUUID(serviceUUID);
    setCharacteristicsW(char[1].uuid);
    setCharacteristicsN(char[0].uuid);
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

  const turnOn = async (device: Device) => {
    // const characteristic: Characteristic =
    //   await device.writeCharacteristicWithResponseForService(
    //     serviceUUID,
    //     characteristicsW,
    //     "QVQrTEVET04="
    //   );
    manager.writeCharacteristicWithoutResponseForDevice(
      "C2:90:49:C5:97:0F",
      "00001523-1212-efde-1523-785feabcd123",
      "00001527-1212-efde-1523-785feabcd123",
      "QVQrTEVET04="
    );
  };
  const turnOff = async (device: Device) => {
    // const characteristic =
    //   await device.writeCharacteristicWithoutResponseForService(
    //     serviceUUID,
    //     characteristicsW,
    //     "QVQrTEVET0ZG"
    //   );
    manager.writeCharacteristicWithoutResponseForDevice(
      "C2:90:49:C5:97:0F",
      "00001523-1212-efde-1523-785feabcd123",
      "00001527-1212-efde-1523-785feabcd123",
      "QVQrTEVET0ZG"
    );
  };
  const setupNotifications = async (device: Device) => {
    // const characteristic =
    //   await device.writeCharacteristicWithResponseForService(
    //     serviceUUID,
    //     characteristicsW,
    //     "QVQrTEVET0ZG"
    //   );

    device.monitorCharacteristicForService(
      serviceUUID,
      characteristicsN,
      (error, characteristic) => {
        if (error) {
          // this.error(error.message)
          return;
        }

        // this.updateValue(characteristic.uuid, characteristic.value)

        console.log("characteristic!.value");

        console.log(characteristic!.value);
      }
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
                  <Button
                    disabled={isConnecting}
                    onPress={() => connectDevice(item)}
                  >
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
                  turnOff(item);
                }}
              >
                <Text>turn off</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  // turnOn(item);
                  // setupNotifications(item);
                  history.push("/Camera2");
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
