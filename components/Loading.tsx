import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import styles from "../styles";

export default function Loading() {
  return (
    <View style={styles.container}>
      <Text style={{ color: "white", fontSize: 32 }}>Decoding video...</Text>
      <ActivityIndicator size="large" color="skyblue" />
    </View>
  );
}
