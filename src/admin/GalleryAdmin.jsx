
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SUPABASE_CONFIG_ERROR, supabase } from "../services/supabase";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showUpload, setShowUpload] = useState(false);
  const [category, setCategory] = useState("Events");

  useEffect(() => {
    checkAdmin();
  }, []);

  // Check admin access
  async function checkAdmin() {
    if (!supabase) {
      setError(SUPABASE_CONFIG_ERROR);
      setLoading(false);
      return;
    }

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
        .list();

      if (error) throw error;

      const imageFiles = (data || []).filter(
        (item) =>
          item.name &&
          item.name !== ".emptyFolderPlaceholder" &&
          /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(item.name)
      );

      const imageUrls = imageFiles.map((item) => {
        const { data: urlData } = supabase.storage
          .from("gallery")
          .getPublicUrl(item.name);

        const lowerName = item.name.toLowerCase();
        let categoryName = "Events";

        if (lowerName.startsWith("activities") || lowerName.includes("activity")) {
          categoryName = "Activities";
        } else if (lowerName.startsWith("projects") || lowerName.includes("project")) {
          categoryName = "Projects";
        } else if (lowerName.startsWith("achievements") || lowerName.includes("achievement")) {
          categoryName = "Achievements";
        } else if (lowerName.startsWith("events")) {
          categoryName = "Events";
        }

        return {
          name: item.name,
          url: urlData.publicUrl,
          category: categoryName,
          createdAt: item.created_at,
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

    const fileName = `${category}-${Date.now()}-${safeName}`;

    try {
      const { error } = await supabase.storage
        .from("gallery")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      setFile(null);
      setShowUpload(false);

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

  const categoryCounts = {
    Events: images.filter((image) => image.category === "Events").length,
    Activities: images.filter((image) => image.category === "Activities").length,
    Projects: images.filter((image) => image.category === "Projects").length,
    Achievements: images.filter((image) => image.category === "Achievements").length,
  };

  const filteredImages = images.filter((image) => {
    const matchesSearch = image.name
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());
    const matchesCategory =
      categoryFilter === "All" || image.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  async function handleRename(image) {
    const extension = image.name.includes(".")
      ? `.${image.name.split(".").pop()}`
      : "";
    const currentTitle = image.name
      .replace(/^(Events|Activities|Projects|Achievements)-\d+-/i, "")
      .replace(new RegExp(`${extension.replace(".", "\\.")}$`, "i"), "");
    const title = window.prompt("Image title", currentTitle);

    if (!title || !title.trim()) return;

    const safeTitle = title.trim().replace(/[^a-zA-Z0-9._-]/g, "-");
    const newName = `${image.category}-${Date.now()}-${safeTitle}${extension}`;

    setDeleting(image.name);
    setError("");

    try {
      const { error } = await supabase.storage
        .from("gallery")
        .move(image.name, newName);

      if (error) throw error;

      if (previewImage?.name === image.name) setPreviewImage(null);
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
        <span aria-hidden="true"></span>
        <p>Loading gallery...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-layout">
      <AdminSidebar />

      <main className="admin-gallery-page">
        <header className="gallery-page-header">
          <div>
            <h1>Gallery</h1>
            <p>Our club moments, events and activities <span aria-hidden="true">♥</span></p>
          </div>

          <div className="gallery-header-tools">
            <label className="gallery-top-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </label>
            <button type="button" className="gallery-notification" onClick={() => navigate("/admin/messages")} aria-label="View messages">♢</button>
            <button type="button" className="gallery-profile">
              <span>A</span>
              <strong>Admin</strong>
              <b>⌄</b>
            </button>
          </div>
        </header>

        {error && (
          <div className="gallery-error">
            <span>{error}</span>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        <section className="gallery-stat-grid">
          <article className="gallery-stat-card">
            <span className="gallery-stat-icon blue">▧</span>
            <div><p>Total Images</p><strong>{images.length}</strong></div>
          </article>
          <article className="gallery-stat-card">
            <span className="gallery-stat-icon green">▣</span>
            <div><p>Events Gallery</p><strong>{categoryCounts.Events}</strong></div>
          </article>
          <article className="gallery-stat-card">
            <span className="gallery-stat-icon orange">♟</span>
            <div><p>Activities</p><strong>{categoryCounts.Activities}</strong></div>
          </article>
          <article className="gallery-stat-card">
            <span className="gallery-stat-icon purple">♛</span>
            <div><p>Achievements</p><strong>{categoryCounts.Achievements}</strong></div>
          </article>
        </section>

        <div className="gallery-toolbar">
          <div className="gallery-tabs" role="tablist" aria-label="Gallery categories">
            {["All", "Events", "Activities", "Projects", "Achievements"].map((item) => (
              <button
                type="button"
                role="tab"
                aria-selected={categoryFilter === item}
                className={categoryFilter === item ? "active" : ""}
                key={item}
                onClick={() => setCategoryFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="gallery-toolbar-actions">
            <button type="button" className="gallery-refresh-button" onClick={fetchImages}>
              ↻ Refresh
            </button>
            <button type="button" className="gallery-upload-button" onClick={() => setShowUpload(true)}>
              <span>⌃</span> Upload Image
            </button>
          </div>
        </div>

        {filteredImages.length === 0 ? (
            <div className="gallery-empty">
              <h3>No gallery images found</h3>
              <p>Try another filter or upload a new image.</p>
            </div>
          ) : (
            <div className="gallery-admin-grid">
              {filteredImages.map((image) => (
                <article
                  className="gallery-admin-card"
                  key={image.name}
                >
                  <span className={`gallery-category gallery-category-${image.category.toLowerCase()} `}>
                    {image.category}
                  </span>
                  <button
                    type="button"
                    className="gallery-card-menu"
                    onClick={() => setPreviewImage(image)}
                    aria-label={`Open options for ${image.name}`}
                  >•••</button>
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
                    <p>
                      {image.name
                        .replace(/^(Events|Activities|Projects|Achievements)-\d+-/i, "")
                        .replace(/\.[^.]+$/, "")
                        .replace(/[-_]/g, " ") || "Untitled image"}
                    </p>
                    <span>
                      {image.createdAt
                        ? new Date(image.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                          })
                        : "Club Gallery"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}

        {showUpload && (
          <div
            className="gallery-modal-overlay"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setShowUpload(false);
            }}
          >
            <section className="gallery-upload-section" role="dialog" aria-modal="true" aria-labelledby="gallery-upload-title">
              <div className="gallery-upload-heading">
                <div>
                  <h2 id="gallery-upload-title">Upload New Image</h2>
                  <p>Select a category and choose an image.</p>
                </div>
                <button type="button" onClick={() => setShowUpload(false)} aria-label="Close upload">×</button>
              </div>

              <form onSubmit={handleUpload} className="gallery-upload-form">
                <label>
                  <span>Category</span>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option>Events</option>
                    <option>Activities</option>
                    <option>Projects</option>
                    <option>Achievements</option>
                  </select>
                </label>

                <label className="gallery-file-picker">
                  <span>Choose image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>

                {file && (
                  <p className="gallery-selected-file">Selected: {file.name}</p>
                )}

                <div className="gallery-upload-actions">
                  <button type="submit" disabled={uploading || !file}>
                    {uploading ? "Uploading..." : "Upload Image"}
                  </button>
                  <button type="button" className="gallery-upload-cancel" onClick={() => setShowUpload(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {previewImage && (
          <div
            className="gallery-preview-overlay"
            onClick={() => setPreviewImage(null)}
          >
            <aside className="gallery-preview-panel" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                className="gallery-preview-close"
                onClick={() => setPreviewImage(null)}
                aria-label="Close preview"
              >
                ×
              </button>
              <img src={previewImage.url} alt={previewImage.name} />
              <h2>
                {previewImage.name
                  .replace(/^(Events|Activities|Projects|Achievements)-\d+-/i, "")
                  .replace(/\.[^.]+$/, "")
                  .replace(/[-_]/g, " ") || "Untitled image"}
              </h2>
              <div className="gallery-preview-meta">
                {previewImage.createdAt
                  ? new Date(previewImage.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })
                  : "Club Gallery"}
                <span className={`gallery-preview-category category-${previewImage.category.toLowerCase()}`}>
                  {previewImage.category}
                </span>
              </div>
              <div className="gallery-preview-actions">
                <a href={previewImage.url} download target="_blank" rel="noreferrer">⌄ Download</a>
                <button type="button" onClick={() => handleRename(previewImage)}>✎ Edit</button>
                <button
                  type="button"
                  className="gallery-preview-delete"
                  disabled={deleting === previewImage.name}
                  onClick={() => handleDelete(previewImage.name)}
                >
                  🗑 {deleting === previewImage.name ? "Deleting..." : "Delete"}
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default GalleryAdmin;
