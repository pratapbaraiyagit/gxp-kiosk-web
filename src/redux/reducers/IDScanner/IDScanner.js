import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { notification } from "../../../helpers/middleware";
import { idScannerMQTT } from "../../../utils/apiEndPoint";

const initialState = {
  // connect
  connectLoading: false,
  activeConnectList: [],
  isConnectUpdate: false,

  // disconnect
  disconnectLoading: false,
  disconnectList: [],
  isDisconnectUpdate: false,

  // get status
  statusLoading: false,
  statusList: [],
  isStatusUpdate: false,

  // auto capture
  autoCaptureLoading: false,
  autoCaptureList: [],
  isAutoCaptureUpdate: false,

  // calibrate
  calibrateLoading: false,
  calibrateList: [],
  isCalibrateUpdate: false,
};

export const addConnect = createAsyncThunk(
  "idScanner/connect",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(idScannerMQTT, payload)
        .then((res) => {
          if (res.data.status) {
            // mergePublishTopic(res.data.data, "idScanner");
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

// Disconnect
export const disconnectDevice = createAsyncThunk(
  "idScanner/disconnect",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(`${idScannerMQTT}/disconnect`, payload)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data.data);
          } else {
            notification(res?.data?.message || "Disconnection failed", "error");
            reject();
          }
        })
        .catch((error) => {
          notification(
            error?.response?.data?.message || "Disconnection error",
            "error"
          );
          reject(error);
        });
    });
  }
);

// Get Status
export const getDeviceStatus = createAsyncThunk(
  "idScanner/status",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${idScannerMQTT}/status`, { params: payload })
        .then((res) => {
          if (res.data.status) {
            resolve(res.data.data);
          } else {
            notification(res?.data?.message || "Failed to get status", "error");
            reject();
          }
        })
        .catch((error) => {
          notification(
            error?.response?.data?.message || "Status error",
            "error"
          );
          reject(error);
        });
    });
  }
);

// Auto Capture On/Off
export const toggleAutoCapture = createAsyncThunk(
  "idScanner/autoCapture",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(`${idScannerMQTT}/autoCapture`, payload)
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message ||
            //     `Auto capture turned ${
            //       payload.enabled ? "on" : "off"
            //     } successfully`,
            //   "success"
            // );
            resolve(res.data.data);
          } else {
            notification(
              res?.data?.message || "Auto capture toggle failed",
              "error"
            );
            reject();
          }
        })
        .catch((error) => {
          notification(
            error?.response?.data?.message || "Auto capture error",
            "error"
          );
          reject(error);
        });
    });
  }
);

// Capture Calibrate
export const captureCalibrate = createAsyncThunk(
  "idScanner/calibrate",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(`${idScannerMQTT}/calibrate`, payload)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data.data);
          } else {
            notification(res?.data?.message || "Calibration failed", "error");
            reject();
          }
        })
        .catch((error) => {
          notification(
            error?.response?.data?.message || "Calibration error",
            "error"
          );
          reject(error);
        });
    });
  }
);

export const idScannerSlice = createSlice({
  name: "idScanner",
  initialState,
  reducers: {
    setIsConnectUpdate: (state, action) => {
      state.isConnectUpdate = action.payload;
    },
    setIsDisconnectUpdate: (state, action) => {
      state.isDisconnectUpdate = action.payload;
    },
    setIsStatusUpdate: (state, action) => {
      state.isStatusUpdate = action.payload;
    },
    setIsAutoCaptureUpdate: (state, action) => {
      state.isAutoCaptureUpdate = action.payload;
    },
    setIsCalibrateUpdate: (state, action) => {
      state.isCalibrateUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Connect cases
      .addCase(addConnect.pending, (state) => {
        state.connectLoading = true;
        state.isConnectUpdate = false;
      })
      .addCase(addConnect.rejected, (state) => {
        state.connectLoading = false;
        state.isConnectUpdate = false;
      })
      .addCase(addConnect.fulfilled, (state, action) => {
        state.connectLoading = false;
        state.isConnectUpdate = true;
        state.activeConnectList = action.payload;
      })

      // Disconnect cases
      .addCase(disconnectDevice.pending, (state) => {
        state.disconnectLoading = true;
        state.isDisconnectUpdate = false;
      })
      .addCase(disconnectDevice.rejected, (state) => {
        state.disconnectLoading = false;
        state.isDisconnectUpdate = false;
      })
      .addCase(disconnectDevice.fulfilled, (state, action) => {
        state.disconnectLoading = false;
        state.isDisconnectUpdate = true;
        state.activeConnectList = [];
        state.disconnectList = action.payload;
      })

      // Get Status cases
      .addCase(getDeviceStatus.pending, (state) => {
        state.statusLoading = true;
        state.isStatusUpdate = false;
      })
      .addCase(getDeviceStatus.rejected, (state) => {
        state.statusLoading = false;
        state.isStatusUpdate = false;
      })
      .addCase(getDeviceStatus.fulfilled, (state, action) => {
        state.statusLoading = false;
        state.isStatusUpdate = true;
        state.statusList = action.payload;
      })

      // Auto Capture cases
      .addCase(toggleAutoCapture.pending, (state) => {
        state.autoCaptureLoading = true;
        state.isAutoCaptureUpdate = false;
      })
      .addCase(toggleAutoCapture.rejected, (state) => {
        state.autoCaptureLoading = false;
        state.isAutoCaptureUpdate = false;
      })
      .addCase(toggleAutoCapture.fulfilled, (state, action) => {
        state.autoCaptureLoading = false;
        state.isAutoCaptureUpdate = true;
        state.autoCaptureList = action.payload;
      })

      // Calibrate cases
      .addCase(captureCalibrate.pending, (state) => {
        state.calibrateLoading = true;
        state.isCalibrateUpdate = false;
      })
      .addCase(captureCalibrate.rejected, (state) => {
        state.calibrateLoading = false;
        state.isCalibrateUpdate = false;
      })
      .addCase(captureCalibrate.fulfilled, (state, action) => {
        state.calibrateLoading = false;
        state.isCalibrateUpdate = true;
        state.calibrateList = action.payload;
      });
  },
});

export const {
  setIsConnectUpdate,
  setIsDisconnectUpdate,
  setIsStatusUpdate,
  setIsAutoCaptureUpdate,
  setIsCalibrateUpdate,
} = idScannerSlice.actions;

export default idScannerSlice.reducer;
