import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { notification } from "../../../helpers/middleware";
import { cashRecyclerMQTT } from "../../../utils/apiEndPoint";

const initialState = {
  // connect
  cashRecyclerLoading: false,
  activeCashRecyclerList: [],
  isCashRecyclerUpdate: false,
};

// Connect
export const cashRecyclerAction = createAsyncThunk(
  "cashRecycler/connect-cash-recycler",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(cashRecyclerMQTT, payload)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data.data);
          } else {
            notification(res?.data?.message || "Connection failed", "error");
            reject();
          }
        })
        .catch((error) => {
          notification(
            error?.response?.data?.message || "Connection error",
            "error"
          );
          reject(error);
        });
    });
  }
);

export const cashRecyclerSlice = createSlice({
  name: "cashRecycler",
  initialState,
  reducers: {
    setIsConnectUpdate: (state, action) => {
      state.isCashRecyclerUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(cashRecyclerAction.pending, (state) => {
        state.cashRecyclerLoading = true;
        state.isCashRecyclerUpdate = false;
      })
      .addCase(cashRecyclerAction.rejected, (state) => {
        state.cashRecyclerLoading = false;
        state.isCashRecyclerUpdate = false;
      })
      .addCase(cashRecyclerAction.fulfilled, (state, action) => {
        state.cashRecyclerLoading = false;
        state.isCashRecyclerUpdate = true;
        state.activeCashRecyclerList = action.payload;
      });
  },
});

export const { setIsConnectUpdate } = cashRecyclerSlice.actions;

export default cashRecyclerSlice.reducer;
