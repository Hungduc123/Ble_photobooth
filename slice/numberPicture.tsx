import { createSlice } from "@reduxjs/toolkit";

// var data:dataItem
const data: number = 5;
const slice = createSlice({
  name: "changeNumber",
  initialState: data,

  reducers: {
    changeNumber: (state, action) => {
      state = action.payload - 1;
      return state;
    },
  },
});
const { reducer, actions } = slice;
export const { changeNumber } = actions;
export default reducer;
