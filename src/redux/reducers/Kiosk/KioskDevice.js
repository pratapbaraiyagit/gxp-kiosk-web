import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { kioskDeviceAPI } from "../../../utils/apiEndPoint";
import { notification } from "../../../helpers/middleware";
import { setSessionItem } from "../../../hooks/session";

const setLocalStorageItem = (key, value) => {
  localStorage.setItem(key, value);
};

const initialState = {
  kioskDeviceLoading: false,
  activeKioskDeviceList: [],
  getKioskDeviceDetailsData: {},
  isKioskDeviceUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const getKioskDeviceListData = createAsyncThunk(
  "admin/get-kioskDevice-list-sdf",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(kioskDeviceAPI, params)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data);

            setSessionItem(
              "KioskDeviceInfo",
              btoa(unescape(encodeURIComponent(JSON.stringify(res.data.data))))
            );
          } else {
            notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const addNewKioskDevice = createAsyncThunk(
  "admin/add-new-KioskDevice",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(kioskDeviceAPI, payload)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "KioskDevice create successfully!!",
              "success"
            );
            resolve(res.data.data);
          } else {
            notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const getKioskDeviceDetails = createAsyncThunk(
  "admin/get-KioskDevice-details",
  (id, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${kioskDeviceAPI}?id=${id}`)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data.data);
            // setLocalStorageItem(
            //   "kioskDeviceDetails",
            //   btoa(unescape(encodeURIComponent(JSON.stringify(res.data.data))))
            // );
          } else {
            notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const updateKioskDeviceDetails = createAsyncThunk(
  "admin/update-KioskDevice-details",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .patch(kioskDeviceAPI, payload)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "KioskDevice update successfully!!",
              "success"
            );
            resolve({
              kiosk_device_ids: payload.kiosk_device_ids[0],
              ...payload,
            });
          } else {
            notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const deleteKioskDevice = createAsyncThunk(
  "admin/KioskDevice-delete",
  (props, { dispatch }) => {
    const { id } = props;
    return new Promise((resolve, reject) => {
      axios
        .delete(`${kioskDeviceAPI}`, {
          data: {
            kiosk_device_ids: id,
          },
        })
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "KioskDevice delete successfully!!",
              "success"
            );
            resolve(id);
          } else {
            notification(res.data.message || "error", "error");
            reject();
          }
        })
        .catch((error) => {
          notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const kioskDeviceSlice = createSlice({
  name: "kioskDevice",
  initialState,
  reducers: {
    setIsKioskDeviceUpdate: (state, action) => {
      state.isKioskDeviceUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getKioskDeviceListData.pending, (state) => {
        state.kioskDeviceLoading = true;
      })
      .addCase(getKioskDeviceListData.rejected, (state) => {
        state.kioskDeviceLoading = false;
      })
      .addCase(getKioskDeviceListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
          action.payload;
        state.activeKioskDeviceList = data;
        state.kioskDeviceLoading = false;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
      })
      .addCase(addNewKioskDevice.pending, (state) => {
        state.kioskDeviceLoading = true;
        state.isKioskDeviceUpdate = false;
      })
      .addCase(addNewKioskDevice.rejected, (state) => {
        state.kioskDeviceLoading = false;
        state.isKioskDeviceUpdate = false;
      })
      .addCase(addNewKioskDevice.fulfilled, (state, action) => {
        state.kioskDeviceLoading = false;
        state.isKioskDeviceUpdate = true;
      })
      .addCase(getKioskDeviceDetails.pending, (state) => {
        state.kioskDeviceLoading = true;
        state.getKioskDeviceDetailsData = "";
      })
      .addCase(getKioskDeviceDetails.rejected, (state) => {
        state.kioskDeviceLoading = false;
        state.getKioskDeviceDetailsData = "";
      })
      .addCase(getKioskDeviceDetails.fulfilled, (state, action) => {
        state.kioskDeviceLoading = false;
        state.getKioskDeviceDetailsData = action.payload;
      })
      .addCase(updateKioskDeviceDetails.pending, (state) => {
        state.isKioskDeviceUpdate = false;
        state.kioskDeviceLoading = true;
      })
      .addCase(updateKioskDeviceDetails.rejected, (state) => {
        state.isKioskDeviceUpdate = false;
        state.kioskDeviceLoading = false;
      })
      .addCase(updateKioskDeviceDetails.fulfilled, (state, action) => {
        state.isKioskDeviceUpdate = true;
        state.kioskDeviceLoading = false;
      })
      .addCase(deleteKioskDevice.pending, (state) => {
        state.kioskDeviceLoading = true;
        state.isKioskDeviceUpdate = false;
      })
      .addCase(deleteKioskDevice.rejected, (state) => {
        state.kioskDeviceLoading = false;
        state.isKioskDeviceUpdate = false;
      })
      .addCase(deleteKioskDevice.fulfilled, (state, action) => {
        state.kioskDeviceLoading = false;
        state.isKioskDeviceUpdate = true;
      });
  },
});

export const { setIsKioskDeviceUpdate } = kioskDeviceSlice.actions;

export default kioskDeviceSlice.reducer;
