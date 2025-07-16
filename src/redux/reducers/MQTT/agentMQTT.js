import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { notification } from "../../../helpers/middleware";
import { agentMQTT } from "../../../utils/apiEndPoint";

const initialState = {
  // connect
  agentMQTTLoading: false,
  activeAgentMQTTList: [],
  isAgentMQTTUpdate: false,
};

// Connect
export const agentMQTTAction = createAsyncThunk(
  "agentMQTT/connect-agentMQTT-d",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(agentMQTT, payload)
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

export const agentMQTTSlice = createSlice({
  name: "agentMQTT",
  initialState,
  reducers: {
    setIsAgentMQTTUpdate: (state, action) => {
      state.isAgentMQTTUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(agentMQTTAction.pending, (state) => {
        state.agentMQTTLoading = true;
        state.isAgentMQTTUpdate = false;
      })
      .addCase(agentMQTTAction.rejected, (state) => {
        state.agentMQTTLoading = false;
        state.isAgentMQTTUpdate = false;
      })
      .addCase(agentMQTTAction.fulfilled, (state, action) => {
        state.agentMQTTLoading = false;
        state.isAgentMQTTUpdate = true;
        state.activeAgentMQTTList = action.payload;
      });
  },
});

export const { setIsAgentMQTTUpdate } = agentMQTTSlice.actions;

export default agentMQTTSlice.reducer;
