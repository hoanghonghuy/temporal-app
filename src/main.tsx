import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/contexts/I18nContext";
import { RouteFallback } from "@/components/RouteFallback";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { MainLayout } from "@/components/MainLayout";
import "./globals.css";

const CalendarPage = lazy(async () => {
  const module = await import("./pages/CalendarPage");
  return { default: module.CalendarPage };
});

const ToolsPage = lazy(async () => {
  const module = await import("./pages/ToolsPage");
  return { default: module.ToolsPage };
});

const IChingPage = lazy(async () => {
  const module = await import("./pages/IChingPage");
  return { default: module.IChingPage };
});

const AccountPage = lazy(async () => {
  const module = await import("./pages/AccountPage");
  return { default: module.AccountPage };
});

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <MainLayout />,
      errorElement: <RouteErrorBoundary />,
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
          path: "tools/:toolSlug",
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
        {
          path: "account",
          element: (
            <Suspense fallback={<RouteFallback />}>
              <AccountPage />
            </Suspense>
          ),
        },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <I18nProvider>
        <RouterProvider router={router} />
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>
);
