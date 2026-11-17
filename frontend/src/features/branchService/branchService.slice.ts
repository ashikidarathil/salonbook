import { createSlice } from '@reduxjs/toolkit';
import { ownThunkMatchers } from '@/common/utils/ownThunkMatchers';
import * as ownThunks from './branchService.thunks';
import type { BranchServiceState } from './branchService.types';
import {
  fetchBranchServices,
  upsertBranchService,
  toggleBranchServiceStatus,
  fetchBranchServicesPaginated,
  fetchBranchServicePublicDetails,
  fetchBranchServicesPublicPaginated,
} from './branchService.thunks';

const own = ownThunkMatchers(ownThunks);
const initialState: BranchServiceState = {
  services: [],
  loading: false,
  currentService: null,
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

const branchServiceSlice = createSlice({
  name: 'branchService',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBranchServices.fulfilled, (state, action) => {
        state.services = action.payload;
      })
      .addCase(fetchBranchServicesPaginated.fulfilled, (state, action) => {
        state.services = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(upsertBranchService.fulfilled, (state, action) => {
        const index = state.services.findIndex((s) => s.serviceId === action.payload.serviceId);
        if (index !== -1) {
          state.services[index] = action.payload;
        } else {
          state.services.push(action.payload);
        }
      })
      .addCase(toggleBranchServiceStatus.fulfilled, (state, action) => {
        const index = state.services.findIndex((s) => s.serviceId === action.payload.serviceId);
        if (index !== -1) {
          state.services[index] = action.payload;
        }
      })
      .addCase(fetchBranchServicesPublicPaginated.fulfilled, (state, action) => {
        state.services = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchBranchServicePublicDetails.fulfilled, (state, action) => {
        state.currentService = action.payload;
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

export const { clearError } = branchServiceSlice.actions;
export default branchServiceSlice.reducer;
