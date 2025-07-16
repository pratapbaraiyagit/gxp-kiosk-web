import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { hotelAddOnAPI } from "../../../utils/apiEndPoint";
// import { notification } from "../../../helpers/middleware";

const initialState = {
  appAddOnLoading: false,
  activeAddOnList: [],
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const getAddOnListData = createAsyncThunk(
  "admin/get-add-on-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(hotelAddOnAPI, params)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data);
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

export const hotelAddOnAPISlice = createSlice({
  name: "hotelAddOnAPI",
  initialState,
  reducers: {
    setIsAddOnUpdate: (state, action) => {
      state.isAddOnUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAddOnListData.pending, (state) => {
        state.appAddOnLoading = true;
      })
      .addCase(getAddOnListData.rejected, (state) => {
        state.appAddOnLoading = false;
      })
      .addCase(getAddOnListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
          action.payload;
        state.activeAddOnList = data;
        state.appAddOnLoading = false;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
      });
  },
});

export const { setIsAddOnUpdate } = hotelAddOnAPISlice.actions;

export default hotelAddOnAPISlice.reducer;
