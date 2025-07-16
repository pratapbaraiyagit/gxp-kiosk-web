import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  currency,
  paymentMethod,
  timeZoneAPI,
} from "../../../utils/apiEndPoint";
import { notification } from "../../../helpers/middleware";

const initialState = {
  appPaymentMethodLoading: false,
  activePaymentMethodList: [],
  getPaymentMethodDetailsData: {},
  isPaymentMethodUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
  appCurrencyLoading: false,
  activeCurrencyList: [],
  appTimezoneLoading: false,
  activeTimezoneList: [],
};

export const getTimeZoneList = createAsyncThunk(
  "admin/get-timezone-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(timeZoneAPI, params)
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

export const getCurrencyListData = createAsyncThunk(
  "admin/get-currency-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(currency, params)
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

export const getPaymentMethodListData = createAsyncThunk(
  "admin/get-paymentMethod-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(paymentMethod, params)
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

export const paymentMethodSlice = createSlice({
  name: "paymentMethod",
  initialState,
  reducers: {
    setIsPaymentMethodUpdate: (state, action) => {
      state.isPaymentMethodUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(getTimeZoneList.pending, (state) => {
        state.appTimezoneLoading = true;
      })
      .addCase(getTimeZoneList.rejected, (state) => {
        state.appTimezoneLoading = false;
      })
      .addCase(getTimeZoneList.fulfilled, (state, action) => {
        const { data } = action.payload;
        state.activeTimezoneList = data;
        state.appTimezoneLoading = false;
      })
      .addCase(getCurrencyListData.pending, (state) => {
        state.appCurrencyLoading = true;
      })
      .addCase(getCurrencyListData.rejected, (state) => {
        state.appCurrencyLoading = false;
      })
      .addCase(getCurrencyListData.fulfilled, (state, action) => {
        const { data } = action.payload;
        state.activeCurrencyList = data;
        state.appCurrencyLoading = false;
      })
      .addCase(getPaymentMethodListData.pending, (state) => {
        state.appPaymentMethodLoading = true;
      })
      .addCase(getPaymentMethodListData.rejected, (state) => {
        state.appPaymentMethodLoading = false;
      })
      .addCase(getPaymentMethodListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
          action.payload;
        state.activePaymentMethodList = data;
        state.appPaymentMethodLoading = false;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
      });
  },
});

export const { setIsPaymentMethodUpdate } = paymentMethodSlice.actions;

export default paymentMethodSlice.reducer;
