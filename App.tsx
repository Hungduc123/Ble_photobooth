import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Provider } from "react-redux";
import { NativeRouter, Route, Switch } from "react-router-native";

import Test from "./components/Test";
import Store from "./Store";

export default function App() {
  return (
    <Provider store={Store}>
      <NativeRouter>
        <Switch>
          <Route exact path="/" component={Test} />
        </Switch>
      </NativeRouter>
    </Provider>
    // <Test></Test>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
