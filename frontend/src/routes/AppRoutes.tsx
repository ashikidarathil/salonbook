import { Routes, Route } from 'react-router-dom';
import { APP_ROUTES } from '@/common/constants/app.routes';

// Public Pages
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import VerifyOtpPage from '../pages/auth/VerifyOtpPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import VerifyPhoneOtpPage from '@/pages/auth/VerifyPhoneOtpPage';
import VerifyResetOtpPage from '@/pages/auth/VerifyResetOtpPage';
import NewPasswordPage from '@/pages/auth/NewPasswordPage';
import BranchesListingPage from '@/pages/user/BranchesListingPage';
import ServicesListingPage from '@/pages/user/ServicesListingPage';
import ServiceDetailsPage from '@/pages/user/service/ServiceDetailsPage';
import StylistsListingPage from '@/pages/user/stylist/StylistsListingPage';
import StylistDetailsPage from '@/pages/user/stylist/StylistDetailsPage';
import CartPage from '@/pages/user/CartPage';
import CheckoutPage from '@/pages/user/CheckoutPage';
import BookingsPage from '@/pages/user/BookingsPage';
import BookingDetailPage from '@/pages/user/BookingDetailPage';
import WalletPage from '@/pages/user/WalletPage';
import PaymentSuccessPage from '@/pages/user/PaymentSuccessPage';
import PaymentFailurePage from '@/pages/user/PaymentFailurePage';
import NotFoundPage from '@/pages/error/NotFoundPage';
import { RoleNotFound } from '@/components/common/RoleNotFound';

// Admin Pages
import AdminLoginPage from '@/pages/admin/AdminLogin';
import StylistManagementPage from '@/pages/admin/stylist/StylistManagementPage';
import StylistInvitePage from '@/pages/admin/stylist/StylistInvitePage';
import StylistDetailPage from '@/pages/admin/stylist/StylistDetailPage';
import SlotManagementPage from '@/pages/admin/SlotManagementPage';
import UserManagementPage from '@/pages/admin/user/UserManagementPage';
import CategoriesPage from '@/pages/admin/CategoriesPage';
import DayAdjustmentPage from '@/pages/shared/schedule/DayAdjustmentPage';
import BreakFormPage from '@/pages/shared/schedule/BreakFormPage';
import SpecialSlotFormPage from '@/pages/shared/schedule/SpecialSlotFormPage';
import CategoryFormPage from '@/pages/admin/CategoryFormPage';
import ServicesPage from '@/pages/admin/ServicesPage';
import ServiceFormPage from '@/pages/admin/ServiceFormPage';
import BranchesPage from '@/pages/admin/branch/BranchesPage';
import BranchFormPage from '@/pages/admin/branch/BranchFormPage';
import BranchBreaksPage from '@/pages/admin/branch/BranchBreaksPage';
import OffDayManagementPage from '@/pages/admin/stylist/OffDayManagementPage';
import DashboardContent from '@/pages/admin/DashboardContent';
import AdminBookingsPage from '@/pages/admin/AdminBookingsPage';
import AdminBookingDetailPage from '@/pages/admin/AdminBookingDetailPage';
import CouponManagementPage from '@/pages/admin/CouponManagementPage';
import CouponFormPage from '@/pages/admin/CouponFormPage';
import AdminChatPage from '@/pages/admin/AdminChatPage';

import HolidayManagementPage from '@/pages/admin/holiday/HolidayManagementPage';
import HolidayFormPage from '@/pages/admin/holiday/HolidayFormPage';
import BranchStylistsPage from '@/pages/admin/branch/BranchStylistsPage';
import BranchCategoriesPage from '@/pages/admin/branch/BranchCategoriesPage';
import BranchServicesPage from '@/pages/admin/branch/BranchServicesPage';

// Stylist Pages
import AcceptInvitePage from '@/pages/stylist/AcceptInvitePage';
import StylistLoginPage from '@/pages/stylist/StylistLoginPage';
import StylistDashboard from '@/pages/stylist/StylistDashboard';
import StylistProfilePage from '@/pages/stylist/StylistProfilePage';
import StylistSchedulePage from '@/pages/stylist/StylistSchedulePage';
import OffDayPage from '@/pages/stylist/OffDayPage';
import StylistSlotManagementPage from '@/pages/stylist/StylistSlotManagementPage';
import StylistAppointmentsPage from '@/pages/stylist/StylistAppointmentsPage';
import StylistBookingDetailPage from '@/pages/stylist/StylistBookingDetailPage';
import StylistWalletPage from '@/pages/stylist/StylistWalletPage';
import StylistReviewsPage from '../pages/stylist/StylistReviewsPage';
import AdminWalletPage from '@/pages/admin/AdminWalletPage';
import AdminReviewsPage from '../pages/admin/AdminReviewsPage';

// Layouts
import { SalonAdminLayout } from '@/layouts/admin/SalonAdminLayout';
import { StylistLayout } from '@/layouts/stylist/StylistLayout';
import ProfileLayout from '@/layouts/userProfile/ProfileLayout';

// User Pages
import HomePage from '@/pages/user/HomePage';
import ContactPage from '@/pages/user/ContactPage';
import ProfileContent from '@/pages/user/ProfileContent';
import FavoritesPage from '@/pages/user/FavoritesPage';
import NotificationsPage from '@/features/notification/pages/NotificationsPage';
import UserChatPage from '@/pages/user/UserChatPage';

// HOC
import ProtectedRoute from '@/hoc/ProtectedRoute';

