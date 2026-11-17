import { createSlice } from '@reduxjs/toolkit';
import { ownThunkMatchers } from '@/common/utils/ownThunkMatchers';
import * as ownThunks from './categoryThunks';
import type { CategoryState } from './category.types';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  softDeleteCategory,
  restoreCategory,
  fetchPaginatedCategories,
  fetchPublicCategories,
} from './categoryThunks';

const own = ownThunkMatchers(ownThunks);
const initialState: CategoryState = {
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

const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaginatedCategories.fulfilled, (state, action) => {
        state.categories = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.categories = state.categories.map((c) =>
          c.id === action.payload.id ? action.payload : c,
        );
      })
      .addCase(toggleCategoryStatus.fulfilled, (state, action) => {
        state.categories = state.categories.map((c) =>
          c.id === action.payload.id ? { ...c, status: action.payload.status } : c,
        );
      })
      .addCase(softDeleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.map((c) =>
          c.id === action.payload ? { ...c, isDeleted: true, status: 'INACTIVE' } : c,
        );
      })
      .addCase(restoreCategory.fulfilled, (state, action) => {
        state.categories = state.categories.map((c) =>
          c.id === action.payload ? { ...c, isDeleted: false, status: 'ACTIVE' } : c,
        );
      })
      .addCase(fetchPublicCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
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

export const { clearError } = categorySlice.actions;
export default categorySlice.reducer;
