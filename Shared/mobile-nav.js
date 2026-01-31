document.addEventListener("DOMContentLoaded", () => {
    const toggleButton = document.querySelector(".mobile-nav-toggle");
    const menu = document.querySelector(".mobile-nav-menu");
    const sidebarNav = document.querySelector(".sidebar-nav");

    if (!toggleButton || !menu || !sidebarNav) {
        return;
    }

    const buildLink = (anchor, className) => {
        const link = document.createElement("a");
        link.href = anchor.getAttribute("href") || "#";
        link.textContent = anchor.textContent.trim();
        link.className = className;
        if (anchor.classList.contains("is-active")) {
            link.classList.add("is-active");
        }
        return link;
    };

    const addLabel = (text) => {
        const label = document.createElement("div");
        label.className = "mobile-nav-label";
        label.textContent = text;
        menu.appendChild(label);
    };

    menu.innerHTML = "";
    sidebarNav.querySelectorAll(".nav-section").forEach((section) => {
        const label = section.querySelector(".nav-label");
        if (label) {
            addLabel(label.textContent.trim());
        }

        section.querySelectorAll("a.nav-item").forEach((anchor) => {
            menu.appendChild(buildLink(anchor, "mobile-nav-link"));
        });

        const parentButton = section.querySelector(".nav-item-parent");
        if (parentButton) {
            const title = parentButton.textContent.replace("▾", "").trim();
            if (title) {
                addLabel(title);
            }
            section.querySelectorAll(".nav-sub a.nav-sub-item").forEach((anchor) => {
                menu.appendChild(buildLink(anchor, "mobile-nav-link mobile-nav-sub"));
            });
        }
    });

    const closeMenu = () => {
        menu.classList.remove("is-open");
        toggleButton.setAttribute("aria-expanded", "false");
    };

    const toggleMenu = () => {
        const isOpen = menu.classList.toggle("is-open");
        toggleButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
    };

    toggleButton.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleMenu();
    });

    document.addEventListener("click", (event) => {
        if (!menu.contains(event.target) && !toggleButton.contains(event.target)) {
            closeMenu();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 1024) {
            closeMenu();
        }
    });
});

