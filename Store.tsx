import { configureStore } from "@reduxjs/toolkit";
import addListReducer from "./slice/listDevice";
import deviceConnectedReducer from "./slice/deviceConnected";
const rootReducer = {
  AddList: addListReducer,
  DeviceConnected: deviceConnectedReducer,
};
const store = configureStore({
  reducer: rootReducer,
});
export default store;
