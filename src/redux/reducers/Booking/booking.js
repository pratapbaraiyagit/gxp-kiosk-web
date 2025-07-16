import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { bookingAPI, bookingCheckoutAPI } from "../../../utils/apiEndPoint";
import { setSessionItem } from "../../../hooks/session";

const initialState = {
  checkOutBookingLoading: false,
  isCheckOutBookingUpdate: false,

  bookingLoading: false,
  activeBookingList: [],
  getBookingDetailsData: {},
  isBookingUpdate: false,
  isBookingcheckoutUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
  referenceNumber: "",
  bookingNotFound: false,
};

export const getBookingListData = createAsyncThunk(
  "admin/get-booking-list",
  async (params, { rejectWithValue }) => {
    const {
      checkInDateNew,
      checkInDate,
      firstName,
      lastName,
      confirmCode,
      checkOutDate,
      roomNumber,
      BBStatusId,
      BSCodeName,
      doc_number,
    } = params;
    try {
      const response = await axios.get(bookingAPI, {
        params: {
          "bb.check_in_date__exact": checkInDateNew,
          // "bb.check_in_date,bb.check_out_date__between": checkOutDate,
          "bb.reference_no__icontains": confirmCode,
          first_name: firstName
            ?.replace(/[^a-zA-Z\s]/g, " ")
            ?.trim()
            ?.split(/\s+/)[0]
            ?.toLowerCase(),
          last_name: lastName,
          room_number: roomNumber,
          "bs.code_name": BSCodeName,
          "bb.status_id__in": BBStatusId,
          doc_number: doc_number,
        },
      });
      if (response.data.data.length) {
        if (!response.data.data[0]?.guest?.profile_picture) {
          setSessionItem("setShowSelfie", true);
        }
        return response.data.data;
      } else {
        // notification(
        //   response?.data?.data?.message ||
        //     `No bookings found for ${firstName} ${lastName} on ${checkInDate}`,
        //   "error"
        // );
        return rejectWithValue(response.data);
      }
    } catch (error) {
      // notification("Something Wrong!", "error");
      return rejectWithValue(error);
    }
  }
);

export const addNewBooking = createAsyncThunk(
  "admin/add-new-booking",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(bookingAPI, payload)
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Booking create successfully!!",
            //   "success"
            // );
            resolve(res.data.data);
          } else {
            // notification(res?.data?.message || "error", "error");
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

export const getBookingDetails = createAsyncThunk(
  "admin/get-booking-details",
  (id, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${bookingAPI}?id=${id}`)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data.data);
          } else {
            // notification(res?.data?.message || "error", "error");
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

export const updateBookingDetails = createAsyncThunk(
  "admin/update-booking-details",
  (props, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .patch(`${bookingAPI}`, props)
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Booking update successfully!!",
            //   "success"
            // );
            resolve(res.data);
          } else {
            // notification(res?.data?.message || "error", "error");
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

export const checkoutBookingDetails = createAsyncThunk(
  "admin/checkout-booking-details",
  (props, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .patch(`${bookingCheckoutAPI}`, props)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data.data);
          } else {
            reject();
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
);

export const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    setIsBookingUpdate: (state, action) => {
      state.isBookingUpdate = action.payload;
    },
    setIsBookingCheckoutUpdate: (state, action) => {
      state.isBookingcheckoutUpdate = action.payload;
    },
    setIsBookingNotFound: (state, action) => {
      state.bookingNotFound = action.payload;
    },
    setIsActiveBookingList: (state, action) => {
      state.activeBookingList = action.payload;
    },
    setIsBookingDetailsList: (state, action) => {
      state.getBookingDetailsData = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getBookingListData.pending, (state) => {
        state.bookingLoading = true;
        state.isBookingUpdate = false;
        state.bookingNotFound = false;
      })
      .addCase(getBookingListData.rejected, (state) => {
        state.bookingLoading = false;
        state.isBookingUpdate = false;
        state.bookingNotFound = true;
      })
      .addCase(getBookingListData.fulfilled, (state, action) => {
        state.activeBookingList = action.payload;
        state.bookingLoading = false;
        state.bookingNotFound = false;
        state.isBookingUpdate = true;
      })
      .addCase(addNewBooking.pending, (state) => {
        state.bookingLoading = true;
        state.isBookingUpdate = false;
        state.referenceNumber = "";
      })
      .addCase(addNewBooking.rejected, (state) => {
        state.bookingLoading = false;
        state.isBookingUpdate = false;
        state.referenceNumber = "";
      })
      .addCase(addNewBooking.fulfilled, (state, action) => {
        state.referenceNumber = action.payload.booking.reference_no;
        state.bookingLoading = false;
        state.isBookingUpdate = true;
      })
      .addCase(getBookingDetails.pending, (state) => {
        state.bookingLoading = true;
        state.getBookingDetailsData = "";
      })
      .addCase(getBookingDetails.rejected, (state) => {
        state.bookingLoading = false;
        state.getBookingDetailsData = "";
      })
      .addCase(getBookingDetails.fulfilled, (state, action) => {
        state.bookingLoading = false;
        state.getBookingDetailsData = action.payload;
      })
      .addCase(updateBookingDetails.pending, (state) => {
        state.isBookingUpdate = false;
        state.bookingLoading = true;
        state.isBookingcheckoutUpdate = false;
      })
      .addCase(updateBookingDetails.rejected, (state) => {
        state.isBookingUpdate = false;
        state.bookingLoading = false;
        state.isBookingcheckoutUpdate = false;
      })
      .addCase(updateBookingDetails.fulfilled, (state, action) => {
        state.isBookingUpdate = true;
        state.isBookingcheckoutUpdate = true;
        state.bookingLoading = false;
      })
      .addCase(checkoutBookingDetails.pending, (state) => {
        state.isCheckOutBookingUpdate = false;
        state.checkOutBookingLoading = true;
      })
      .addCase(checkoutBookingDetails.rejected, (state) => {
        state.isCheckOutBookingUpdate = false;
        state.checkOutBookingLoading = false;
      })
      .addCase(checkoutBookingDetails.fulfilled, (state, action) => {
        state.isCheckOutBookingUpdate = true;
        state.checkOutBookingLoading = false;
      })
  },
});

export const {
  setIsBookingUpdate,
  setIsBookingCheckoutUpdate,
  setIsBookingNotFound,
  setIsActiveBookingList,
  setIsBookingDetailsList,
} = bookingSlice.actions;

export default bookingSlice.reducer;
