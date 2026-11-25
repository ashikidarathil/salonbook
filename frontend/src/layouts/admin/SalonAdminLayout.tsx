'use client';

import { useState } from 'react';
import { RouteBreadcrumbs } from '@/components/common/RouteBreadcrumbs';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Icon } from '@iconify/react';
import { useAppDispatch } from '@/app/hooks';
import { logout } from '@/features/auth/authThunks';
import { APP_ROUTES } from '@/common/constants/app.routes';
import { NotificationCenter } from '@/features/notification/components/NotificationCenter';

const NAV_ITEMS = [
  { icon: 'solar:widget-bold', label: 'Dashboard', path: '/admin' },
  { icon: 'solar:calendar-bold', label: 'Bookings', path: '/admin/bookings' },
  { icon: 'solar:users-group-rounded-bold', label: 'Customers', path: '/admin/users' },
  { icon: 'solar:user-bold', label: 'Stylists', path: '/admin/stylists' },
  { icon: 'solar:folder-bold', label: 'Categories', path: APP_ROUTES.ADMIN.CATEGORIES },
  { icon: 'solar:scissors-square-bold', label: 'Services', path: APP_ROUTES.ADMIN.SERVICES },
  { icon: 'solar:buildings-bold', label: 'Branches', path: APP_ROUTES.ADMIN.BRANCHES },
  { icon: 'solar:calendar-date-bold', label: 'Slots', path: APP_ROUTES.ADMIN.SLOTS },
  {
    icon: 'solar:calendar-minimalistic-broken',
    label: 'Holidays',
    path: APP_ROUTES.ADMIN.HOLIDAYS,
  },
  { icon: 'solar:ticket-bold', label: 'Coupons', path: APP_ROUTES.ADMIN.COUPONS },
  { icon: 'solar:chat-round-bold', label: 'Dispute Chats', path: APP_ROUTES.ADMIN.CHAT },
  { icon: 'solar:star-bold', label: 'Reviews', path: APP_ROUTES.ADMIN.REVIEWS },
  { icon: 'solar:wallet-bold', label: 'Platform Wallet', path: '/admin/wallet' },
  { icon: 'solar:bell-bold', label: 'Notifications', path: '/admin/notifications' },
];

function AdminSidebarContent({
  pathname,
  onNavigate,
  onLogout,
}: {
  pathname: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}) {
  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex items-center justify-center rounded-lg size-8 bg-primary">
            <Icon icon="solar:scissors-bold" className="size-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">Salon Admin</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.path === '/admin'
                ? pathname === item.path
                : pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => onNavigate(item.path)}
                  className={
                    isActive
                      ? 'relative min-h-10 bg-primary/10 font-semibold text-primary before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-primary hover:bg-primary/10'
                      : 'min-h-10 hover:bg-accent/50'
                  }
                >
                  <Icon icon={item.icon} className="size-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onLogout}
              className="min-h-10 text-destructive hover:bg-destructive/10"
            >
              <Icon icon="solar:logout-bold" className="size-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}

export function SalonAdminLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    setIsMobileOpen(false);
    await dispatch(logout());
    navigate('/admin/login', { replace: true });
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen theme-admin">
      <SidebarProvider>
        <Sidebar className="border-r">
          <AdminSidebarContent
            pathname={pathname}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
            <div className="flex items-center gap-4">
              <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild>
                  <Button size="icon" variant="ghost" className="md:hidden" aria-label="Open menu">
                    <Icon icon="solar:hamburger-menu-linear" className="size-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-72 p-0 theme-admin"
                  onOpenAutoFocus={(event) => event.preventDefault()}
                >
                  <SheetHeader className="sr-only">
                    <SheetTitle>Admin Navigation</SheetTitle>
                    <SheetDescription>Admin panel navigation and menu</SheetDescription>
                  </SheetHeader>
                  <div className="flex h-full flex-col overflow-y-auto bg-[var(--color-sidebar)]">
                    <AdminSidebarContent
                      pathname={pathname}
                      onNavigate={handleNavigate}
                      onLogout={handleLogout}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <div className="flex items-center gap-4">
              {/* Phones: quick way back to the dashboard */}
              <Link to="/admin" aria-label="Go to dashboard" className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary md:hidden">
                <Icon icon="solar:home-2-bold-duotone" className="size-6" />
              </Link>
              <NotificationCenter />
              <Avatar>
                <AvatarImage src="https://randomuser.me/api/portraits/women/34.jpg" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-auto bg-muted/40 p-4 lg:p-6">
            <RouteBreadcrumbs className="mb-4" />
            <Outlet /> {/* Child pages render here */}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
