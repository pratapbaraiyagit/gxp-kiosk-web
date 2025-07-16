import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { notification } from "../../../helpers/middleware";
import { keyDispenserMQTT } from "../../../utils/apiEndPoint";

const initialState = {
  // connect
  keyDispenserLoading: false,
  activeKeyDispenserList: [],
  isKeyDispenserUpdate: false,
};

// Connect
export const keyDispenserAction = createAsyncThunk(
  "keyDispenser/connect-key-dispenser",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(keyDispenserMQTT, payload)
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

export const keyDispenserSlice = createSlice({
  name: "keyDispenser",
  initialState,
  reducers: {
    setIsConnectUpdate: (state, action) => {
      state.isKeyDispenserUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(keyDispenserAction.pending, (state) => {
        state.keyDispenserLoading = true;
        state.isKeyDispenserUpdate = false;
      })
      .addCase(keyDispenserAction.rejected, (state) => {
        state.keyDispenserLoading = false;
        state.isKeyDispenserUpdate = false;
      })
      .addCase(keyDispenserAction.fulfilled, (state, action) => {
        state.keyDispenserLoading = false;
        state.isKeyDispenserUpdate = true;
        state.activeKeyDispenserList = action.payload;
      });
  },
});

export const { setIsConnectUpdate } = keyDispenserSlice.actions;

export default keyDispenserSlice.reducer;
