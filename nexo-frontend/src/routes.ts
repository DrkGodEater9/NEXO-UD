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
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ManageAnnouncementsPage from "./pages/ManageAnnouncementsPage";
import ManageWelfarePage from "./pages/ManageWelfarePage";
import ManageCampusPage from "./pages/ManageCampusPage";
import ManagePage from "./pages/ManagePage";
import ManageCalendarPage from "./pages/ManageCalendarPage";

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
  {
    path: "/admin",
    Component: AdminDashboardPage,
  },
  {
    path: "/manage",
    Component: ManagePage,
  },
  {
    path: "/manage/announcements",
    Component: ManageAnnouncementsPage,
  },
  {
    path: "/manage/welfare",
    Component: ManageWelfarePage,
  },
  {
    path: "/manage/campus",
    Component: ManageCampusPage,
  },
  {
    path: "/manage/calendar",
    Component: ManageCalendarPage,
  },
]);
