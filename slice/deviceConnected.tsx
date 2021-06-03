import { createSlice } from "@reduxjs/toolkit";
import { Device } from "react-native-ble-plx";

// var data:dataItem
const data: Device[] = [];
const slice = createSlice({
  name: "deviceConnected",
  initialState: data,

  reducers: {
    deviceConnected: (state, action) => {
      state.push(action.payload);
    },
  },
});
const { reducer, actions } = slice;
export const { deviceConnected } = actions;
export default reducer;
