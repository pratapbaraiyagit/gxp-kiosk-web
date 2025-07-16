import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { notification } from "../../../helpers/middleware";
import { kioskAudioAPI } from "../../../utils/apiEndPoint";
import { setSessionItem } from "../../../hooks/session";
import { saveAudioBlob } from "../../../utils/audioStorage";

const initialState = {
  kioskAudioLoading: false,
  activeKioskAudioList: [],
  getKioskAudioDetailsData: {},
  isKioskAudioUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const getKioskAudioListData = createAsyncThunk(
  "admin/get-KioskAudio-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${kioskAudioAPI}`, params)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data);
            setSessionItem("kioskAudioDetails", JSON.stringify(res.data.data));
            res.data.data.forEach(item => {
              if (item.audio_url && item.id) {
                saveAudioBlob(item.id, item.audio_url);
              }
            });
          } else {
            notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
);

export const getKioskAudioDetails = createAsyncThunk(
  "admin/get-KioskAudio-details",
  (data, { dispatch }) => {
    const { id } = data;
    return new Promise((resolve, reject) => {
      axios
        .get(`${kioskAudioAPI}?hotel_id=${id}`)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data.data);

          } else {
            notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
);

export const kioskAudioSlice = createSlice({
  name: "KioskAudio",
  initialState,
  reducers: {
    setIsKioskAudioUpdate: (state, action) => {
      state.isKioskAudioUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getKioskAudioListData.pending, (state) => {
        state.kioskAudioLoading = true;
        state.isKioskAudioUpdate = false;
      })
      .addCase(getKioskAudioListData.rejected, (state) => {
        state.kioskAudioLoading = false;
        state.isKioskAudioUpdate = false;
      })
      .addCase(getKioskAudioListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
        action.payload;
        state.activeKioskAudioList = data;
        state.kioskAudioLoading = false;
        state.isKioskAudioUpdate = true;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
      })
      .addCase(getKioskAudioDetails.pending, (state) => {
        state.kioskAudioLoading = true;
        state.getKioskAudioDetailsData = "";
      })
      .addCase(getKioskAudioDetails.rejected, (state) => {
        state.kioskAudioLoading = false;
        state.getKioskAudioDetailsData = "";
      })
      .addCase(getKioskAudioDetails.fulfilled, (state, action) => {
        state.kioskAudioLoading = false;
        state.getKioskAudioDetailsData = action.payload;
      });
  },
});

export const { setIsKioskAudioUpdate } = kioskAudioSlice.actions;

export default kioskAudioSlice.reducer;
