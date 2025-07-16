import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { notification } from "../../../helpers/middleware";
import { hotelTermsConditionAPI } from "../../../utils/apiEndPoint";

const initialState = {
  hotelTermsConditionLoading: false,
  activeHotelTermsConditionList: [],
  getHotelTermsConditionDetailsData: {},
  isHotelTermsConditionUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const getHotelTermsConditionListData = createAsyncThunk(
  "admin/get-HotelTermsCondition-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${hotelTermsConditionAPI}`, params)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data);
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

export const hotelTermsConditionSlice = createSlice({
  name: "HotelTermsCondition",
  initialState,
  reducers: {
    setIsHotelTermsConditionUpdate: (state, action) => {
      state.isHotelTermsConditionUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getHotelTermsConditionListData.pending, (state) => {
        state.hotelTermsConditionLoading = true;
      })
      .addCase(getHotelTermsConditionListData.rejected, (state) => {
        state.hotelTermsConditionLoading = false;
      })
      .addCase(getHotelTermsConditionListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
          action.payload;
        state.activeHotelTermsConditionList = data;
        state.hotelTermsConditionLoading = false;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
      });
  },
});

export const { setIsHotelTermsConditionUpdate } =
  hotelTermsConditionSlice.actions;

export default hotelTermsConditionSlice.reducer;
