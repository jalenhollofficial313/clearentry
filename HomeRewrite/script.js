const toggle = document.getElementById("mobile-toggle");
const menu = document.getElementById("mobile-menu");

if (toggle && menu) {
  toggle.addEventListener("click", () => {
    menu.classList.toggle("active");
  });
}

const betaBanner = document.getElementById("beta-banner");
const betaBannerClose = document.getElementById("beta-banner-close");
const betaBannerStorageKey = "clearentry-beta-banner-dismissed";

if (betaBanner && localStorage.getItem(betaBannerStorageKey) === "true") {
  betaBanner.style.display = "none";
}

if (betaBanner && betaBannerClose) {
  betaBannerClose.addEventListener("click", () => {
    betaBanner.style.display = "none";
    localStorage.setItem(betaBannerStorageKey, "true");
  });
}

const showcaseTrack = document.getElementById("showcase-track");
const showcaseCaption = document.getElementById("showcase-caption");

if (showcaseTrack && showcaseCaption) {
  const showcases = [
    {
      src: "/HomeRewrite/Analysis.png",
      alt: "Analysis view",
      caption: "Analysis - Performance Breakdown",
    },
    {
      src: "/HomeRewrite/dashboard.png",
      alt: "Dashboard view",
      caption: "Equity Tracker - Visual Growth",
    },
    {
      src: "/HomeRewrite/TradeLogging.png",
      alt: "Trade logging view",
      caption: "Trade Logging - Execution Review",
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

const faqList = document.getElementById("faq-list");

if (faqList) {
  faqList.querySelectorAll(".faq-question").forEach((question) => {
    question.addEventListener("click", () => {
      const item = question.closest(".faq-item");
      const answer = item?.querySelector(".faq-answer");
      const currentlyExpanded = question.getAttribute("aria-expanded") === "true";

      faqList.querySelectorAll(".faq-question").forEach((otherQuestion) => {
        otherQuestion.setAttribute("aria-expanded", "false");
        const otherAnswer = otherQuestion.closest(".faq-item")?.querySelector(".faq-answer");
        if (otherAnswer) {
          otherAnswer.style.maxHeight = "0px";
        }
      });

      if (!currentlyExpanded) {
        question.setAttribute("aria-expanded", "true");
        if (answer) {
          answer.style.maxHeight = `${answer.scrollHeight}px`;
        }
      }
    });
  });
}

const exitIntentModal = document.getElementById("exit-intent-modal");
const supportsExitIntent =
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  window.innerWidth >= 900;

const openExitIntentModal = () => {
  if (!exitIntentModal) return;
  exitIntentModal.classList.add("active");
  exitIntentModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
};

const closeExitIntentModal = () => {
  if (!exitIntentModal) return;
  exitIntentModal.classList.remove("active");
  exitIntentModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
};

if (exitIntentModal) {
  exitIntentModal.querySelectorAll("[data-exit-close='true']").forEach((node) => {
    node.addEventListener("click", closeExitIntentModal);
  });
}

if (exitIntentModal && supportsExitIntent) {
  const exitStorageKey = "clearentry-exit-intent-shown";
  const alreadyShown = sessionStorage.getItem(exitStorageKey) === "true";

  if (!alreadyShown) {
    const handleMouseLeave = (event) => {
      const leavingWindow = !event.relatedTarget && !event.toElement;
      const closeToTop = event.clientY <= 8;
      if (!leavingWindow || !closeToTop) return;

      sessionStorage.setItem(exitStorageKey, "true");
      openExitIntentModal();
      document.removeEventListener("mouseout", handleMouseLeave);
    };

    document.addEventListener("mouseout", handleMouseLeave);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && exitIntentModal.classList.contains("active")) {
      closeExitIntentModal();
    }
  });
}
