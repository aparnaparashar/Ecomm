/**
 * MERIDIAN - Luxury Fashion & Apparel Platform
 * Core Interactive Behaviors & Animations
 * Noir & Antique Gold Atelier Aesthetic
 */

document.addEventListener("DOMContentLoaded", () => {

  // 1. SIGNATURE MERIDIAN OPENING LOGO ANIMATION & ON-DEMAND REPLAY
  function triggerLogoAnimation() {
    let overlay = document.getElementById("meridianLogoOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "meridian-logo-overlay";
      overlay.id = "meridianLogoOverlay";
      overlay.innerHTML = `
        <div class="logo-anim-stage">
          <div class="anim-diamond-wrapper">
            <svg viewBox="0 0 100 100" class="anim-svg">
              <polygon points="50,5 95,50 50,95 5,50" class="diamond-path" fill="none" stroke="#c9a96e" stroke-width="1.8"/>
              <line x1="50" y1="18" x2="50" y2="82" stroke="rgba(201,169,110,0.4)" stroke-width="1" class="compass-line"/>
              <line x1="18" y1="50" x2="82" y2="50" stroke="rgba(201,169,110,0.4)" stroke-width="1" class="compass-line"/>
              <circle cx="50" cy="50" r="4" fill="#c9a96e"/>
            </svg>
          </div>
          <h1 class="meridian-anim-title">MERIDIAN</h1>
          <p class="meridian-anim-tagline">ATELIER · HAUTE APPAREL</p>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    document.body.classList.add("modal-open");
    overlay.classList.remove("fade-out");
    overlay.style.display = "flex";

    const path = overlay.querySelector(".diamond-path");
    const title = overlay.querySelector(".meridian-anim-title");
    const tagline = overlay.querySelector(".meridian-anim-tagline");

    if (path) {
      const length = path.getTotalLength ? path.getTotalLength() : 380;
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
      setTimeout(() => {
        path.style.transition = "stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)";
        path.style.strokeDashoffset = "0";
      }, 80);
    }

    if (title) title.classList.remove("visible");
    if (tagline) tagline.classList.remove("visible");

    setTimeout(() => {
      if (title) title.classList.add("visible");
      if (tagline) tagline.classList.add("visible");
    }, 700);

    // Fade out and close
    setTimeout(() => {
      overlay.classList.add("fade-out");
      document.body.classList.remove("modal-open");
      setTimeout(() => {
        overlay.style.display = "none";
      }, 700);
    }, 2800);
  }

  // Signature Meridian opening logo animation on website load
  const homeOverlay = document.getElementById("meridianLogoOverlay");
  if (homeOverlay) {
    triggerLogoAnimation();
  }

  // Also trigger animation when clicking on brand monogram
  const brandDiamond = document.querySelector(".meridian-brand .brand-monogram");
  if (brandDiamond) {
    brandDiamond.style.cursor = "pointer";
    brandDiamond.addEventListener("click", (e) => {
      if (window.location.pathname === "/") {
        e.preventDefault();
        triggerLogoAnimation();
      }
    });
  }

  // 2. DARK & LIGHT MODE THEME ENGINE
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeIcon = document.getElementById("themeIcon");

  function updateThemeUI(currentTheme) {
    document.documentElement.setAttribute("data-theme", currentTheme);
    if (themeIcon) {
      if (currentTheme === "light") {
        themeIcon.classList.remove("fa-moon");
        themeIcon.classList.add("fa-sun");
        themeToggleBtn.setAttribute("title", "Switch to Dark Atelier Noir");
      } else {
        themeIcon.classList.remove("fa-sun");
        themeIcon.classList.add("fa-moon");
        themeToggleBtn.setAttribute("title", "Switch to Ivory Light Mode");
      }
    }
  }

  // Initial sync with localStorage
  const savedTheme = localStorage.getItem("meridian_theme") || "dark";
  updateThemeUI(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const activeTheme = document.documentElement.getAttribute("data-theme") || "dark";
      const nextTheme = activeTheme === "dark" ? "light" : "dark";
      localStorage.setItem("meridian_theme", nextTheme);
      updateThemeUI(nextTheme);
    });
  }

  // 3. HERO LUXURY CAROUSEL (Experiment 2)
  const heroCarousel = document.getElementById("heroCarousel");
  if (heroCarousel) {
    const slides = heroCarousel.querySelectorAll(".hero-slide");
    const dots = document.querySelectorAll(".carousel-dot");
    const prevBtn = document.getElementById("heroPrevBtn");
    const nextBtn = document.getElementById("heroNextBtn");
    let activeIndex = 0;
    let timer = null;

    function goToSlide(index) {
      slides.forEach(s => s.classList.remove("active"));
      dots.forEach(d => d.classList.remove("active"));

      activeIndex = (index + slides.length) % slides.length;
      slides[activeIndex].classList.add("active");
      if (dots[activeIndex]) dots[activeIndex].classList.add("active");
    }

    function startAutoSlide() {
      stopAutoSlide();
      timer = setInterval(() => {
        goToSlide(activeIndex + 1);
      }, 5500);
    }

    function stopAutoSlide() {
      if (timer) clearInterval(timer);
    }

    if (slides.length > 1) {
      startAutoSlide();
      heroCarousel.addEventListener("mouseenter", stopAutoSlide);
      heroCarousel.addEventListener("mouseleave", startAutoSlide);

      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          goToSlide(activeIndex - 1);
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          goToSlide(activeIndex + 1);
        });
      }

      dots.forEach((dot, idx) => {
        dot.addEventListener("click", () => goToSlide(idx));
      });
    }
  }

  // 4. NAVBAR SCROLL DYNAMICS & BLUR
  const navbar = document.querySelector(".meridian-nav");
  if (navbar) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 40) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    });
  }

  // 5. MOBILE DRAWER TOGGLE
  const mobileToggle = document.getElementById("navMobileToggle");
  const mobileDrawer = document.getElementById("navMobileDrawer");
  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener("click", () => {
      mobileDrawer.classList.toggle("open");
      const icon = mobileToggle.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-bars");
        icon.classList.toggle("fa-times");
      }
    });

    mobileDrawer.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => {
        mobileDrawer.classList.remove("open");
        const icon = mobileToggle.querySelector("i");
        if (icon) {
          icon.classList.add("fa-bars");
          icon.classList.remove("fa-times");
        }
      });
    });
  }

  // 6. FLASH ALERTS AUTO-DISMISS
  const alerts = document.querySelectorAll(".meridian-alert");
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.classList.add("fade-out");
      setTimeout(() => alert.remove(), 400);
    }, 4500);
  });

  // 7. KEYBOARD SHORTCUT (/) FOR QUICK SEARCH
  const searchInput = document.querySelector(".meridian-search-input");
  if (searchInput) {
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }
});
