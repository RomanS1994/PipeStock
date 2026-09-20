import React from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { App } from '@shared/app/App.jsx';
import { GuestRoute, ProtectedRoute } from './features/auth/ProtectedRoute.jsx';
import {
  EmployeeRegistrationPage,
  JoinCompanyPage,
  ManagerRegistrationPage,
  RoleSelectionPage,
  SignInPage,
  WelcomePage,
} from './pages/AuthPages/AuthPages.jsx';
import { CartAwareAddMaterialPage } from './pages/AddMaterialPage/CartAwareAddMaterialPage.jsx';
import { CreateObjectPage } from './pages/CreateObjectPage/CreateObjectPage.jsx';
import { CreateOrderPage } from './pages/CreateOrderPage/CreateOrderPage.jsx';
import { DashboardPage } from './pages/DashboardPage/DashboardPage.jsx';
import { EmployeesPage } from './pages/EmployeesPage/EmployeesPage.jsx';
import { HistoryPage } from './pages/HistoryPage/HistoryPage.jsx';
import { InviteEmployeePage } from './pages/InviteEmployeePage/InviteEmployeePage.jsx';
import { ObjectDetailPage } from './pages/ObjectDetailPage/ObjectDetailPage.jsx';
import { ObjectsPage } from './pages/ObjectsPage/ObjectsPage.jsx';
import { OrderCartPage } from './pages/OrderCartPage/OrderCartPage.jsx';
import { OrderDetailPage } from './pages/OrderDetailPage/OrderDetailPage.jsx';
import { OrderPdfPreviewPage } from './pages/OrderPdfPreviewPage/OrderPdfPreviewPage.jsx';
import { OrdersPage } from './pages/OrdersPage/OrdersPage.jsx';
import { ProfilePage } from './pages/ProfilePage/ProfilePage.jsx';

const routerBasename = import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { index: true, element: <GuestRoute><WelcomePage /></GuestRoute> },
      { path: 'sign-in', element: <GuestRoute><SignInPage /></GuestRoute> },
      { path: 'role', element: <GuestRoute><RoleSelectionPage /></GuestRoute> },
      { path: 'register/manager', element: <GuestRoute><ManagerRegistrationPage /></GuestRoute> },
      { path: 'register/employee', element: <GuestRoute><EmployeeRegistrationPage /></GuestRoute> },
      { path: 'join-company', element: <ProtectedRoute requireCompany={false} requireNoCompany><JoinCompanyPage /></ProtectedRoute> },
      { path: 'dashboard', element: <ProtectedRoute requireManager><DashboardPage /></ProtectedRoute> },
      { path: 'objects', element: <ProtectedRoute><ObjectsPage /></ProtectedRoute> },
      { path: 'objects/new', element: <ProtectedRoute requireManager><CreateObjectPage /></ProtectedRoute> },
      { path: 'objects/:projectId', element: <ProtectedRoute><ObjectDetailPage /></ProtectedRoute> },
      { path: 'objects/:projectId/orders/new', element: <ProtectedRoute><CreateOrderPage /></ProtectedRoute> },
      { path: 'orders', element: <ProtectedRoute><OrdersPage /></ProtectedRoute> },
      { path: 'orders/:orderId', element: <ProtectedRoute><OrderDetailPage /></ProtectedRoute> },
      { path: 'orders/:orderId/cart', element: <ProtectedRoute><OrderCartPage /></ProtectedRoute> },
      { path: 'orders/:orderId/pdf', element: <ProtectedRoute><OrderPdfPreviewPage /></ProtectedRoute> },
      { path: 'orders/:orderId/materials/new', element: <ProtectedRoute><CartAwareAddMaterialPage /></ProtectedRoute> },
      { path: 'employees', element: <ProtectedRoute requireManager><EmployeesPage /></ProtectedRoute> },
      { path: 'employees/invite', element: <ProtectedRoute requireManager><InviteEmployeePage /></ProtectedRoute> },
      { path: 'history', element: <ProtectedRoute requireEmployee><HistoryPage /></ProtectedRoute> },
      { path: 'profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
    ],
  },
], { basename: routerBasename });
