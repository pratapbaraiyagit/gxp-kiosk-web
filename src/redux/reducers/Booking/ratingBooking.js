import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { ratingBookingAPI } from "../../../utils/apiEndPoint";

const initialState = {
  ratingBookingLoading: false,
  activeRatingBookingList: [],
  getRatingBookingDetailsData: {},
  isRatingBookingUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const addRatingBooking = createAsyncThunk(
  "admin/add-rating-booking",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(ratingBookingAPI, payload)
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Rating Added successfully!!",
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

export const ratingBookingSlice = createSlice({
  name: "ratingBooking",
  initialState,
  reducers: {
    setIsRatingBookingUpdate: (state, action) => {
      state.isRatingBookingUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addRatingBooking.pending, (state) => {
        state.ratingBookingLoading = true;
        state.isRatingBookingUpdate = false;
      })
      .addCase(addRatingBooking.rejected, (state) => {
        state.ratingBookingLoading = false;
        state.isRatingBookingUpdate = false;
      })
      .addCase(addRatingBooking.fulfilled, (state, action) => {
        state.ratingBookingLoading = false;
        state.isRatingBookingUpdate = true;
      });
  },
});

export const { setIsRatingBookingUpdate } =
  ratingBookingSlice.actions;

export default ratingBookingSlice.reducer;
