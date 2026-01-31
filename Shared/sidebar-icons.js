(() => {
    const ICONS = {
        Dashboard: "layout-dashboard",
        Journal: "list-ordered",
        Notebook: "book-open",
        "Pre Execution": "check-circle",
        Psychology: "brain",
        "Trade Logging": "pen-line",
        Analytics: "chart-no-axes-combined",
        Consistency: "trending-up",
        "My Reports": "chart-column",
        Profile: "user",
        Support: "help-circle",
        "Update Log": "scroll-text",
    };

    const normalizeLabel = (text) =>
        text.replace("▾", "").replace(/\s+/g, " ").trim();

    const decorateNavItem = (el) => {
        if (el.classList.contains("nav-sub-item")) return;
        if (el.querySelector(".nav-item-content")) return;

        const caret = el.querySelector(".nav-caret");
        if (caret) caret.remove();

        const label = normalizeLabel(el.textContent || "");
        const iconName = ICONS[label];
        if (!iconName) {
            if (caret) el.appendChild(caret);
            return;
        }

        el.textContent = "";
        const content = document.createElement("span");
        content.className = "nav-item-content";

        const icon = document.createElement("i");
        icon.setAttribute("data-lucide", iconName);
        content.appendChild(icon);

        const text = document.createElement("span");
        text.textContent = label;
        content.appendChild(text);

        el.appendChild(content);
        if (caret) el.appendChild(caret);
    };

    const init = () => {
        document
            .querySelectorAll(".nav-item, .nav-item-parent")
            .forEach(decorateNavItem);

        if (window.lucide && typeof window.lucide.createIcons === "function") {
            window.lucide.createIcons();
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();

