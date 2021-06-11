import { createSlice } from "@reduxjs/toolkit";

const slice = createSlice({
  name: "deviceConnected",
  initialState: "",

  reducers: {
    deviceConnected: (state, action) => {
      state = action.payload;
      return state;
    },
  },
});
const { reducer, actions } = slice;
export const { deviceConnected } = actions;
export default reducer;

// import { createSlice } from "@reduxjs/toolkit";
// import { BleManager, Device } from "react-native-ble-plx";
// const manager = new BleManager();

// // var data:dataItem
// const data = new Device(
//   {
//     id: "",

//     name: null,

//     rssi: null,

//     mtu: 0,

//     manufacturerData: null,

//     serviceData: null,

//     serviceUUIDs: null,

//     localName: null,

//     txPowerLevel: null,

//     solicitedServiceUUIDs: null,

//     isConnectable: null,

//     overflowServiceUUIDs: null,
//   },
//   manager
// );
// const slice = createSlice({
//   name: "deviceConnected",
//   initialState: data,

//   reducers: {
//     deviceConnected: (state, action) => {
//       state = { ...action.payload };
//     },
//   },
// });
// const { reducer, actions } = slice;
// export const { deviceConnected } = actions;
// export default reducer;
