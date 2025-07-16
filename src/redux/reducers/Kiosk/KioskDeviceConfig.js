import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { kioskDeviceConfigAPI } from "../../../utils/apiEndPoint";
import { notification } from "../../../helpers/middleware";
import { setSessionItem } from "../../../hooks/session";

const initialState = {
  kioskDeviceConfigLoading: false,
  activeKioskDeviceConfigList: [],
  getKioskDeviceConfigDetailsData: {},
  isKioskDeviceConfigUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const getKioskDeviceConfigListData = createAsyncThunk(
  "admin/get-kioskDeviceConfig-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(kioskDeviceConfigAPI, params)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data);
            setSessionItem(
              "KioskConfig",
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

export const addNewKioskDeviceConfig = createAsyncThunk(
  "admin/add-new-KioskDeviceConfig",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(kioskDeviceConfigAPI, payload)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "KioskDeviceConfig create successfully!!",
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

export const getKioskDeviceConfigDetails = createAsyncThunk(
  "admin/get-KioskDeviceConfig-details",
  (id, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${kioskDeviceConfigAPI}?id=${id}`)
        .then((res) => {
          if (res.data.status) {
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

export const updateKioskDeviceConfigDetails = createAsyncThunk(
  "admin/update-KioskDeviceConfig-details",
  (props, { dispatch }) => {
    const { id, data } = props;
    return new Promise((resolve, reject) => {
      axios
        .patch(`${kioskDeviceConfigAPI}/${id}`, data)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "KioskDeviceConfig update successfully!!",
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

export const deleteKioskDeviceConfig = createAsyncThunk(
  "admin/KioskDeviceConfig-delete",
  (props, { dispatch }) => {
    const { id } = props;
    return new Promise((resolve, reject) => {
      axios
        .delete(`${kioskDeviceConfigAPI}`, {
          data: {
            kiosk_device_ids: id,
          },
        })
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "KioskDeviceConfig delete successfully!!",
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

export const kioskDeviceConfigSlice = createSlice({
  name: "kioskDeviceConfig",
  initialState,
  reducers: {
    setIsKioskDeviceConfigUpdate: (state, action) => {
      state.isKioskDeviceConfigUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getKioskDeviceConfigListData.pending, (state) => {
        state.kioskDeviceConfigLoading = true;
      })
      .addCase(getKioskDeviceConfigListData.rejected, (state) => {
        state.kioskDeviceConfigLoading = false;
      })
      .addCase(getKioskDeviceConfigListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
          action.payload;
        state.activeKioskDeviceConfigList = data;
        state.kioskDeviceConfigLoading = false;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
      })
      .addCase(addNewKioskDeviceConfig.pending, (state) => {
        state.kioskDeviceConfigLoading = true;
        state.isKioskDeviceConfigUpdate = false;
      })
      .addCase(addNewKioskDeviceConfig.rejected, (state) => {
        state.kioskDeviceConfigLoading = false;
        state.isKioskDeviceConfigUpdate = false;
      })
      .addCase(addNewKioskDeviceConfig.fulfilled, (state, action) => {
        state.kioskDeviceConfigLoading = false;
        state.isKioskDeviceConfigUpdate = true;
      })
      .addCase(getKioskDeviceConfigDetails.pending, (state) => {
        state.kioskDeviceConfigLoading = true;
        state.getKioskDeviceConfigDetailsData = "";
      })
      .addCase(getKioskDeviceConfigDetails.rejected, (state) => {
        state.kioskDeviceConfigLoading = false;
        state.getKioskDeviceConfigDetailsData = "";
      })
      .addCase(getKioskDeviceConfigDetails.fulfilled, (state, action) => {
        state.kioskDeviceConfigLoading = false;
        state.getKioskDeviceConfigDetailsData = action.payload;
      })
      .addCase(updateKioskDeviceConfigDetails.pending, (state) => {
        state.isKioskDeviceConfigUpdate = false;
        state.kioskDeviceConfigLoading = true;
      })
      .addCase(updateKioskDeviceConfigDetails.rejected, (state) => {
        state.isKioskDeviceConfigUpdate = false;
        state.kioskDeviceConfigLoading = false;
      })
      .addCase(updateKioskDeviceConfigDetails.fulfilled, (state, action) => {
        state.isKioskDeviceConfigUpdate = true;
        state.kioskDeviceConfigLoading = false;
      })
      .addCase(deleteKioskDeviceConfig.pending, (state) => {
        state.kioskDeviceConfigLoading = true;
        state.isKioskDeviceConfigUpdate = false;
      })
      .addCase(deleteKioskDeviceConfig.rejected, (state) => {
        state.kioskDeviceConfigLoading = false;
        state.isKioskDeviceConfigUpdate = false;
      })
      .addCase(deleteKioskDeviceConfig.fulfilled, (state, action) => {
        state.kioskDeviceConfigLoading = false;
        state.isKioskDeviceConfigUpdate = true;
      });
  },
});

export const { setIsKioskDeviceConfigUpdate } = kioskDeviceConfigSlice.actions;

export default kioskDeviceConfigSlice.reducer;
