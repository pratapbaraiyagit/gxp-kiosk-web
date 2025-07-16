import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { notification } from "../../../helpers/middleware";
import { agentUserMQTT } from "../../../utils/apiEndPoint";

const initialState = {
  agentUserMQTTLoading: false,
  activeAgentUserMQTTList: [],
  isAgentUserMQTTUpdate: false,
};

export const agentUserMQTTAction = createAsyncThunk(
  "agentUserMQTT/connect-agentUserMQTT",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(agentUserMQTT, payload)
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

export const agentUserMQTTSlice = createSlice({
  name: "agentUserMQTT",
  initialState,
  reducers: {
    setIsAgentUserMQTTUpdate: (state, action) => {
      state.isAgentUserMQTTUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(agentUserMQTTAction.pending, (state) => {
        state.agentUserMQTTLoading = true;
        state.isAgentUserMQTTUpdate = false;
      })
      .addCase(agentUserMQTTAction.rejected, (state) => {
        state.agentUserMQTTLoading = false;
        state.isAgentUserMQTTUpdate = false;
      })
      .addCase(agentUserMQTTAction.fulfilled, (state, action) => {
        state.agentUserMQTTLoading = false;
        state.isAgentUserMQTTUpdate = true;
        state.activeAgentUserMQTTList = action.payload;
      });
  },
});

export const { setIsAgentUserMQTTUpdate } = agentUserMQTTSlice.actions;

export default agentUserMQTTSlice.reducer;
