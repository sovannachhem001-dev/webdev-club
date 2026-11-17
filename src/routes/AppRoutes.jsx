
import { Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import Home from "../pages/Home";
import About from "../pages/About";
import Members from "../pages/Members";
import Gallery from "../pages/Gallery";
import Contact from "../pages/Contact";
import Login from "../pages/Login";

import Admin from "../admin/Admin";
import GalleryAdmin from "../admin/GalleryAdmin";
import AdminMessages from "../admin/AdminMessages";
import AdminMembers from "../admin/AdminMembers";

function AppRoutes() {
  return (
    <Routes>
      {/* Public Website */}
      <Route
        path="/"
        element={
          <MainLayout>
            <Home />
          </MainLayout>
        }
      />

      <Route
        path="/about"
        element={
          <MainLayout>
            <About />
          </MainLayout>
        }
      />

      <Route
        path="/members"
        element={
          <MainLayout>
            <Members />
          </MainLayout>
        }
      />

      <Route
        path="/gallery"
        element={
          <MainLayout>
            <Gallery />
          </MainLayout>
        }
      />

      <Route
        path="/contact"
        element={
          <MainLayout>
            <Contact />
          </MainLayout>
        }
      />

      {/* Login */}
      <Route
        path="/login"
        element={
          <MainLayout>
            <Login />
          </MainLayout>
        }
      />

      {/* Admin Pages - No Public Navbar */}
      <Route path="/admin" element={<Admin />} />

      <Route path="/admin/gallery" element={<GalleryAdmin />} />

      <Route path="/admin/messages" element={<AdminMessages />} />
      
      <Route path="/admin/members" element={<AdminMembers />} />
    </Routes>
  );
}

export default AppRoutes;
