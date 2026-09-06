import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { hospitalService } from '../../services/hospitalService';

export const fetchOutgoingRequests = createAsyncThunk('requests/fetchOutgoing', async (hospitalId, { rejectWithValue }) => {
  try {
    return await hospitalService.getOutgoingRequests(hospitalId);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchIncomingRequests = createAsyncThunk('requests/fetchIncoming', async (hospitalId, { rejectWithValue }) => {
  try {
    return await hospitalService.getIncomingRequests(hospitalId);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createNewRequest = createAsyncThunk('requests/createRequest', async (reqData, { rejectWithValue }) => {
  try {
    return await hospitalService.createRequest(reqData);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const respondToRequest = createAsyncThunk('requests/respond', async ({ requestId, action, reason, hospitalId }, { rejectWithValue }) => {
  try {
    return await hospitalService.handleRequest(requestId, action, reason, hospitalId);
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const payForRequest = createAsyncThunk('requests/pay', async ({ requestId, paymentMethod }, { rejectWithValue }) => {
  try {
    return await hospitalService.processPayment({ requestId, paymentMethod });
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const requestSlice = createSlice({
  name: 'requests',
  initialState: {
    outgoingRequests: [],
    incomingRequests: [],
    isProcessingPayment: false,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearRequestError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Outgoing
      .addCase(fetchOutgoingRequests.pending, (state) => { state.isLoading = true; })
      .addCase(fetchOutgoingRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.outgoingRequests = action.payload;
      })
      .addCase(fetchOutgoingRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Incoming
      .addCase(fetchIncomingRequests.pending, (state) => { state.isLoading = true; })
      .addCase(fetchIncomingRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.incomingRequests = action.payload;
      })
      .addCase(fetchIncomingRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Create Request
      .addCase(createNewRequest.fulfilled, (state, action) => {
        state.outgoingRequests.unshift(action.payload);
      })

      // Respond (Accept/Reject)
      .addCase(respondToRequest.fulfilled, (state, action) => {
        const idxIn = state.incomingRequests.findIndex((r) => r.id === action.payload.id);
        if (idxIn !== -1) state.incomingRequests[idxIn] = action.payload;

        const idxOut = state.outgoingRequests.findIndex((r) => r.id === action.payload.id);
        if (idxOut !== -1) state.outgoingRequests[idxOut] = action.payload;
      })

      // Pay
      .addCase(payForRequest.pending, (state) => {
        state.isProcessingPayment = true;
      })
      .addCase(payForRequest.fulfilled, (state, action) => {
        state.isProcessingPayment = false;
        const updatedReq = action.payload.request;
        const idx = state.outgoingRequests.findIndex((r) => r.id === updatedReq.id);
        if (idx !== -1) state.outgoingRequests[idx] = updatedReq;
      })
      .addCase(payForRequest.rejected, (state, action) => {
        state.isProcessingPayment = false;
        state.error = action.payload;
      });
  }
});

export const { clearRequestError } = requestSlice.actions;
export default requestSlice.reducer;
