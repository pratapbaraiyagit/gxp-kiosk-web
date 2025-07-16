import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { notification } from "../../../helpers/middleware";
import { kioskCallMQTT } from "../../../utils/apiEndPoint";

const initialState = {
  // connect
  callMQTTLoading: false,
  activeCallMQTTList: [],
  isCallMQTTUpdate: false,
};

// Connect
export const callMQTTAction = createAsyncThunk(
  "callMQTT/connect-callMQTT",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(kioskCallMQTT, payload)
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

export const callMQTTSlice = createSlice({
  name: "callMQTT",
  initialState,
  reducers: {
    setIsCallMQTTUpdate: (state, action) => {
      state.isCallMQTTUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(callMQTTAction.pending, (state) => {
        state.callMQTTLoading = true;
        state.isCallMQTTUpdate = false;
      })
      .addCase(callMQTTAction.rejected, (state) => {
        state.callMQTTLoading = false;
        state.isCallMQTTUpdate = false;
      })
      .addCase(callMQTTAction.fulfilled, (state, action) => {
        state.callMQTTLoading = false;
        state.isCallMQTTUpdate = true;
        state.activeCallMQTTList = action.payload;
      });
  },
});

export const { setIsCallMQTTUpdate } = callMQTTSlice.actions;

export default callMQTTSlice.reducer;
