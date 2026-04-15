import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import DashboardPage from "./pages/DashboardPage";
import PlannerPage from "./pages/PlannerPage";
import ProfilePage from "./pages/ProfilePage";
import SearchPage from "./pages/SearchPage";
import InfoPage from "./pages/InfoPage";
import QuickPage from "./pages/QuickPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    path: "/verify-email",
    Component: VerifyEmailPage,
  },
  {
    path: "/dashboard",
    Component: DashboardPage,
  },
  {
    path: "/planner",
    Component: PlannerPage,
  },
  {
    path: "/profile",
    Component: ProfilePage,
  },
  {
    path: "/search",
    Component: SearchPage,
  },
  {
    path: "/info",
    Component: InfoPage,
  },
  {
    path: "/quick",
    Component: QuickPage,
  },
]);
