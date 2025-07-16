import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { notification } from "../../../helpers/middleware";
import { hotelSourcePaymentPolicyAPI } from "../../../utils/apiEndPoint";

const initialState = {
  hotelSourcePaymentPolicyLoading: false,
  activeSourcePaymentPolicyList: [],
  getSourcePaymentPolicyDetailsData: {},
  isSourcePaymentPolicyUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const getSourcePaymentPolicyListData = createAsyncThunk(
  "admin/get-sourcePaymentPolicy-list-data",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${hotelSourcePaymentPolicyAPI}`, params)
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

export const addNewSourcePaymentPolicy = createAsyncThunk(
  "admin/add-new-sourcePaymentPolicy",
  (CancellationPolicy, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(hotelSourcePaymentPolicyAPI, CancellationPolicy)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "Payment Policy create successfully!!",
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

export const getSourcePaymentPolicyDetails = createAsyncThunk(
  "admin/get-sourcePaymentPolicy-details",
  (id, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${hotelSourcePaymentPolicyAPI}?id=${id}`)
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

export const updateSourcePaymentPolicyDetails = createAsyncThunk(
  "admin/update-CancellationPolicy-details",
  (props, { dispatch }) => {
    const { id, data } = props;
    return new Promise((resolve, reject) => {
      axios
        .patch(`${hotelSourcePaymentPolicyAPI}`, data)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "Payment Policy update successfully!!",
              "success"
            );
            resolve({ id, ...data });
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

export const hotelSourcePaymentPolicySlice = createSlice({
  name: "hotelSourcePaymentPolicyConfig",
  initialState,
  reducers: {
    setIsSourcePaymentPolicyUpdate: (state, action) => {
      state.isSourcePaymentPolicyUpdate = action.payload;
    },
    setIsSourcePaymentPolicyDetailsData: (state, action) => {
      state.getSourcePaymentPolicyDetailsData = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getSourcePaymentPolicyListData.pending, (state) => {
        state.hotelSourcePaymentPolicyLoading = true;
      })
      .addCase(getSourcePaymentPolicyListData.rejected, (state) => {
        state.hotelSourcePaymentPolicyLoading = false;
      })
      .addCase(getSourcePaymentPolicyListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
          action.payload;
        state.activeSourcePaymentPolicyList = data;
        state.hotelSourcePaymentPolicyLoading = false;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
      })
      .addCase(addNewSourcePaymentPolicy.pending, (state) => {
        state.hotelSourcePaymentPolicyLoading = true;
        state.isSourcePaymentPolicyUpdate = false;
      })
      .addCase(addNewSourcePaymentPolicy.rejected, (state) => {
        state.hotelSourcePaymentPolicyLoading = false;
        state.isSourcePaymentPolicyUpdate = false;
      })
      .addCase(addNewSourcePaymentPolicy.fulfilled, (state, action) => {
        state.hotelSourcePaymentPolicyLoading = false;
        state.isSourcePaymentPolicyUpdate = true;
      })
      .addCase(getSourcePaymentPolicyDetails.pending, (state) => {
        state.hotelSourcePaymentPolicyLoading = true;
        state.getSourcePaymentPolicyDetailsData = "";
      })
      .addCase(getSourcePaymentPolicyDetails.rejected, (state) => {
        state.hotelSourcePaymentPolicyLoading = false;
        state.getSourcePaymentPolicyDetailsData = "";
      })
      .addCase(getSourcePaymentPolicyDetails.fulfilled, (state, action) => {
        state.hotelSourcePaymentPolicyLoading = false;
        state.getSourcePaymentPolicyDetailsData = action.payload;
      })
      .addCase(updateSourcePaymentPolicyDetails.pending, (state) => {
        state.isSourcePaymentPolicyUpdate = false;
        state.hotelSourcePaymentPolicyLoading = true;
      })
      .addCase(updateSourcePaymentPolicyDetails.rejected, (state) => {
        state.isSourcePaymentPolicyUpdate = false;
        state.hotelSourcePaymentPolicyLoading = false;
      })
      .addCase(updateSourcePaymentPolicyDetails.fulfilled, (state, action) => {
        state.isSourcePaymentPolicyUpdate = true;
        state.hotelSourcePaymentPolicyLoading = false;
      });
  },
});

export const {
  setIsSourcePaymentPolicyUpdate,
  setIsSourcePaymentPolicyDetailsData,
} = hotelSourcePaymentPolicySlice.actions;

export default hotelSourcePaymentPolicySlice.reducer;
