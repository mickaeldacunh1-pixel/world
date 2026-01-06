import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Tobi from "./components/Tobi";
import Home from "./pages/Home";
import Listings from "./pages/Listings";
import ListingDetail from "./pages/ListingDetail";
import CreateListing from "./pages/CreateListing";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";
import Orders from "./pages/Orders";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Favorites from "./pages/Favorites";
import Alerts from "./pages/Alerts";
import SellerStats from "./pages/SellerStats";
import SellerProfile from "./pages/SellerProfile";
import BuyerProfile from "./pages/BuyerProfile";
import AdminSettings from "./pages/AdminSettings";
import AdminUpdates from "./pages/AdminUpdates";
import AdminReports from "./pages/AdminReports";
import Profile from "./pages/Profile";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import EditListing from "./pages/EditListing";
import Brands from "./pages/Brands";
import About from "./pages/About";
import CGV from "./pages/CGV";
import LegalNotice from "./pages/LegalNotice";
import Contact from "./pages/Contact";
import ReturnsPolicy from "./pages/ReturnsPolicy";
import FAQ from "./pages/FAQ";
import Updates from "./pages/Updates";
import Newsletter from "./pages/Newsletter";
import Auctions from "./pages/Auctions";
import Loyalty from "./pages/Loyalty";
import Promote from "./pages/Promote";
import Diagnostic from "./pages/Diagnostic";
import "./App.css";

// Composant pour scroller en haut à chaque changement de page
function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/annonces" element={<Listings />} />
          <Route path="/annonces/:category" element={<Listings />} />
          <Route path="/annonce/:id" element={<ListingDetail />} />
          <Route path="/annonce/:id/modifier" element={
            <ProtectedRoute><EditListing /></ProtectedRoute>
          } />
          <Route path="/marques" element={<Brands />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/tarifs" element={<Pricing />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/deposer" element={
            <ProtectedRoute><CreateListing /></ProtectedRoute>
          } />
          <Route path="/tableau-de-bord" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute><Messages /></ProtectedRoute>
          } />
          <Route path="/messages/:listingId/:userId" element={
            <ProtectedRoute><Messages /></ProtectedRoute>
          } />
          <Route path="/commandes" element={
            <ProtectedRoute><Orders /></ProtectedRoute>
          } />
          <Route path="/favoris" element={
            <ProtectedRoute><Favorites /></ProtectedRoute>
          } />
          <Route path="/alertes" element={
            <ProtectedRoute><Alerts /></ProtectedRoute>
          } />
          <Route path="/statistiques" element={
            <ProtectedRoute><SellerStats /></ProtectedRoute>
          } />
          <Route path="/vendeur/:sellerId" element={<SellerProfile />} />
          <Route path="/acheteur/:buyerId" element={<BuyerProfile />} />
          <Route path="/encheres" element={<Auctions />} />
          <Route path="/fidelite" element={<Loyalty />} />
          <Route path="/promouvoir" element={
            <ProtectedRoute><Promote /></ProtectedRoute>
          } />
          <Route path="/diagnostic" element={<Diagnostic />} />
          <Route path="/admin/parametres" element={
            <ProtectedRoute><AdminSettings /></ProtectedRoute>
          } />
          <Route path="/admin/actualites" element={
            <ProtectedRoute><AdminUpdates /></ProtectedRoute>
          } />
          <Route path="/admin/signalements" element={
            <ProtectedRoute><AdminReports /></ProtectedRoute>
          } />
          <Route path="/profil" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/panier" element={<Cart />} />
          <Route path="/checkout" element={
            <ProtectedRoute><Checkout /></ProtectedRoute>
          } />
          <Route path="/a-propos" element={<About />} />
          <Route path="/cgv" element={<CGV />} />
          <Route path="/mentions-legales" element={<LegalNotice />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/politique-retours" element={<ReturnsPolicy />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/nouveautes" element={<Updates />} />
          <Route path="/newsletter" element={<Newsletter />} />
        </Routes>
      </main>
      <Footer />
      <Tobi />
      <Toaster position="top-right" richColors />
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