// Shared Pages
import ChatPage from '@/pages/shared/ChatPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/branches" element={<BranchesListingPage />} />
      <Route path="/services" element={<ServicesListingPage />} />
      <Route path="/branches/:branchId/services/:serviceId" element={<ServiceDetailsPage />} />
      <Route path={APP_ROUTES.PUBLIC.SIGNUP} element={<SignupPage />} />
      <Route path={APP_ROUTES.PUBLIC.VERIFY_OTP} element={<VerifyOtpPage />} />
      <Route path={APP_ROUTES.PUBLIC.LOGIN} element={<LoginPage />} />
      <Route path={APP_ROUTES.PUBLIC.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
      <Route path={APP_ROUTES.PUBLIC.VERIFY_PHONE_OTP} element={<VerifyPhoneOtpPage />} />
      <Route path={APP_ROUTES.PUBLIC.HOME} element={<HomePage />} />
      <Route path={APP_ROUTES.PUBLIC.CONTACT} element={<ContactPage />} />
      <Route path={APP_ROUTES.PUBLIC.VERIFY_RESET_OTP} element={<VerifyResetOtpPage />} />
      <Route path={APP_ROUTES.PUBLIC.NEW_PASSWORD} element={<NewPasswordPage />} />
      <Route path={APP_ROUTES.USER.STYLISTS} element={<StylistsListingPage />} />
      <Route path={APP_ROUTES.USER.STYLIST_DETAILS} element={<StylistDetailsPage />} />
      <Route path="/cart" element={<CartPage />} />

      {/* Admin Login */}
      <Route path={APP_ROUTES.ADMIN.LOGIN} element={<AdminLoginPage />} />

      {/* Stylist Invite Flow */}
      <Route path={APP_ROUTES.STYLIST.INVITE} element={<AcceptInvitePage />} />
      <Route path={APP_ROUTES.STYLIST.LOGIN} element={<StylistLoginPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute roles={['USER']} />}>
        <Route path={APP_ROUTES.USER.CART} element={<CartPage />} />
        <Route path={APP_ROUTES.USER.CHECKOUT} element={<CheckoutPage />} />
        <Route path="/payment/success/:bookingId" element={<PaymentSuccessPage />} />
        <Route path="/payment/failure/:bookingId" element={<PaymentFailurePage />} />
        <Route path="/chat" element={<UserChatPage />} />
        <Route path={APP_ROUTES.USER.PROFILE} element={<ProfileLayout />}>
          <Route index element={<ProfileContent />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />
          <Route path="wallet" element={<WalletPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route path={APP_ROUTES.ADMIN.DASHBOARD} element={<SalonAdminLayout />}>
          <Route index element={<DashboardContent />} />
          <Route path="stylists" element={<StylistManagementPage />} />
          <Route path="stylists/invite" element={<StylistInvitePage />} />
          <Route path="stylists/:id" element={<StylistDetailPage />} />
          <Route path="stylists/:id/schedule/day/:date" element={<DayAdjustmentPage />} />
          <Route path="stylists/:id/schedule/breaks/new" element={<BreakFormPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="categories/new" element={<CategoryFormPage />} />
          <Route path="categories/:id/edit" element={<CategoryFormPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="services/new" element={<ServiceFormPage />} />
          <Route path="services/:id/edit" element={<ServiceFormPage />} />
          <Route path="branches" element={<BranchesPage />} />
          <Route path="branches/new" element={<BranchFormPage />} />
          <Route path="branches/:id/edit" element={<BranchFormPage />} />
          <Route path="branches/:branchId/breaks" element={<BranchBreaksPage />} />
          <Route path="branches/:branchId/stylists" element={<BranchStylistsPage />} />
          <Route path="branches/:branchId/categories" element={<BranchCategoriesPage />} />
          <Route path="branches/:branchId/services" element={<BranchServicesPage />} />
          <Route path="slots" element={<SlotManagementPage />} />
          <Route path="slots/special/new" element={<SpecialSlotFormPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="bookings/:id" element={<AdminBookingDetailPage />} />
          <Route path="off-days" element={<OffDayManagementPage />} />
          <Route path="holidays" element={<HolidayManagementPage />} />
          <Route path="holidays/new" element={<HolidayFormPage />} />
          <Route path="coupons" element={<CouponManagementPage />} />
          <Route path="coupons/new" element={<CouponFormPage />} />
          <Route path="coupons/:id/edit" element={<CouponFormPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="chat" element={<AdminChatPage />} />
          <Route path="wallet" element={<AdminWalletPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="*" element={<RoleNotFound role="ADMIN" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['STYLIST']} />}>
        <Route path={APP_ROUTES.STYLIST.DASHBOARD} element={<StylistLayout />}>
          <Route index element={<StylistDashboard />} />
          <Route path="profile" element={<StylistProfilePage />} />
          <Route path="schedule" element={<StylistSchedulePage />} />
          <Route path="schedule/day/:date" element={<DayAdjustmentPage />} />
          <Route path="schedule/breaks/new" element={<BreakFormPage />} />
          <Route path="slots" element={<StylistSlotManagementPage />} />
          <Route path="slots/special/new" element={<SpecialSlotFormPage />} />
          <Route path="off-days" element={<OffDayPage />} />
          <Route path="appointments" element={<StylistAppointmentsPage />} />
          <Route path="appointments/:id" element={<StylistBookingDetailPage />} />
          <Route path="wallet" element={<StylistWalletPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="reviews" element={<StylistReviewsPage />} />
          <Route path="*" element={<RoleNotFound role="STYLIST" />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
