import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const API_URL = "http://api.favorit-parts.ru/hs/hsprice/";

const fetchParts = async (params) => {
  const query = new URLSearchParams({
    key: import.meta.env.VITE_API_KEY,
    ...params,
  });

  const response = await fetch(`${API_URL}?${query}`);
  const data = await response.json().catch(() => null);

  if (data?.error) {
    const message = Array.isArray(data.error)
      ? data.error.join(", ")
      : String(data.error);

    if (message.includes("Request quota exceeded!")) {
      throw new Error("Превышен лимит запросов к API.");
    }

    throw new Error(message);
  }

  if (!response.ok) {
    throw new Error(`Ошибка HTTP: ${response.status}`);
  }

  if (!Array.isArray(data?.goods)) {
    throw new Error("Некорректный ответ API");
  }

  return data.goods;
};

export const fetchManufacturers = createAsyncThunk(
  "search/fetchManufacturers",
  async (number, { rejectWithValue }) => {
    try {
      const goods = await fetchParts({ number });

      return [
        ...new Set(goods.map((item) => item.brand?.trim()).filter(Boolean)),
      ];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchAnalogues = createAsyncThunk(
  "search/fetchAnalogues",
  async ({ number, brand }, { rejectWithValue }) => {
    try {
      const goods = await fetchParts({
        number,
        brand,
        analogues: "on",
      });

      return goods.flatMap((item) => [
        { ...item, isAnalogue: false },
        ...(Array.isArray(item.analogues)
          ? item.analogues.map((analogue) => ({
              ...analogue,
              isAnalogue: true,
            }))
          : []),
      ]);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const initialState = {
  manufacturers: [],
  loading: false,
  error: null,
  manufacturerRequestId: null,

  selectedBrand: null,
  analogues: [],
  analoguesLoading: false,
  analoguesError: null,
  analogueRequestId: null,
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchManufacturers.pending, (state, action) => {
        state.manufacturerRequestId = action.meta.requestId;
        state.loading = true;
        state.error = null;
        state.manufacturers = [];

        state.selectedBrand = null;
        state.analogues = [];
        state.analoguesLoading = false;
        state.analoguesError = null;
        state.analogueRequestId = null;
      })

      .addCase(fetchManufacturers.fulfilled, (state, action) => {
        if (state.manufacturerRequestId !== action.meta.requestId) {
          return;
        }

        state.loading = false;
        state.manufacturers = action.payload;
        state.manufacturerRequestId = null;
      })

      .addCase(fetchManufacturers.rejected, (state, action) => {
        if (state.manufacturerRequestId !== action.meta.requestId) {
          return;
        }

        state.loading = false;
        state.error = action.payload || "Ошибка поиска";
        state.manufacturerRequestId = null;
      })

      .addCase(fetchAnalogues.pending, (state, action) => {
        state.analogueRequestId = action.meta.requestId;
        state.analoguesLoading = true;
        state.analoguesError = null;
        state.analogues = [];
        state.selectedBrand = action.meta.arg.brand;
      })

      .addCase(fetchAnalogues.fulfilled, (state, action) => {
        if (state.analogueRequestId !== action.meta.requestId) {
          return;
        }

        state.analoguesLoading = false;
        state.analogues = action.payload;
        state.analogueRequestId = null;
      })

      .addCase(fetchAnalogues.rejected, (state, action) => {
        if (state.analogueRequestId !== action.meta.requestId) {
          return;
        }

        state.analoguesLoading = false;
        state.analoguesError = action.payload || "Ошибка получения аналогов";
        state.analogueRequestId = null;
      });
  },
});

export default searchSlice.reducer;
