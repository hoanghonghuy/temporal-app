import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider"; // NEW: Import ThemeProvider
import { RouteFallback } from "@/components/RouteFallback";
import './globals.css'

import { MainLayout } from './components/MainLayout';

const CalendarPage = lazy(async () => {
  const module = await import('./pages/CalendarPage');
  return { default: module.CalendarPage };
});

const ToolsPage = lazy(async () => {
  const module = await import('./pages/ToolsPage');
  return { default: module.ToolsPage };
});

const IChingPage = lazy(async () => {
  const module = await import('./pages/IChingPage');
  return { default: module.IChingPage };
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteFallback />}>
            <CalendarPage />
          </Suspense>
        ),
      },
      {
        path: "tools",
        element: (
          <Suspense fallback={<RouteFallback />}>
            <ToolsPage />
          </Suspense>
        ),
      },
      {
        path: "iching",
        element: (
          <Suspense fallback={<RouteFallback />}>
            <IChingPage />
          </Suspense>
        ),
      },
    ],
  },
], {
  // basename: "/temporal-app/"
  basename: import.meta.env.BASE_URL
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* NEW: Bọc toàn bộ ứng dụng trong ThemeProvider */}
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
)