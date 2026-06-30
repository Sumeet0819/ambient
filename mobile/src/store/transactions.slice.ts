import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../lib/api';

export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  currency: string;
  merchant: string;
  payment_method: string;
  notes: string;
  transaction_date: string;
  created_at: string;
  category_id?: string;
  categories?: {
    name: string;
    icon: string;
    color: string;
  };
}

interface TransactionsState {
  items: Transaction[];
  loading: boolean;
  error: string | null;
}

const initialState: TransactionsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async (params: { month?: string; page?: number; limit?: number } = {}) => {
    const { month, page = 1, limit = 20 } = params;
    let url = `/transactions?page=${page}&limit=${limit}`;
    if (month) {
      url += `&month=${month}`;
    }
    const response = await api.get(url);
    return response.data.data as Transaction[];
  }
);

export const resetTransactions = createAsyncThunk(
  'transactions/resetTransactions',
  async () => {
    await api.delete('/transactions/reset');
    return []; // Return empty array to clear local state
  }
);

export const uploadReceiptOCR = createAsyncThunk(
  'transactions/uploadReceiptOCR',
  async (params: { imageBase64: string; mimeType: string }) => {
    const response = await api.post('/transactions/ocr', params);
    return response.data.data as Transaction[];
  }
);

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    clearTransactions: (state) => {
      state.items = [];
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action: PayloadAction<Transaction[]>) => {
        state.loading = false;
        state.items = action.payload; // For pagination we might want to append, but keeping it simple for now
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch transactions';
      })
      // Reset Transactions
      .addCase(resetTransactions.pending, (state) => {
        state.loading = true;
      })
      .addCase(resetTransactions.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
      })
      .addCase(resetTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to reset transactions';
      })
      // Upload Receipt OCR
      .addCase(uploadReceiptOCR.pending, (state) => {
        state.loading = true;
      })
      .addCase(uploadReceiptOCR.fulfilled, (state, action) => {
        state.loading = false;
        // Prepend new transactions to the top of the list
        state.items = [...action.payload, ...state.items];
      })
      .addCase(uploadReceiptOCR.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to process receipt image';
      });
  },
});

export const { clearTransactions } = transactionsSlice.actions;
export default transactionsSlice.reducer;
