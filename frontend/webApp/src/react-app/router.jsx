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
import { ObjectsPage } from './pages/ObjectsPage/ObjectsPage.jsx';

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
    ],
  },
]);
