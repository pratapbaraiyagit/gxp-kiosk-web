import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  kioskQADeskAPI,
  kioskQuestionActionAPI,
} from "../../../utils/apiEndPoint";
import { notification } from "../../../helpers/middleware";

const initialState = {
  kioskQuestionActionLoading: false,
  activeKioskQuestionActionList: [],
  kioskQADeskLoading: false,
  activeKioskQADeskList: [],
  getKioskQADeskDetailsData: {},
  isKioskQADeskUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const getKioskQuestionActionListData = createAsyncThunk(
  "admin/get-kioskQuestionAction-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${kioskQuestionActionAPI}`, params)
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

export const getKioskQADeskListData = createAsyncThunk(
  "admin/get-kioskQADesk-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${kioskQADeskAPI}`, params)
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

export const addNewKioskQADeskItem = createAsyncThunk(
  "admin/add-kioskQADesk-item",
  (props, { dispatch }) => {
    const { payload } = props;
    return new Promise((resolve, reject) => {
      axios
        .post(kioskQADeskAPI, payload)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "Kiosk Question Answer create successfully!!",
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

export const getKioskQADeskDetails = createAsyncThunk(
  "admin/get-kioskQADesk-details",
  (data, { dispatch }) => {
    const { id } = data;
    return new Promise((resolve, reject) => {
      axios
        .get(`${kioskQADeskAPI}?id=${id}`)
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

export const updateKioskQADeskDetails = createAsyncThunk(
  "admin/update-kioskQADesk-details",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .patch(`${kioskQADeskAPI}`, payload)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "Kiosk Question Answer update successfully!!",
              "success"
            );
            resolve({
              id: payload.id,
              ...payload,
            });
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

export const deleteKioskQADesk = createAsyncThunk(
  "admin/delete-kioskQADesk",
  (props, { dispatch }) => {
    const { id } = props;
    return new Promise((resolve, reject) => {
      axios
        .delete(`${kioskQADeskAPI}`, {
          data: {
            kiosk_question_ids: id,
          },
        })
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "Kiosk Question Answer delete successfully!!",
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

export const KioskQADeskSlice = createSlice({
  name: "kioskQADesk",
  initialState,
  reducers: {
    setIsKioskQADeskUpdate: (state, action) => {
      state.isKioskQADeskUpdate = action.payload;
    },
    setIsKioskQADeskDetailsData: (state, action) => {
      state.getKioskQADeskDetailsData = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getKioskQuestionActionListData.pending, (state) => {
        state.kioskQuestionActionLoading = true;
      })
      .addCase(getKioskQuestionActionListData.rejected, (state) => {
        state.kioskQuestionActionLoading = false;
      })
      .addCase(getKioskQuestionActionListData.fulfilled, (state, action) => {
        const { data } = action.payload;
        state.activeKioskQuestionActionList = data;
        state.kioskQuestionActionLoading = false;
      })
      .addCase(getKioskQADeskListData.pending, (state) => {
        state.kioskQADeskLoading = true;
      })
      .addCase(getKioskQADeskListData.rejected, (state) => {
        state.kioskQADeskLoading = false;
      })
      .addCase(getKioskQADeskListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
          action.payload;
        state.activeKioskQADeskList = data;
        state.kioskQADeskLoading = false;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
      })
      .addCase(addNewKioskQADeskItem.pending, (state) => {
        state.kioskQADeskLoading = true;
        state.isKioskQADeskUpdate = false;
      })
      .addCase(addNewKioskQADeskItem.rejected, (state) => {
        state.kioskQADeskLoading = false;
        state.isKioskQADeskUpdate = false;
      })
      .addCase(addNewKioskQADeskItem.fulfilled, (state, action) => {
        state.kioskQADeskLoading = false;
        state.isKioskQADeskUpdate = true;
      })
      .addCase(getKioskQADeskDetails.pending, (state) => {
        state.kioskQADeskLoading = true;
        state.getKioskQADeskDetailsData = "";
      })
      .addCase(getKioskQADeskDetails.rejected, (state) => {
        state.kioskQADeskLoading = false;
        state.getKioskQADeskDetailsData = "";
      })
      .addCase(getKioskQADeskDetails.fulfilled, (state, action) => {
        state.kioskQADeskLoading = false;
        state.getKioskQADeskDetailsData = action.payload;
      })
      .addCase(updateKioskQADeskDetails.pending, (state) => {
        state.isKioskQADeskUpdate = false;
        state.kioskQADeskLoading = true;
      })
      .addCase(updateKioskQADeskDetails.rejected, (state) => {
        state.isKioskQADeskUpdate = false;
        state.kioskQADeskLoading = false;
      })
      .addCase(updateKioskQADeskDetails.fulfilled, (state, action) => {
        const { id, ...updatedData } = action.payload;
        // If we're setting is_default to true
        if (updatedData.is_default === true) {
          // First set all items' is_default to false
          state.activeKioskQADeskList = state.activeKioskQADeskList.map(
            (item) => ({
              ...item,
              is_default: false,
            })
          );

          // Then update only the first selected business source to true
          // and apply other updates to all selected sources
          state.activeKioskQADeskList = state.activeKioskQADeskList.map(
            (item) =>
              id.includes(item.id)
                ? {
                    ...item,
                    ...updatedData,
                    is_default: id[0] === item.id ? true : false,
                  }
                : item
          );
        } else {
          // If not updating is_default, proceed with normal update
          state.activeKioskQADeskList = state.activeKioskQADeskList.map(
            (item) =>
              id.includes(item.id) ? { ...item, ...updatedData } : item
          );
        }
        state.isKioskQADeskUpdate = true;
        state.kioskQADeskLoading = false;
      })
      .addCase(deleteKioskQADesk.pending, (state) => {
        state.kioskQADeskLoading = true;
        state.isKioskQADeskUpdate = false;
      })
      .addCase(deleteKioskQADesk.rejected, (state) => {
        state.kioskQADeskLoading = false;
        state.isKioskQADeskUpdate = false;
      })
      .addCase(deleteKioskQADesk.fulfilled, (state, action) => {
        const uuidsToDelete = Array.isArray(action.payload)
          ? action.payload
          : [];
        state.activeKioskQADeskList = state.activeKioskQADeskList.filter(
          (data) => !uuidsToDelete.includes(data.id)
        );
        state.kioskQADeskLoading = false;
        state.isKioskQADeskUpdate = true;
      });
  },
});

export const { setIsKioskQADeskUpdate, setIsKioskQADeskDetailsData } =
  KioskQADeskSlice.actions;

export default KioskQADeskSlice.reducer;
