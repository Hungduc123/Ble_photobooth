import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import styles from "../styles";

export default function NoDeviceAvailable() {
  return (
    <View style={styles.container}>
      <Text>No device available</Text>
      <TouchableOpacity>
        <Text>Scan again!!!</Text>
      </TouchableOpacity>
    </View>
  );
}
