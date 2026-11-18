
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import "./Gallery.css";

function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  async function fetchGalleryImages() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase.storage
      .from("gallery")
      .list();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const imageFiles = (data || []).filter(
      (item) =>
        item.name &&
        item.name !== ".emptyFolderPlaceholder" &&
        /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(item.name)
    );

    const galleryImages = imageFiles.map((item) => {
      const { data } = supabase.storage
        .from("gallery")
        .getPublicUrl(item.name);

      return {
        name: item.name,
        url: data.publicUrl,
      };
    });

    setImages(galleryImages);
    setLoading(false);
  }

  function showPrevious() {
    setSelectedIndex((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  }

  function showNext() {
    setSelectedIndex((current) =>
      current === images.length - 1 ? 0 : current + 1
    );
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (selectedIndex === null) return;

      if (e.key === "ArrowLeft") showPrevious();
      if (e.key === "ArrowRight") showNext();
      if (e.key === "Escape") setSelectedIndex(null);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedIndex, images.length]);

  return (
    <section className="gallery-page">
      <div className="gallery-heading">
        <h1>Our Gallery</h1>
        <p>Explore moments and activities from WebDev Club.</p>
      </div>

      {loading ? (
        <div className="gallery-state" role="status">
          <span className="gallery-spinner" aria-hidden="true"></span>
          <p>Loading gallery...</p>
        </div>
      ) : error ? (
        <div className="gallery-state gallery-error" role="alert">
          <p>{error}</p>
        </div>
      ) : images.length === 0 ? (
        <div className="gallery-state">
          <p>No photos available yet.</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {images.map((image, index) => (
            <button
              type="button"
              className="gallery-item"
              key={image.name}
              onClick={() => setSelectedIndex(index)}
              aria-label={`Open image ${index + 1}`}
            >
              <img
                src={image.url}
                alt={`WebDev Club activity ${index + 1}`}
                loading="lazy"
              />
              <span className="gallery-item-overlay" aria-hidden="true">
                View photo
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Full-size image popup */}
      {selectedIndex !== null && images[selectedIndex] && (
        <div
          className="gallery-modal"
          onClick={() => setSelectedIndex(null)}
        >
          <button
            className="gallery-modal-close"
            onClick={() => setSelectedIndex(null)}
            aria-label="Close image"
          >
            &times;
          </button>

          <button
            className="gallery-arrow gallery-previous"
            onClick={(e) => {
              e.stopPropagation();
              showPrevious();
            }}
            aria-label="Previous image"
          >
            &#10094;
          </button>

          <img
            src={images[selectedIndex].url}
            alt="Full-size WebDev Club photo"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            className="gallery-arrow gallery-next"
            onClick={(e) => {
              e.stopPropagation();
              showNext();
            }}
            aria-label="Next image"
          >
            &#10095;
          </button>

          <div className="gallery-image-counter">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </section>
  );
}

export default Gallery;
