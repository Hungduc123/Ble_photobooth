import { createSlice } from "@reduxjs/toolkit";
import { Device } from "react-native-ble-plx";

// var data:dataItem
const data: Device[] = [];
const slice = createSlice({
  name: "addList",
  initialState: data,

  reducers: {
    addList: (state, action) => {
      if (!state.find((dev) => dev.id === action.payload.id)) {
        return [...state, action.payload];
      }
      return state;
    },
    CLEAR: (state) => {
      return [];
    },
  },
});
const { reducer, actions } = slice;
export const { addList, CLEAR } = actions;
export default reducer;
