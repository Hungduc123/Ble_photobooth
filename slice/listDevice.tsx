import { createSlice } from "@reduxjs/toolkit";

import { TypePeripheral } from "../data/peripheral";

// var data:dataItem
const data: TypePeripheral[] = [];
const slice = createSlice({
  name: "addList",
  initialState: data,

  reducers: {
    addList: (state, action) => {
      state = action.payload;
    },
  },
});
const { reducer, actions } = slice;
export const { addList } = actions;
export default reducer;
