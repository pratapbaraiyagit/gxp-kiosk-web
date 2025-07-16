import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { notification } from "../../../helpers/middleware";
import { keyEncoderMQTT } from "../../../utils/apiEndPoint";

const initialState = {
  // connect
  keyEncoderLoading: false,
  activeKeyEncoderList: [],
  isKeyEncoderUpdate: false,
};

// Connect
export const keyEncoderAction = createAsyncThunk(
  "keyEncoder/connect-key-encoder",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(keyEncoderMQTT, payload)
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

export const keyEncoderSlice = createSlice({
  name: "keyEncoder",
  initialState,
  reducers: {
    setIsConnectUpdate: (state, action) => {
      state.isKeyEncoderUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(keyEncoderAction.pending, (state) => {
        state.keyEncoderLoading = true;
        state.isKeyEncoderUpdate = false;
      })
      .addCase(keyEncoderAction.rejected, (state) => {
        state.keyEncoderLoading = false;
        state.isKeyEncoderUpdate = false;
      })
      .addCase(keyEncoderAction.fulfilled, (state, action) => {
        state.keyEncoderLoading = false;
        state.isKeyEncoderUpdate = true;
        state.activeKeyEncoderList = action.payload;
      });
  },
});

export const { setIsConnectUpdate } = keyEncoderSlice.actions;

export default keyEncoderSlice.reducer;
