import { configureStore } from "@reduxjs/toolkit";
import addListReducer from "./slice/listDevice";
import deviceConnectedReducer from "./slice/deviceConnected";
import changeNumberReducer from "./slice/numberPicture";
import notifyReducer from "./slice/notify";
const rootReducer = {
  AddList: addListReducer,
  DeviceConnected: deviceConnectedReducer,
  ChangeNumber: changeNumberReducer,
  Notify: notifyReducer,
};
const store = configureStore({
  reducer: rootReducer,
});
export default store;
