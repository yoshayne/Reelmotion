import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router";
import { ErrorBoundary } from "@/react-app/components/ErrorBoundary";
import { InstallPrompt } from "@/react-app/components/InstallPrompt";
import Navbar from "@/react-app/components/Navbar";
import LandingPage from "@/react-app/pages/Landing";
import BrowsePage from "@/react-app/pages/Browse";
import WatchPage from "@/react-app/pages/Watch";
import AccountPage from "@/react-app/pages/Account";
import SeriesPage from "@/react-app/pages/Series";
import SubscribePage from "@/react-app/pages/Subscribe";
import SubscriptionPage from "@/react-app/pages/Subscription";
import ManageSubscriptionPage from "@/react-app/pages/ManageSubscription";
import BillingSuccessPage from "@/react-app/pages/BillingSuccess";
import AdminDashboard from "@/react-app/pages/admin/AdminDashboard";
import AdminVideos from "@/react-app/pages/admin/AdminVideos";
import AdminVideoForm from "@/react-app/pages/admin/AdminVideoForm";
import AdminSeries from "@/react-app/pages/admin/AdminSeries";
import AdminSeriesForm from "@/react-app/pages/admin/AdminSeriesForm";
import AdminCarousel from "@/react-app/pages/admin/AdminCarousel";
import AdminCarouselForm from "@/react-app/pages/admin/AdminCarouselForm";
import AdminBrandAssets from "@/react-app/pages/admin/AdminBrandAssets";
import AdminSubscribers from "@/react-app/pages/admin/AdminSubscribers";
import AdminAbandonedSignups from "@/react-app/pages/admin/AdminAbandonedSignups";
import AdminContestSubmissions from "@/react-app/pages/admin/AdminContestSubmissions";
import AdminPromoPopups from "@/react-app/pages/admin/AdminPromoPopups";
import MovieInfo from "@/react-app/pages/MovieInfo";
import SeriesInfo from "@/react-app/pages/SeriesInfo";
import Privacy from "@/react-app/pages/Privacy";
import Terms from "@/react-app/pages/Terms";
import DeleteAccount from "@/react-app/pages/DeleteAccount";
import EPK from "@/react-app/pages/EPK";
import Support from "@/react-app/pages/Support";
import Contest from "@/react-app/pages/Contest";
import ContestTerms from "@/react-app/pages/ContestTerms";
import SSOCallback from "@/react-app/pages/SSOCallback";
import CommunityGuidelines from "@/react-app/pages/CommunityGuidelines";
import AdminComments from "@/react-app/pages/admin/AdminComments";

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const hideNav =
    location.pathname === "/" ||
    location.pathname === "/auth-callback" ||
    location.pathname === "/sso-callback" ||
    location.pathname.startsWith("/watch/") ||
    location.pathname === "/account" ||
    location.pathname === "/subscribe";
  return (
    <>
      {!hideNav && <Navbar />}
      {children}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <InstallPrompt />
        <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/subscribe" element={<SubscribePage />} />
          <Route path="/watch/:id" element={<WatchPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/series/:id" element={<SeriesPage />} />
          <Route path="/movie-info/:id" element={<MovieInfo />} />
          <Route path="/series-info/:id" element={<SeriesInfo />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/manage-subscription" element={<ManageSubscriptionPage />} />
          <Route path="/billing/success" element={<BillingSuccessPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/videos" element={<AdminVideos />} />
          <Route path="/admin/videos/new" element={<AdminVideoForm />} />
          <Route path="/admin/videos/:id" element={<AdminVideoForm />} />
          <Route path="/admin/series" element={<AdminSeries />} />
          <Route path="/admin/series/new" element={<AdminSeriesForm />} />
          <Route path="/admin/series/:id" element={<AdminSeriesForm />} />
          <Route path="/admin/carousel" element={<AdminCarousel />} />
          <Route path="/admin/carousel/new" element={<AdminCarouselForm />} />
          <Route path="/admin/carousel/:id" element={<AdminCarouselForm />} />
          <Route path="/admin/brand-assets" element={<AdminBrandAssets />} />
          <Route path="/admin/subscribers" element={<AdminSubscribers />} />
          <Route path="/admin/abandoned" element={<AdminAbandonedSignups />} />
          <Route path="/admin/contest-submissions" element={<AdminContestSubmissions />} />
          <Route path="/admin/promo-popups" element={<AdminPromoPopups />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          <Route path="/epk" element={<EPK />} />
          <Route path="/support" element={<Support />} />
          <Route path="/contest" element={<Contest />} />
          <Route path="/contest/terms" element={<ContestTerms />} />
          <Route path="/sso-callback" element={<SSOCallback />} />
          <Route path="/auth-callback" element={<SSOCallback />} />
          <Route path="/community-guidelines" element={<CommunityGuidelines />} />
          <Route path="/admin/comments" element={<AdminComments />} />
        </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}
