import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { notification } from "../../../helpers/middleware";
import { serviceStatusMQTT } from "../../../utils/apiEndPoint";

const initialState = {
  // getServiceStatus
  serviceStatusLoading: false,
  activeServiceStatusList: [],
  isServiceStatusUpdate: false,

  // restartServiceStatus
  restartServiceStatusLoading: false,
  restartServiceStatusList: [],
  isRestartServiceStatusUpdate: false,
};

export const getServiceStatus = createAsyncThunk(
  "serviceStatus/get-service-status",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(serviceStatusMQTT, payload)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data.data);
          } else {
            notification(
              res?.data?.message || "service status failed",
              "error"
            );
            reject();
          }
        })
        .catch((error) => {
          notification(
            error?.response?.data?.message || "Service Status error",
            "error"
          );
          reject(error);
        });
    });
  }
);

export const restartServiceStatus = createAsyncThunk(
  "serviceStatus/restart-service-status",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(`${serviceStatusMQTT}`, payload)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data.data);
          } else {
            notification(res?.data?.message || "Restart failed", "error");
            reject();
          }
        })
        .catch((error) => {
          notification(
            error?.response?.data?.message || "Restart error",
            "error"
          );
          reject(error);
        });
    });
  }
);

export const serviceStatusSlice = createSlice({
  name: "serviceStatus",
  initialState,
  reducers: {
    setIsSericeStatusUpdate: (state, action) => {
      state.isServiceStatusUpdate = action.payload;
    },
    setIsRestartServiceStatusUpdate: (state, action) => {
      state.isRestartServiceStatusUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Connect cases
      .addCase(getServiceStatus.pending, (state) => {
        state.serviceStatusLoading = true;
        state.isServiceStatusUpdate = false;
      })
      .addCase(getServiceStatus.rejected, (state) => {
        state.serviceStatusLoading = false;
        state.isServiceStatusUpdate = false;
      })
      .addCase(getServiceStatus.fulfilled, (state, action) => {
        state.serviceStatusLoading = false;
        state.isServiceStatusUpdate = true;
        state.activeServiceStatusList = action.payload;
      })

      // Disconnect cases
      .addCase(restartServiceStatus.pending, (state) => {
        state.restartServiceStatusLoading = true;
        state.isRestartServiceStatusUpdate = false;
      })
      .addCase(restartServiceStatus.rejected, (state) => {
        state.restartServiceStatusLoading = false;
        state.isRestartServiceStatusUpdate = false;
      })
      .addCase(restartServiceStatus.fulfilled, (state, action) => {
        state.restartServiceStatusLoading = false;
        state.isRestartServiceStatusUpdate = true;
        state.restartServiceStatusList = action.payload;
      });
  },
});

export const { setIsSericeStatusUpdate, setIsRestartServiceStatusUpdate } =
  serviceStatusSlice.actions;

export default serviceStatusSlice.reducer;
