import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { notification } from "../../../helpers/middleware";
import { kioskAgentMQTT } from "../../../utils/apiEndPoint";

const initialState = {
  kioskAgentMQTTLoading: false,
  activeKioskAgentMQTTList: [],
  isKioskAgentMQTTUpdate: false,
};

export const kioskAgentMQTTAction = createAsyncThunk(
  "kioskAgentMQTT/connect-kioskAgentMQTT",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(kioskAgentMQTT, payload)
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

export const kioskAgentMQTTSlice = createSlice({
  name: "kioskAgentMQTT",
  initialState,
  reducers: {
    setIsKioskAgentMQTTUpdate: (state, action) => {
      state.isKioskAgentMQTTUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(kioskAgentMQTTAction.pending, (state) => {
        state.kioskAgentMQTTLoading = true;
        state.isKioskAgentMQTTUpdate = false;
      })
      .addCase(kioskAgentMQTTAction.rejected, (state) => {
        state.kioskAgentMQTTLoading = false;
        state.isKioskAgentMQTTUpdate = false;
      })
      .addCase(kioskAgentMQTTAction.fulfilled, (state, action) => {
        state.kioskAgentMQTTLoading = false;
        state.isKioskAgentMQTTUpdate = true;
        state.activeKioskAgentMQTTList = action.payload;
      });
  },
});

export const { setIsKioskAgentMQTTUpdate } = kioskAgentMQTTSlice.actions;

export default kioskAgentMQTTSlice.reducer;
