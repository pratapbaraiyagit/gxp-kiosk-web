import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { guestAPI, guestCategoryAPI } from "../../../utils/apiEndPoint";
import { setSessionItem } from "../../../hooks/session";

const initialState = {
  guestLoading: false,
  activeGuestList: [],
  getGuestDetailsData: {},
  getOCRDocumentGuestData: {},
  isGuestUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
  guestId: "",
  guestCategoryLoading: false,
  activeCategoryGuestList: [],
};

export const getGuestListData = createAsyncThunk(
  "admin/get-Guest-data-list",
  async (params, { rejectWithValue }) => {
    const { firstName, lastName } = params;
    try {
      const response = await axios.get(guestAPI, {
        params: {
          "ap.first_name__icontains": firstName
            ?.replace(/[^a-zA-Z\s]/g, " ")
            ?.trim()
            ?.split(/\s+/)[0]
            ?.toLowerCase(),
          "ap.last_name__icontains": lastName,
        },
      });
      if (response.data.data?.length) {
        return response.data.data;
      } else {
        // notification(
        //   response?.data?.data?.message ||
        //     `No bookings found for ${firstName} ${lastName}`,
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

export const getGuestCategoryListData = createAsyncThunk(
  "admin/get-Guest-category-data-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${guestCategoryAPI}`, params)
        .then((res) => {
          if (res.data.status) {
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

export const addNewGuest = createAsyncThunk(
  "admin/add-new-Guest-add-",
  (Guest, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(guestAPI, Guest)
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Guest create successfully!!",
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

export const getGuestDetails = createAsyncThunk(
  "admin/get-Guest-details-Guest-",
  (id, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${guestAPI}?id=${id}`)
        .then((res) => {
          if (res.data.status) {
            setSessionItem("SelfieGetData", JSON.stringify(res.data.data));
            resolve(res.data.data);
          } else {
            setSessionItem("SelfieGetData", null);
            // notification(res?.data?.message || "error", "error");
            reject();
          }
        })
        .catch((error) => {
          setSessionItem("SelfieGetData", null);
          // notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const updateGuestDetails = createAsyncThunk(
  "admin/update-Guest--details",
  (props, { dispatch }) => {
    const { id, data } = props;
    return new Promise((resolve, reject) => {
      axios
        .patch(`${guestAPI}/${id}`, data)
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Guest update successfully!!",
            //   "success"
            // );
            resolve({ id, ...data });
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

export const updateGuestContactDetails = createAsyncThunk(
  "admin/update-Guest-contact-details",
  (props, { dispatch }) => {
    const { id, contactId, data } = props;
    return new Promise((resolve, reject) => {
      axios
        .patch(`${guestAPI}/${id}/guest_contact/${contactId}`, data)
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Guest contact update successfully!!",
            //   "success"
            // );
            resolve({ id, ...data });
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
export const updateGuestDocumentDetails = createAsyncThunk(
  "admin/update-Guest-document-details",
  (props, { dispatch }) => {
    const { id, documentId, data } = props;
    return new Promise((resolve, reject) => {
      axios
        .patch(`${guestAPI}/${id}/guest_document/${documentId}`, data)
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Guest document update successfully!!",
            //   "success"
            // );
            resolve({ id, ...data });
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

export const deleteGuest = createAsyncThunk(
  "admin/Guest-delete-data-api",
  (props, { dispatch }) => {
    const { id } = props;
    return new Promise((resolve, reject) => {
      axios
        .delete(`${guestAPI}`, {
          data: {
            guest_ids: id,
          },
        })
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Guest delete successfully!!",
            //   "success"
            // );
            resolve(id);
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

export const deleteGuestContact = createAsyncThunk(
  "admin/Guest-contact-delete-data-api",
  (props, { dispatch }) => {
    const { id } = props;
    return new Promise((resolve, reject) => {
      axios
        .delete(`${guestAPI}`, {
          data: {
            guest_contact_ids: id,
          },
        })
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Guest contact delete successfully!!",
            //   "success"
            // );
            resolve(id);
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
export const deleteGuestDocument = createAsyncThunk(
  "admin/Guest-document-delete-data-api",
  (props, { dispatch }) => {
    const { id } = props;
    return new Promise((resolve, reject) => {
      axios
        .delete(`${guestAPI}`, {
          data: {
            guest_document_ids: id,
          },
        })
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Guest  document delete successfully!!",

            //   "success"
            // );
            resolve(id);
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

export const guestSlice = createSlice({
  name: "Guest",
  initialState,
  reducers: {
    setIsGuestUpdate: (state, action) => {
      state.isGuestUpdate = action.payload;
    },
    setIsGuestDetailsData: (state, action) => {
      state.getGuestDetailsData = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getGuestListData.pending, (state) => {
        state.guestLoading = true;
        state.isGuestUpdate = false;
      })
      .addCase(getGuestListData.rejected, (state) => {
        state.guestLoading = false;
        state.isGuestUpdate = false;
      })
      .addCase(getGuestListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
          action.payload;
        state.activeGuestList = data;
        state.isGuestUpdate = true;
        state.guestLoading = false;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
      })

      .addCase(getGuestCategoryListData.pending, (state) => {
        state.guestCategoryLoading = true;
      })
      .addCase(getGuestCategoryListData.rejected, (state) => {
        state.guestCategoryLoading = false;
      })
      .addCase(getGuestCategoryListData.fulfilled, (state, action) => {
        const { data } = action.payload;
        state.activeCategoryGuestList = data;
        state.guestCategoryLoading = false;
      })
      .addCase(addNewGuest.pending, (state) => {
        state.guestLoading = true;
        state.isGuestUpdate = false;
      })
      .addCase(addNewGuest.rejected, (state) => {
        state.guestLoading = false;
        state.isGuestUpdate = false;
      })
      .addCase(addNewGuest.fulfilled, (state, action) => {
        state.guestLoading = false;
        state.isGuestUpdate = true;
      })
      .addCase(getGuestDetails.pending, (state) => {
        state.guestLoading = true;
        state.isGuestUpdate = false;
        state.getGuestDetailsData = {};
      })
      .addCase(getGuestDetails.rejected, (state) => {
        state.guestLoading = false;
        state.isGuestUpdate = false;
        state.getGuestDetailsData = {};
      })
      .addCase(getGuestDetails.fulfilled, (state, action) => {
        state.guestLoading = false;
        state.isGuestUpdate = true;
        state.getGuestDetailsData = action.payload;
      })
      .addCase(updateGuestDetails.pending, (state) => {
        state.isGuestUpdate = false;
        state.guestLoading = true;
      })
      .addCase(updateGuestDetails.rejected, (state) => {
        state.isGuestUpdate = false;
        state.guestLoading = false;
      })
      .addCase(updateGuestDetails.fulfilled, (state, action) => {
        state.isGuestUpdate = true;
        state.guestLoading = false;
      })
      .addCase(updateGuestContactDetails.pending, (state) => {
        state.isGuestUpdate = false;
        state.guestLoading = true;
      })
      .addCase(updateGuestContactDetails.rejected, (state) => {
        state.isGuestUpdate = false;
        state.guestLoading = false;
      })
      .addCase(updateGuestContactDetails.fulfilled, (state, action) => {
        state.isGuestUpdate = true;
        state.guestLoading = false;
      })
      .addCase(updateGuestDocumentDetails.pending, (state) => {
        state.isGuestUpdate = false;
        state.guestLoading = true;
      })
      .addCase(updateGuestDocumentDetails.rejected, (state) => {
        state.isGuestUpdate = false;
        state.guestLoading = false;
      })
      .addCase(updateGuestDocumentDetails.fulfilled, (state, action) => {
        state.isGuestUpdate = true;
        state.guestLoading = false;
      })
      .addCase(deleteGuest.pending, (state) => {
        state.guestLoading = true;
        state.isGuestUpdate = false;
      })
      .addCase(deleteGuest.rejected, (state) => {
        state.guestLoading = false;
        state.isGuestUpdate = false;
      })
      .addCase(deleteGuest.fulfilled, (state, action) => {
        const uuidsToDelete = Array.isArray(action.payload)
          ? action.payload
          : [];
        state.activeGuestList = state.activeGuestList?.filter(
          (user) => !uuidsToDelete.includes(user.id)
        );
        state.guestLoading = false;
        state.isGuestUpdate = true;
      })
      .addCase(deleteGuestContact.pending, (state) => {
        state.guestLoading = true;
        state.isGuestUpdate = false;
      })
      .addCase(deleteGuestContact.rejected, (state) => {
        state.guestLoading = false;
        state.isGuestUpdate = false;
      })
      .addCase(deleteGuestContact.fulfilled, (state, action) => {
        state.guestLoading = false;
        state.isGuestUpdate = true;
      })
      .addCase(deleteGuestDocument.pending, (state) => {
        state.guestLoading = true;
        state.isGuestUpdate = false;
      })
      .addCase(deleteGuestDocument.rejected, (state) => {
        state.guestLoading = false;
        state.isGuestUpdate = false;
      })
      .addCase(deleteGuestDocument.fulfilled, (state, action) => {
        state.guestLoading = false;
        state.isGuestUpdate = true;
      });
  },
});

export const { setIsGuestUpdate, setIsGuestDetailsData } = guestSlice.actions;

export default guestSlice.reducer;
