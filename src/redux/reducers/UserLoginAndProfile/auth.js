import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { notification } from "../../../helpers/middleware.js";
import {
  authFingerPrint,
  authFingerPrintReset,
  authKioskLogin,
  authRefreshToken,
} from "../../../utils/apiEndPoint";
import { getSessionItem, setSessionItem } from "../../../hooks/session";
import {
  getKioskDeviceDetails,
  getKioskDeviceListData,
} from "../Kiosk/KioskDevice.js";
import { getKioskDeviceConfigListData } from "../Kiosk/KioskDeviceConfig.js";
import { initializeMQTT } from "../MQTT/mqttSlice.js";
import customAxios from "../../../utils/common.js";

const initialState = {
  loginLoading: false,
  isLoader: true,
  profileData: null,
  isLoginStatus: false,
  lastTokenRefresh: null, // Track when token was last refreshed
  getFingerPrintDetails: {},
};

export const loginAction = createAsyncThunk(
  "auth/login",
  (dataProp, { dispatch }) => {
    return new Promise((resolve, reject) => {
      const data = btoa(JSON.stringify(dataProp));
      axios
        .post(authKioskLogin, { data: data })
        .then((res) => {
          if (res.data.status) {
            axios.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${res.data.data.access_token}`;
            setSessionItem("splash", true);
            setSessionItem("TokenKiosk", btoa(res.data.data.access_token));
            setSessionItem("RefreshKiosk", btoa(res.data.data.refresh_token));
            setSessionItem(
              "UserSessionKiosk",
              btoa(
                unescape(encodeURIComponent(JSON.stringify(res.data.data.user)))
              )
            );
            setSessionItem(
              "hotelKiosk",
              btoa(unescape(encodeURIComponent(JSON.stringify(res.data.data))))
            );

            dispatch(getKioskDeviceListData())
              .unwrap()
              .then((listData) => {
                if (listData?.data && listData?.data?.length > 0) {
                  dispatch(getKioskDeviceDetails(listData?.data?.[0]?.id));
                  dispatch(
                    getKioskDeviceConfigListData({
                      params: { device_id: listData?.data?.[0]?.id },
                    })
                  ).then((configData) => {
                    dispatch(initializeMQTT(configData?.payload?.data?.[0]));
                  });
                }
              })
              .catch((error) => {
                // console.error("Failed to fetch kiosk device list:", error);
              });
            resolve(res.data);
          } else {
            reject();
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
);

export const refreshToken = createAsyncThunk(
  "auth/refresh-token",
  (dataProp, { dispatch }) => {
    return new Promise((resolve, reject) => {
      const data = btoa(JSON.stringify(dataProp));

      // Get the refresh token from session storage
      const refreshTokenValue = getSessionItem("RefreshKiosk");

      // Create headers object with refresh token
      const headers = {
        "Content-Type": "application/json",
      };

      // Add refresh token as Authorization header if it exists
      if (refreshTokenValue) {
        headers["Authorization"] = `Bearer ${atob(refreshTokenValue)}`;
      }

      axios
        .post(authRefreshToken, { data: data }, { headers })
        .then((res) => {
          if (res.data.status) {
            axios.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${res.data.data.access_token}`;
            // setSessionItem("splash", true);
            setSessionItem("TokenKiosk", btoa(res.data.data.access_token));
            setSessionItem("RefreshKiosk", btoa(res.data.data.refresh_token));
            setSessionItem(
              "UserSessionKiosk",
              btoa(
                unescape(encodeURIComponent(JSON.stringify(res.data.data.user)))
              )
            );
            setSessionItem(
              "hotelKiosk",
              btoa(unescape(encodeURIComponent(JSON.stringify(res.data.data))))
            );

            resolve(res.data);
          } else {
            reject(new Error(res?.data?.message || "Token refresh failed"));
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
);

export const authFingerPrintnAction = createAsyncThunk(
  "auth/authFingerPrint",
  (dataProp, { dispatch }) => {
    return new Promise((resolve, reject) => {
      const data = btoa(JSON.stringify(dataProp));
      customAxios
        .post(authFingerPrint, { data: data })
        .then((res) => {
          if (res.data.status) {
            resolve(res?.data?.data);
          } else {
            // notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          // notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const authFingerPrintResetAction = createAsyncThunk(
  "auth/authFingerPrintReset",
  (dataProp, { dispatch }) => {
    return new Promise((resolve, reject) => {
      const data = btoa(JSON.stringify(dataProp));
      customAxios
        .post(authFingerPrintReset, { data: data })
        .then((res) => {
          if (res.data.status) {
            resolve(res?.data?.data);
          } else {
            // notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          // notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoginLoading: (state, action) => {
      state.loginLoading = action.payload;
    },
    setIsLoader: (state, action) => {
      state.isLoader = action.payload;
    },
    setIsLoginStatus: (state, action) => {
      state.isLoginStatus = action.payload;
    },
    setLastTokenRefresh: (state, action) => {
      state.lastTokenRefresh = action.payload;
    },
    logout: (state) => {
      state.loginLoading = false;
      state.isLoader = true;
      state.profileData = null;
      state.isLoginStatus = false;
      state.lastTokenRefresh = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAction.pending, (state) => {
        state.loginLoading = true;
        state.isLoginStatus = false;
      })
      .addCase(loginAction.rejected, (state) => {
        state.loginLoading = false;
        state.isLoginStatus = false;
      })
      .addCase(loginAction.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.isLoginStatus = true;
        state.lastTokenRefresh = Date.now();
      })
      .addCase(refreshToken.pending, (state) => {
        // Don't show loading for auto-refresh
        if (state.isLoginStatus) {
          state.loginLoading = false;
        } else {
          state.loginLoading = true;
        }
      })
      .addCase(refreshToken.rejected, (state) => {
        state.loginLoading = false;
        // On refresh failure, maintain login status temporarily
        // The interceptor will handle logout if needed
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.isLoginStatus = true;
        state.lastTokenRefresh = Date.now();
      })
      .addCase(authFingerPrintnAction.pending, (state) => {
        state.loginLoading = true;
        state.getFingerPrintDetails = "";
      })
      .addCase(authFingerPrintnAction.rejected, (state) => {
        state.loginLoading = false;
        state.getFingerPrintDetails = "";
      })
      .addCase(authFingerPrintnAction.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.getFingerPrintDetails = action.payload;
      })
      .addCase(authFingerPrintResetAction.pending, (state) => {
        state.loginLoading = true;
      })
      .addCase(authFingerPrintResetAction.rejected, (state) => {
        state.loginLoading = false;
      })
      .addCase(authFingerPrintResetAction.fulfilled, (state, action) => {
        state.loginLoading = false;
      });
  },
});

export const {
  setLoginLoading,
  setIsLoader,
  setIsLoginStatus,
  setLastTokenRefresh,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
