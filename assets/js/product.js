/* =========================================================================
   BURGENTON EQUIPMENT — PRODUCT GALLERY BEHAVIOR
   =========================================================================
   Lightweight thumbnail-click-to-swap gallery, no lightbox dependency.
   Pairs with .product-gallery__main / .product-gallery__thumbs in
   assets/css/products.css. Loaded only on Product hub/detail pages —
   not part of the global foundation bundle.
   ========================================================================= */

(function () {
  "use strict";

  function initGalleries() {
    document.querySelectorAll("[data-gallery]").forEach(function (gallery) {
      var mainImg = gallery.querySelector(".product-gallery__main img");
      var mainSource = gallery.querySelector(".product-gallery__main source");
      var thumbs = gallery.querySelectorAll(".product-gallery__thumb");

      if (!mainImg || !thumbs.length) return;

      thumbs.forEach(function (thumb) {
        thumb.addEventListener("click", function () {
          var fullSrc = thumb.getAttribute("data-full");
          var alt = thumb.getAttribute("data-alt");
          if (!fullSrc) return;
          if (mainSource) {
            var webpSrc = fullSrc.replace(".jpg", ".webp");
            mainSource.setAttribute("srcset", webpSrc);
          }
          mainImg.setAttribute("src", fullSrc);
          if (alt) mainImg.setAttribute("alt", alt);
          thumbs.forEach(function (t) {
            t.classList.remove("is-active");
          });
          thumb.classList.add("is-active");
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", initGalleries);
})();
