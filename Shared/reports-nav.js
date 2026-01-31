(() => {
    const setActiveSubNav = (view) => {
        const items = document.querySelectorAll(".nav-sub-item");
        if (!items.length) return;
        items.forEach((item) => {
            const href = item.getAttribute("href") || "";
            const isActive = view && href.includes(`view=${view}`);
            item.classList.toggle("is-active", isActive);
        });
    };

    const resolveView = () => {
        const params = new URLSearchParams(window.location.search);
        const hashView = window.location.hash.replace("#", "");
        return params.get("view") || hashView || "";
    };

    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll(".nav-item-parent").forEach((button) => {
            const sub = button.nextElementSibling;
            if (!sub || !sub.classList.contains("nav-sub")) return;
            button.addEventListener("click", () => {
                sub.classList.toggle("is-hidden");
            });
        });

        setActiveSubNav(resolveView());
    });
})();

