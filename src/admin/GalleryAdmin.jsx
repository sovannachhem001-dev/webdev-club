
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import AdminSidebar from "./AdminSidebar";
import "./GalleryAdmin.css";

function GalleryAdmin() {
  const navigate = useNavigate();

  const [images, setImages] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  // Check admin access
  async function checkAdmin() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      const user = data.session?.user;

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError) throw adminError;

      if (!admin) {
        navigate("/", { replace: true });
        return;
      }

      await fetchImages();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  // Get gallery images
  async function fetchImages() {
    try {
      const { data, error } = await supabase.storage
        .from("gallery")
        .list("", {
          limit: 100,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) throw error;

      const imageFiles = (data || []).filter(
        (item) =>
          item.name &&
          item.name !== ".emptyFolderPlaceholder"
      );

      const imageUrls = imageFiles.map((item) => {
        const { data: urlData } = supabase.storage
          .from("gallery")
          .getPublicUrl(item.name);

        return {
          name: item.name,
          url: urlData.publicUrl,
        };
      });

      setImages(imageUrls);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Upload image
  async function handleUpload(e) {
    e.preventDefault();

    if (!file) {
      setError("Please select an image first.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    setUploading(true);
    setError("");

    const safeName = file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "-"
    );

    const fileName = `${Date.now()}-${safeName}`;

    try {
      const { error } = await supabase.storage
        .from("gallery")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      setFile(null);
      e.target.reset();

      await fetchImages();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  // Permanently delete image
  async function handleDelete(fileName) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this image?"
    );

    if (!confirmed) return;

    setDeleting(fileName);
    setError("");

    try {
      const { data, error } = await supabase.storage
        .from("gallery")
        .remove([fileName]);

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          "Image was not deleted. Please check your Storage permissions."
        );
      }

      if (previewImage?.name === fileName) {
        setPreviewImage(null);
      }

      await fetchImages();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting("");
    }
  }

  if (loading) {
    return (
      <div className="gallery-admin-loading">
        Checking admin access...
      </div>
    );
  }

  return (
    <div className="admin-dashboard-layout">
      <AdminSidebar />

      <main className="admin-gallery-page">

        {/* Header */}
        <header className="gallery-page-header">
          <div>
            <h1>Gallery Management</h1>
            <p>
              Upload and manage WebDev Club photos.
            </p>
          </div>

          <div className="gallery-total-card">
            <span>Total Images</span>
            <strong>{images.length}</strong>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="gallery-error">
            <span>{error}</span>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {/* Upload */}
        <section className="gallery-upload-section">
          <div className="gallery-section-heading">
            <h2>Upload New Image</h2>
            <p>Select an image from your computer.</p>
          </div>

          <form
            onSubmit={handleUpload}
            className="gallery-upload-form"
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFile(e.target.files?.[0] || null)
              }
            />

            {file && (
              <p className="gallery-selected-file">
                Selected: {file.name}
              </p>
            )}

            <button
              type="submit"
              disabled={uploading || !file}
            >
              {uploading ? "Uploading..." : "Upload Image"}
            </button>
          </form>
        </section>

        {/* Gallery */}
        <section className="gallery-list-section">
          <div className="gallery-list-heading">
            <div>
              <h2>All Gallery Images</h2>
              <p>{images.length} images uploaded</p>
            </div>
          </div>

          {images.length === 0 ? (
            <div className="gallery-empty">
              <h3>No images yet</h3>
              <p>Upload your first WebDev Club image.</p>
            </div>
          ) : (
            <div className="gallery-admin-grid">
              {images.map((image) => (
                <article
                  className="gallery-admin-card"
                  key={image.name}
                >
                  <button
                    type="button"
                    className="gallery-image-preview"
                    onClick={() => setPreviewImage(image)}
                    aria-label={`Preview ${image.name}`}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                    />
                  </button>

                  <div className="gallery-card-footer">
                    <p title={image.name}>{image.name}</p>

                    <button
                      type="button"
                      className="gallery-delete-btn"
                      disabled={deleting === image.name}
                      onClick={() => handleDelete(image.name)}
                    >
                      {deleting === image.name
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Image preview */}
        {previewImage && (
          <div
            className="gallery-preview-overlay"
            onClick={() => setPreviewImage(null)}
          >
            <button
              type="button"
              className="gallery-preview-close"
              onClick={() => setPreviewImage(null)}
              aria-label="Close preview"
            >
              ×
            </button>

            <img
              src={previewImage.url}
              alt={previewImage.name}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default GalleryAdmin;
