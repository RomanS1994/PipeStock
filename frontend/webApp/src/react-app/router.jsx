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
import { ObjectDetailPage } from './pages/ObjectDetailPage/ObjectDetailPage.jsx';
import { ObjectsPage } from './pages/ObjectsPage/ObjectsPage.jsx';
import { OrderDetailPage } from './pages/OrderDetailPage/OrderDetailPage.jsx';
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
      { path: 'objects', element: <ProtectedRoute><ObjectsPage /></ProtectedRoute> },
      { path: 'objects/new', element: <ProtectedRoute requireManager><CreateObjectPage /></ProtectedRoute> },
      { path: 'objects/:projectId', element: <ProtectedRoute><ObjectDetailPage /></ProtectedRoute> },
      { path: 'objects/:projectId/orders/new', element: <ProtectedRoute><CreateOrderPage /></ProtectedRoute> },
      { path: 'orders', element: <ProtectedRoute><OrdersPage /></ProtectedRoute> },
      { path: 'orders/:orderId', element: <ProtectedRoute><OrderDetailPage /></ProtectedRoute> },
      { path: 'orders/:orderId/materials/new', element: <ProtectedRoute><AddMaterialPage /></ProtectedRoute> },
      { path: 'profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
    ],
  },
]);
