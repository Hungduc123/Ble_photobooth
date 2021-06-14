import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Provider } from "react-redux";
import { NativeRouter, Route, Switch } from "react-router-native";
import Camera2 from "./components/Camera2";
import Camera__ from "./components/Camera__";
// import Camera__ from "./components/Camera__";
import Detail from "./components/Detail";
import NewTest from "./components/NewTest";

import Test from "./components/Test";
import Store from "./Store";

export default function App() {
  return (
    <Provider store={Store}>
      <NativeRouter>
        <Switch>
          <Route exact path="/" component={NewTest} />
          <Route exact path="/Detail" component={Detail} />
          <Route exact path="/Camera__" component={Camera__} />
          <Route exact path="/Camera2" component={Camera2} />
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
