import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./AuthContext.jsx";
import { ToastProvider } from "./Toast.jsx";
import App from "./App.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import Products from "./pages/admin/Products.jsx";
import Banners from "./pages/admin/Banners.jsx";
import Campaigns from "./pages/admin/Campaigns.jsx";
import Categories from "./pages/admin/Categories.jsx";
import Navs from "./pages/admin/Navs.jsx";
import ResourceDetail from "./pages/ResourceDetail.jsx";
import TopicPostDetail from "./pages/TopicPostDetail.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/resource/:id" element={<ResourceDetail />} />
            <Route path="/topic-post/:id" element={<TopicPostDetail />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="categories" element={<Categories />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="banners" element={<Banners />} />
              <Route path="navs" element={<Navs />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>
);
