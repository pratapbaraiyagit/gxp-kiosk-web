import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { hotelRoomTypeAPI } from "../../../utils/apiEndPoint";
import { notification } from "../../../helpers/middleware";
import { setSessionItem } from "../../../hooks/session";

const initialState = {
  hotelRoomTypeLoading: false,
  activeHotelRoomTypeList: [],
  getHotelRoomTypeDetailsData: {},
  isHotelRoomTypeUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const getHotelRoomTypeListData = createAsyncThunk(
  "admin/get-HotelRoomType-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${hotelRoomTypeAPI}`, params)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data);
            setSessionItem(
              "roomTypeList",
              btoa(unescape(encodeURIComponent(JSON.stringify(res.data.data))))
            );
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

export const addNewHotelRoomType = createAsyncThunk(
  "admin/add-new-HotelRoomType",
  (HotelRoomType, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(hotelRoomTypeAPI, HotelRoomType)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "Hotel room type create successfully!!",
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

export const getHotelRoomTypeDetails = createAsyncThunk(
  "admin/get-HotelRoomType-details-HotelRoomType",
  (id, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${hotelRoomTypeAPI}?id=${id}`)
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

export const updateHotelRoomTypeDetails = createAsyncThunk(
  "admin/update-HotelRoomType-details",
  (props, { dispatch }) => {
    const { id, data } = props;
    return new Promise((resolve, reject) => {
      axios
        .patch(`${hotelRoomTypeAPI}/${id}`, data)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "Hotel room type update successfully!!",
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

export const deleteHotelRoomType = createAsyncThunk(
  "admin/HotelRoomType-delete",
  (props, { dispatch }) => {
    const { id } = props;
    return new Promise((resolve, reject) => {
      axios
        .delete(`${hotelRoomTypeAPI}`, {
          data: {
            room_type_ids: id,
          },
        })
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "Hotel room type delete successfully!!",
              "success"
            );
            resolve(id);
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

export const hotelRoomTypeSlice = createSlice({
  name: "HotelRoomType",
  initialState,
  reducers: {
    setIsHotelRoomTypeUpdate: (state, action) => {
      state.isHotelRoomTypeUpdate = action.payload;
    },
    setIsGetHotelRoomTypeDetailsData: (state, action) => {
      state.getHotelRoomTypeDetailsData = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getHotelRoomTypeListData.pending, (state) => {
        state.hotelRoomTypeLoading = true;
      })
      .addCase(getHotelRoomTypeListData.rejected, (state) => {
        state.hotelRoomTypeLoading = false;
      })
      .addCase(getHotelRoomTypeListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
          action.payload;
        state.activeHotelRoomTypeList = data;
        state.hotelRoomTypeLoading = false;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
      })
      .addCase(addNewHotelRoomType.pending, (state) => {
        state.hotelRoomTypeLoading = true;
        state.isHotelRoomTypeUpdate = false;
      })
      .addCase(addNewHotelRoomType.rejected, (state) => {
        state.hotelRoomTypeLoading = false;
        state.isHotelRoomTypeUpdate = false;
      })
      .addCase(addNewHotelRoomType.fulfilled, (state, action) => {
        state.hotelRoomTypeLoading = false;
        state.isHotelRoomTypeUpdate = true;
      })
      .addCase(getHotelRoomTypeDetails.pending, (state) => {
        state.hotelRoomTypeLoading = true;
        state.getHotelRoomTypeDetailsData = "";
      })
      .addCase(getHotelRoomTypeDetails.rejected, (state) => {
        state.hotelRoomTypeLoading = false;
        state.getHotelRoomTypeDetailsData = "";
      })
      .addCase(getHotelRoomTypeDetails.fulfilled, (state, action) => {
        state.hotelRoomTypeLoading = false;
        state.getHotelRoomTypeDetailsData = action.payload;
      })
      .addCase(updateHotelRoomTypeDetails.pending, (state) => {
        state.isHotelRoomTypeUpdate = false;
        state.hotelRoomTypeLoading = true;
      })
      .addCase(updateHotelRoomTypeDetails.rejected, (state) => {
        state.hotelRoomTypeLoading = false;
        state.isHotelRoomTypeUpdate = false;
      })
      .addCase(updateHotelRoomTypeDetails.fulfilled, (state, action) => {
        state.isHotelRoomTypeUpdate = true;
        state.hotelRoomTypeLoading = false;
      })
      .addCase(deleteHotelRoomType.pending, (state) => {
        state.hotelRoomTypeLoading = true;
        state.isHotelRoomTypeUpdate = false;
      })
      .addCase(deleteHotelRoomType.rejected, (state) => {
        state.hotelRoomTypeLoading = false;
        state.isHotelRoomTypeUpdate = false;
      })
      .addCase(deleteHotelRoomType.fulfilled, (state, action) => {
        const uuidsToDelete = Array.isArray(action.payload)
          ? action.payload
          : [];
        state.activeHotelRoomTypeList = state.activeHotelRoomTypeList.filter(
          (user) => !uuidsToDelete.includes(user.id)
        );
        state.hotelRoomTypeLoading = false;
        state.isHotelRoomTypeUpdate = true;
      });
  },
});

export const { setIsHotelRoomTypeUpdate, setIsGetHotelRoomTypeDetailsData } =
  hotelRoomTypeSlice.actions;

export default hotelRoomTypeSlice.reducer;
