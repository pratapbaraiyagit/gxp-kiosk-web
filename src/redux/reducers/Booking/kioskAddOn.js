import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { notification } from "../../../helpers/middleware";
import { kioskAddOnAPI } from "../../../utils/apiEndPoint";

const initialState = {
  kioskAddOnLoading: false,
  activeKioskAddOnList: [],
  getKioskAddOnDetailsData: {},
  isKioskAddOnUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const getKioskAddOnListData = createAsyncThunk(
  "admin/get-KioskAddOn-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${kioskAddOnAPI}`, params)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data);
          } else {
            notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
);

export const addNewKioskAddOn = createAsyncThunk(
  "admin/add-new-KioskAddOn",
  (updateAddon, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(kioskAddOnAPI, updateAddon)
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Add On create successfully!!",
            //   "success"
            // );
            resolve(res.data.data);
          } else {
            notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
);

export const getKioskAddOnDetails = createAsyncThunk(
  "admin/get-KioskAddOn-details-KioskAddOn",
  (data, { dispatch }) => {
    const { id } = data;
    return new Promise((resolve, reject) => {
      axios
        .get(`${kioskAddOnAPI}?id=${id}`)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data.data);
          } else {
            notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
);

export const kioskAddOnSlice = createSlice({
  name: "KioskAddOn",
  initialState,
  reducers: {
    setIsKioskAddOnUpdate: (state, action) => {
      state.isKioskAddOnUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getKioskAddOnListData.pending, (state) => {
        state.kioskAddOnLoading = true;
      })
      .addCase(getKioskAddOnListData.rejected, (state) => {
        state.kioskAddOnLoading = false;
      })
      .addCase(getKioskAddOnListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
          action.payload;
        state.activeKioskAddOnList = data;
        state.kioskAddOnLoading = false;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
      })
      .addCase(addNewKioskAddOn.pending, (state) => {
        state.kioskAddOnLoading = true;
        state.isKioskAddOnUpdate = false;
      })
      .addCase(addNewKioskAddOn.rejected, (state) => {
        state.kioskAddOnLoading = false;
        state.isKioskAddOnUpdate = false;
      })
      .addCase(addNewKioskAddOn.fulfilled, (state, action) => {
        state.kioskAddOnLoading = false;
        state.isKioskAddOnUpdate = true;
      })
      .addCase(getKioskAddOnDetails.pending, (state) => {
        state.kioskAddOnLoading = true;
        state.getKioskAddOnDetailsData = "";
      })
      .addCase(getKioskAddOnDetails.rejected, (state) => {
        state.kioskAddOnLoading = false;
        state.getKioskAddOnDetailsData = "";
      })
      .addCase(getKioskAddOnDetails.fulfilled, (state, action) => {
        state.kioskAddOnLoading = false;
        state.getKioskAddOnDetailsData = action.payload;
      });
  },
});

export const { setIsKioskAddOnUpdate } = kioskAddOnSlice.actions;

export default kioskAddOnSlice.reducer;
