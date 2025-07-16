import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { notification } from "../../../helpers/middleware";
import { printerMQTT } from "../../../utils/apiEndPoint";

const initialState = {
  // connect
  printerLoading: false,
  activePrinterList: [],
  isPrinterUpdate: false,
};

// Connect
export const printerAction = createAsyncThunk(
  "printer/connect-printer",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(printerMQTT, payload)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "Successfully connected",
              "success"
            );
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

export const printerSlice = createSlice({
  name: "printer",
  initialState,
  reducers: {
    setIsConnectUpdate: (state, action) => {
      state.isPrinterUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(printerAction.pending, (state) => {
        state.printerLoading = true;
        state.isPrinterUpdate = false;
      })
      .addCase(printerAction.rejected, (state) => {
        state.printerLoading = false;
        state.isPrinterUpdate = false;
      })
      .addCase(printerAction.fulfilled, (state, action) => {
        state.printerLoading = false;
        state.isPrinterUpdate = true;
        state.activePrinterList = action.payload;
      });
  },
});

export const { setIsConnectUpdate } = printerSlice.actions;

export default printerSlice.reducer;
