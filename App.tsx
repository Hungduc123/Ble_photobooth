import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Provider } from "react-redux";
import { NativeRouter, Route, Switch } from "react-router-native";
import Camera__ from "./components/Camera__";
// import Camera__ from "./components/Camera__";
import NewTest from "./components/NewTest";

import Store from "./Store";

export default function App() {
  return (
    <Provider store={Store}>
      <NativeRouter>
        <Switch>
          <Route exact path="/" component={NewTest} />

          <Route exact path="/Camera__" component={Camera__} />
        </Switch>
      </NativeRouter>
    </Provider>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
