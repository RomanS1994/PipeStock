import React from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { App } from '@shared/app/App.jsx';
import { ProtectedRoute } from './features/auth/ProtectedRoute.jsx';
import {
  EmployeeRegistrationPage,
  JoinCompanyPage,
  ManagerRegistrationPage,
  RoleSelectionPage,
  SignInPage,
  WelcomePage,
} from './pages/AuthPages/AuthPages.jsx';
import { AddMaterialPage } from './pages/AddMaterialPage/AddMaterialPage.jsx';
import { CreateObjectPage } from './pages/CreateObjectPage/CreateObjectPage.jsx';
import { CreateOrderPage } from './pages/CreateOrderPage/CreateOrderPage.jsx';
import { DashboardPage } from './pages/DashboardPage/DashboardPage.jsx';
import { EmployeesPage } from './pages/EmployeesPage/EmployeesPage.jsx';
import { HistoryPage } from './pages/HistoryPage/HistoryPage.jsx';
import { InviteEmployeePage } from './pages/InviteEmployeePage/InviteEmployeePage.jsx';
import { MaterialCatalogPage } from './pages/MaterialCatalogPage/MaterialCatalogPage.jsx';
import { ObjectDetailPage } from './pages/ObjectDetailPage/ObjectDetailPage.jsx';
import { ObjectsPage } from './pages/ObjectsPage/ObjectsPage.jsx';
import { OrderDetailPage } from './pages/OrderDetailPage/OrderDetailPage.jsx';
import { OrderPdfPreviewPage } from './pages/OrderPdfPreviewPage/OrderPdfPreviewPage.jsx';
import { OrdersPage } from './pages/OrdersPage/OrdersPage.jsx';
import { ProfilePage } from './pages/ProfilePage/ProfilePage.jsx';

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { index: true, element: <WelcomePage /> },
      { path: 'sign-in', element: <SignInPage /> },
      { path: 'role', element: <RoleSelectionPage /> },
      { path: 'register/manager', element: <ManagerRegistrationPage /> },
      { path: 'register/employee', element: <EmployeeRegistrationPage /> },
      { path: 'join-company', element: <ProtectedRoute requireCompany={false}><JoinCompanyPage /></ProtectedRoute> },
      { path: 'dashboard', element: <ProtectedRoute requireManager><DashboardPage /></ProtectedRoute> },
      { path: 'objects', element: <ProtectedRoute><ObjectsPage /></ProtectedRoute> },
      { path: 'objects/new', element: <ProtectedRoute requireManager><CreateObjectPage /></ProtectedRoute> },
      { path: 'objects/:projectId', element: <ProtectedRoute><ObjectDetailPage /></ProtectedRoute> },
      { path: 'objects/:projectId/orders/new', element: <ProtectedRoute><CreateOrderPage /></ProtectedRoute> },
      { path: 'orders', element: <ProtectedRoute><OrdersPage /></ProtectedRoute> },
      { path: 'orders/:orderId', element: <ProtectedRoute><OrderDetailPage /></ProtectedRoute> },
      { path: 'orders/:orderId/pdf', element: <ProtectedRoute><OrderPdfPreviewPage /></ProtectedRoute> },
      { path: 'orders/:orderId/materials/new', element: <ProtectedRoute><AddMaterialPage /></ProtectedRoute> },
      { path: 'materials', element: <ProtectedRoute requireManager><MaterialCatalogPage /></ProtectedRoute> },
      { path: 'employees', element: <ProtectedRoute requireManager><EmployeesPage /></ProtectedRoute> },
      { path: 'employees/invite', element: <ProtectedRoute requireManager><InviteEmployeePage /></ProtectedRoute> },
      { path: 'history', element: <ProtectedRoute><HistoryPage /></ProtectedRoute> },
      { path: 'profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
    ],
  },
]);
