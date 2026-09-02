import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { hospitalService } from '../../services/hospitalService';

export const fetchHospitalDashboard = createAsyncThunk('hospital/fetchDashboard', async (hospitalId, { rejectWithValue }) => {
  try {
    return await hospitalService.getDashboard(hospitalId);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchInventory = createAsyncThunk('hospital/fetchInventory', async (hospitalId, { rejectWithValue }) => {
  try {
    return await hospitalService.getInventory(hospitalId);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const addMedicineItem = createAsyncThunk('hospital/addMedicine', async (medicineData, { rejectWithValue }) => {
  try {
    return await hospitalService.addMedicine(medicineData);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const updateMedicineItem = createAsyncThunk('hospital/updateMedicine', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await hospitalService.updateMedicine(id, data);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const deleteMedicineItem = createAsyncThunk('hospital/deleteMedicine', async (id, { rejectWithValue }) => {
  try {
    await hospitalService.deleteMedicine(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchMarketplace = createAsyncThunk('hospital/fetchMarketplace', async ({ hospitalId, filters }, { rejectWithValue }) => {
  try {
    return await hospitalService.getMarketplace(hospitalId, filters);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchSalesHistory = createAsyncThunk('hospital/fetchSalesHistory', async (hospitalId, { rejectWithValue }) => {
  try {
    return await hospitalService.getSalesHistory(hospitalId);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchPurchasesHistory = createAsyncThunk('hospital/fetchPurchasesHistory', async (hospitalId, { rejectWithValue }) => {
  try {
    return await hospitalService.getPurchasesHistory(hospitalId);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchPaymentHistory = createAsyncThunk('hospital/fetchPaymentHistory', async (_, { rejectWithValue }) => {
  try {
    return await hospitalService.getPaymentHistory();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const submitHospitalFeedback = createAsyncThunk('hospital/submitFeedback', async (data, { rejectWithValue }) => {
  try {
    return await hospitalService.submitFeedback(data);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchHospitalFeedbacks = createAsyncThunk('hospital/fetchFeedbacks', async (hospitalId, { rejectWithValue }) => {
  try {
    return await hospitalService.getFeedbacks(hospitalId);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const hospitalSlice = createSlice({
  name: 'hospital',
  initialState: {
    dashboardData: null,
    inventory: [],
    marketplace: [],
    salesHistory: [],
    purchasesHistory: [],
    payments: [],
    feedbacks: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearHospitalError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Dashboard
      .addCase(fetchHospitalDashboard.pending, (state) => { state.isLoading = true; })
      .addCase(fetchHospitalDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardData = action.payload;
      })
      .addCase(fetchHospitalDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Inventory
      .addCase(fetchInventory.pending, (state) => { state.isLoading = true; })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.inventory = action.payload;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Add Medicine
      .addCase(addMedicineItem.fulfilled, (state, action) => {
        state.inventory.unshift(action.payload);
      })

      // Update Medicine
      .addCase(updateMedicineItem.fulfilled, (state, action) => {
        const index = state.inventory.findIndex((m) => m.id === action.payload.id);
        if (index !== -1) state.inventory[index] = action.payload;
      })

      // Delete Medicine
      .addCase(deleteMedicineItem.fulfilled, (state, action) => {
        state.inventory = state.inventory.filter((m) => m.id !== action.payload);
      })

      // Marketplace
      .addCase(fetchMarketplace.pending, (state) => { state.isLoading = true; })
      .addCase(fetchMarketplace.fulfilled, (state, action) => {
        state.isLoading = false;
        state.marketplace = action.payload;
      })
      .addCase(fetchMarketplace.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Sales & Purchases
      .addCase(fetchSalesHistory.fulfilled, (state, action) => {
        state.salesHistory = action.payload;
      })
      .addCase(fetchPurchasesHistory.fulfilled, (state, action) => {
        state.purchasesHistory = action.payload;
      })

      // Payments
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.payments = action.payload;
      })

      // Feedback
      .addCase(fetchHospitalFeedbacks.fulfilled, (state, action) => {
        state.feedbacks = action.payload;
      })
      .addCase(submitHospitalFeedback.fulfilled, (state, action) => {
        state.feedbacks.unshift(action.payload);
      });
  }
});

export const { clearHospitalError } = hospitalSlice.actions;
export default hospitalSlice.reducer;
