import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { loginSearchBookingAPI } from "../../../utils/apiEndPoint";
import { setSessionItem } from "../../../hooks/session";

const initialState = {
  loginSearchBookingLoading: false,
  activeloginSearchBookingList: [],
  getLoginSearchBookingDetailsData: {},
  isLoginSearchBookingUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const addLoginSearchBooking = createAsyncThunk(
  "admin/add-loginsearch-booking",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(loginSearchBookingAPI, payload)
        .then((res) => {
          if (res.data.status) {
            setSessionItem("selfieBookingData", JSON.stringify(res.data.data));
            setSessionItem("selectedSelfieBookingData", null);
            resolve(res.data.data);
          } else {
            setSessionItem("SelfieGetData", null);
            setSessionItem("userData", null);
            setSessionItem("selfieBookingData", null);
            setSessionItem("selectedSelfieBookingData", null);
            reject();
          }
        })
        .catch((error) => {
          setSessionItem("SelfieGetData", null);
          setSessionItem("userData", null);
          setSessionItem("selfieBookingData", null);
          setSessionItem("selectedSelfieBookingData", null);
          reject(error);
        });
    });
  }
);

export const loginSearchBookingSlice = createSlice({
  name: "loginSearchBooking",
  initialState,
  reducers: {
    setIsLoginSearchBookingUpdate: (state, action) => {
      state.isLoginSearchBookingUpdate = action.payload;
    },
    setGetLoginSearchBookingDetailsData: (state, action) => {
      state.getLoginSearchBookingDetailsData = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addLoginSearchBooking.pending, (state) => {
        state.loginSearchBookingLoading = true;
        state.isLoginSearchBookingUpdate = false;
      })
      .addCase(addLoginSearchBooking.rejected, (state) => {
        state.loginSearchBookingLoading = false;
        state.isLoginSearchBookingUpdate = true;
      })
      .addCase(addLoginSearchBooking.fulfilled, (state, action) => {
        state.loginSearchBookingLoading = false;
        state.isLoginSearchBookingUpdate = true;
        state.getLoginSearchBookingDetailsData = action.payload;
      });
  },
});

export const {
  setIsLoginSearchBookingUpdate,
  setGetLoginSearchBookingDetailsData,
} = loginSearchBookingSlice.actions;

export default loginSearchBookingSlice.reducer;
