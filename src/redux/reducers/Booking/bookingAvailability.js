import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  bookingAvailabilityAPI,
  bookingRoomAvailabileAPI,
  bookingStatusAPI,
  bookingTypeAPI,
  businessSourceAPI,
} from "../../../utils/apiEndPoint";

const initialState = {
  bookingAvailabilityLoading: false,
  activeBookingAvailabilityList: [],
  isBookingAvailabilityUpdate: false,
  businessSourceLoading: false,
  activeBusinessSourceList: [],
  isBusinessSourceUpdate: false,
  bookingStatusLoading: false,
  activeBookingStatusList: [],
  isBookingStatusUpdate: false,
  bookingTypeLoading: false,
  activeBookingTypeList: [],
  isBookingTypeUpdate: false,
  activeBookingRoomAvailableList: [],
};

export const getBookingAvailabilityListData = createAsyncThunk(
  "admin/get-booking-availability-list",
  async (params, { rejectWithValue }) => {
    try {
      const response = await axios.get(bookingAvailabilityAPI, { params });
      if (response.data.data.length) {
        return response.data.data;
      } else {
        // notification(
        //   response?.data?.data?.message || `Something Wrong`,
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

export const getBusinessSourceListData = createAsyncThunk(
  "admin/get-BusinessSource-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${businessSourceAPI}`, params)
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

export const getBookingStatusListData = createAsyncThunk(
  "admin/get-BookingStatus-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${bookingStatusAPI}`, params)
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

export const getBookingTypeListData = createAsyncThunk(
  "admin/get-BookingType-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${bookingTypeAPI}`, params)
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

export const getBookingRoomAvailableListData = createAsyncThunk(
  "admin/get-bookingRoomAvailable-data-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${bookingRoomAvailabileAPI}`, params)
        .then((res) => {
          if (res.data.status) {
            resolve(res?.data?.data);
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

export const bookingAvailabilitySlice = createSlice({
  name: "bookingAvailability",
  initialState,
  reducers: {
    setIsBookingAvailabilityUpdate: (state, action) => {
      state.isBookingAvailabilityUpdate = action.payload;
    },
    setIsBusinessSourceUpdate: (state, action) => {
      state.isBusinessSourceUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getBookingAvailabilityListData.pending, (state) => {
        state.bookingAvailabilityLoading = true;
        state.isBookingAvailabilityUpdate = false;
      })
      .addCase(getBookingAvailabilityListData.rejected, (state) => {
        state.bookingAvailabilityLoading = false;
        state.isBookingAvailabilityUpdate = false;
      })
      .addCase(getBookingAvailabilityListData.fulfilled, (state, action) => {
        state.activeBookingAvailabilityList = action.payload;
        state.bookingAvailabilityLoading = false;
        state.isBookingAvailabilityUpdate = true;
      })
      .addCase(getBusinessSourceListData.pending, (state) => {
        state.businessSourceLoading = true;
        state.isBusinessSourceUpdate = false;
      })
      .addCase(getBusinessSourceListData.rejected, (state) => {
        state.businessSourceLoading = false;
        state.isBusinessSourceUpdate = false;
      })
      .addCase(getBusinessSourceListData.fulfilled, (state, action) => {
        state.activeBusinessSourceList = action.payload;
        state.businessSourceLoading = false;
        state.isBusinessSourceUpdate = true;
      })
      .addCase(getBookingStatusListData.pending, (state) => {
        state.bookingStatusLoading = true;
        state.isBookingStatusUpdate = false;
      })
      .addCase(getBookingStatusListData.rejected, (state) => {
        state.bookingStatusLoading = false;
        state.isBookingStatusUpdate = false;
      })
      .addCase(getBookingStatusListData.fulfilled, (state, action) => {
        state.activeBookingStatusList = action.payload;
        state.bookingStatusLoading = false;
        state.isBookingStatusUpdate = true;
      })
      .addCase(getBookingTypeListData.pending, (state) => {
        state.bookingTypeLoading = true;
        state.isBookingTypeUpdate = false;
      })
      .addCase(getBookingTypeListData.rejected, (state) => {
        state.bookingTypeLoading = false;
        state.isBookingTypeUpdate = false;
      })
      .addCase(getBookingTypeListData.fulfilled, (state, action) => {
        state.activeBookingTypeList = action.payload;
        state.bookingTypeLoading = false;
        state.isBookingTypeUpdate = true;
      })
      .addCase(getBookingRoomAvailableListData.pending, (state) => {
        state.bookingAvailabilityLoading = true;
      })
      .addCase(getBookingRoomAvailableListData.rejected, (state) => {
        state.bookingAvailabilityLoading = false;
      })
      .addCase(getBookingRoomAvailableListData.fulfilled, (state, action) => {
        state.activeBookingRoomAvailableList = action.payload;
        state.bookingAvailabilityLoading = false;
      });
  },
});

export const { setIsBookingAvailabilityUpdate, setIsBusinessSourceUpdate } =
  bookingAvailabilitySlice.actions;

export default bookingAvailabilitySlice.reducer;
