import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { authorizationBookingAPI } from "../../../utils/apiEndPoint";

const initialState = {
  authorizationBookingLoading: false,
  activeAuthorizationBookingList: [],
  getAuthorizationBookingDetailsData: {},
  isAuthorizationBookingUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const addAuthorizationBooking = createAsyncThunk(
  "admin/add-authorization-booking",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(authorizationBookingAPI, payload)
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Authorised Booking successfully!!",
            //   "success"
            // );
            resolve(res.data.data);
          } else {
            // notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
);

export const authorizationBookingSlice = createSlice({
  name: "authorizationBooking",
  initialState,
  reducers: {
    setIsAuthorizationBookingUpdate: (state, action) => {
      state.isAuthorizationBookingUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addAuthorizationBooking.pending, (state) => {
        state.authorizationBookingLoading = true;
        state.isAuthorizationBookingUpdate = false;
      })
      .addCase(addAuthorizationBooking.rejected, (state) => {
        state.authorizationBookingLoading = false;
        state.isAuthorizationBookingUpdate = false;
      })
      .addCase(addAuthorizationBooking.fulfilled, (state, action) => {
        state.authorizationBookingLoading = false;
        state.isAuthorizationBookingUpdate = true;
      });
  },
});

export const { setIsAuthorizationBookingUpdate } =
  authorizationBookingSlice.actions;

export default authorizationBookingSlice.reducer;
