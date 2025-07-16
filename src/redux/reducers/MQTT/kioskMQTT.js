import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { notification } from "../../../helpers/middleware";
import { kioskMQTT } from "../../../utils/apiEndPoint";

const initialState = {
  kioskMQTTLoading: false,
  activeKioskMQTTList: [],
  isKioskMQTTUpdate: false,
};

export const kioskMQTTAction = createAsyncThunk(
  "kioskMQTT/connect-kioskMQTT-d",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(kioskMQTT, payload)
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

export const kioskMQTTSlice = createSlice({
  name: "kioskMQTT",
  initialState,
  reducers: {
    setIsKioskMQTTUpdate: (state, action) => {
      state.isKioskMQTTUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(kioskMQTTAction.pending, (state) => {
        state.kioskMQTTLoading = true;
        state.isKioskMQTTUpdate = false;
      })
      .addCase(kioskMQTTAction.rejected, (state) => {
        state.kioskMQTTLoading = false;
        state.isKioskMQTTUpdate = false;
      })
      .addCase(kioskMQTTAction.fulfilled, (state, action) => {
        state.kioskMQTTLoading = false;
        state.isKioskMQTTUpdate = true;
        state.activeKioskMQTTList = action.payload;
      });
  },
});

export const { setIsKioskMQTTUpdate } = kioskMQTTSlice.actions;

export default kioskMQTTSlice.reducer;
