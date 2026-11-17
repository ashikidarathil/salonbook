import { createSlice } from '@reduxjs/toolkit';
import { ownThunkMatchers } from '@/common/utils/ownThunkMatchers';
import * as ownThunks from './branchCategory.thunks';
import type { BranchCategoryState } from './branchCategory.types';
import {
  fetchBranchCategories,
  toggleBranchCategory,
  fetchBranchCategoriesPaginated,
} from './branchCategory.thunks';

const own = ownThunkMatchers(ownThunks);
const initialState: BranchCategoryState = {
  categories: [],
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

const branchCategorySlice = createSlice({
  name: 'branchCategory',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBranchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(fetchBranchCategoriesPaginated.fulfilled, (state, action) => {
        state.categories = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(toggleBranchCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex((c) => c.categoryId === action.payload.categoryId);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      .addMatcher(own.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addMatcher(own.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Something went wrong';
      })
      .addMatcher(own.fulfilled, (state) => {
        state.loading = false;
      });
  },
});

export const { clearError } = branchCategorySlice.actions;
export default branchCategorySlice.reducer;
