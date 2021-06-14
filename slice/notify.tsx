import { createSlice } from "@reduxjs/toolkit";

// var data:dataItem
const data: string | null = "aaaa";
const slice = createSlice({
  name: "notify",
  initialState: data,

  reducers: {
    notifyRedux: (state, action) => {
      state = action.payload;
      return state;
    },
  },
});
const { reducer, actions } = slice;
export const { notifyRedux } = actions;
export default reducer;
