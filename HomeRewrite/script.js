const toggle = document.getElementById("mobile-toggle");
const menu = document.getElementById("mobile-menu");

if (toggle && menu) {
  toggle.addEventListener("click", () => {
    menu.classList.toggle("active");
  });
}

const showcaseTrack = document.getElementById("showcase-track");
const showcaseCaption = document.getElementById("showcase-caption");

if (showcaseTrack && showcaseCaption) {
  const showcases = [
    {
      src: "/HomeRewrite/Analysis.png",
      alt: "Analysis view",
      caption: "Analysis · Performance Breakdown",
    },
    {
      src: "/HomeRewrite/dashboard.png",
      alt: "Dashboard view",
      caption: "Equity Tracker · Visual Growth",
    },
    {
      src: "/HomeRewrite/TradeLogging.png",
      alt: "Trade logging view",
      caption: "Trade Logging · Execution Review",
    },
  ];

  let activeIndex = 1;
  const slots = {
    prev: showcaseTrack.querySelector('[data-slot="prev"] img'),
    main: showcaseTrack.querySelector('[data-slot="main"] img'),
    next: showcaseTrack.querySelector('[data-slot="next"] img'),
  };

  const renderShowcase = () => {
    const prevIndex = (activeIndex - 1 + showcases.length) % showcases.length;
    const nextIndex = (activeIndex + 1) % showcases.length;

    if (slots.prev) {
      slots.prev.src = showcases[prevIndex].src;
      slots.prev.alt = showcases[prevIndex].alt;
    }
    if (slots.main) {
      slots.main.src = showcases[activeIndex].src;
      slots.main.alt = showcases[activeIndex].alt;
    }
    if (slots.next) {
      slots.next.src = showcases[nextIndex].src;
      slots.next.alt = showcases[nextIndex].alt;
    }

    showcaseCaption.textContent = showcases[activeIndex].caption;
  };

  const shiftShowcase = (direction) => {
    if (direction === "next") {
      activeIndex = (activeIndex + 1) % showcases.length;
    } else {
      activeIndex = (activeIndex - 1 + showcases.length) % showcases.length;
    }
    renderShowcase();
  };

  showcaseTrack.querySelectorAll(".showcase-arrow").forEach((button) => {
    button.addEventListener("click", () => {
      const dir = button.getAttribute("data-dir") || "next";
      shiftShowcase(dir);
    });
  });

  renderShowcase();
}
