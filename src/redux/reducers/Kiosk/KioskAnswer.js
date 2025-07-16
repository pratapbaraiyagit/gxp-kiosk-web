import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { kioskAnswerAPI } from "../../../utils/apiEndPoint";
import { notification } from "../../../helpers/middleware";

const initialState = {
  kioskAnswerLoading: false,
  activeKioskAnswerList: [],
  getKioskAnswerDetailsData: {},
  isKioskAnswerUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const addNewKioskAnswerItem = createAsyncThunk(
  "admin/add-kioskAnswer",
  (props, { dispatch }) => {
    const { payload } = props;
    return new Promise((resolve, reject) => {
      axios
        .post(kioskAnswerAPI, payload)
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Kiosk Answer create successfully!!",
            //   "success"
            // );
            resolve(res.data.data);
          } else {
            // notification(res?.data?.message || "Something went wrong", "error");
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

export const KioskAnswerSlice = createSlice({
  name: "kioskAnswer",
  initialState,
  reducers: {
    setIsKioskAnswerUpdate: (state, action) => {
      state.isKioskAnswerUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addNewKioskAnswerItem.pending, (state) => {
        state.kioskAnswerLoading = true;
        state.isKioskAnswerUpdate = false;
      })
      .addCase(addNewKioskAnswerItem.rejected, (state) => {
        state.kioskAnswerLoading = false;
        state.isKioskAnswerUpdate = false;
      })
      .addCase(addNewKioskAnswerItem.fulfilled, (state, action) => {
        state.kioskAnswerLoading = false;
        state.isKioskAnswerUpdate = true;
      });
  },
});

export const { setIsKioskAnswerUpdate, setIsKioskQADeskDetailsData } =
  KioskAnswerSlice.actions;

export default KioskAnswerSlice.reducer;
