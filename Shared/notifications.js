(function () {
    const containerId = "ce-notify-container";

    const parseRgb = (value) => {
        const match = value
            .replace(/\s+/g, "")
            .match(/rgba?\((\d+),(\d+),(\d+)/i);
        if (!match) return null;
        return {
            r: Number(match[1]),
            g: Number(match[2]),
            b: Number(match[3]),
        };
    };

    const isDarkColor = (rgb) => {
        if (!rgb) return false;
        const luminance =
            (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
        return luminance < 0.45;
    };

    const ensureContainer = () => {
        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement("div");
            container.id = containerId;
            container.className = "ce-notify-container";
            document.body.appendChild(container);
        }

        const bodyBg = getComputedStyle(document.body).backgroundColor;
        const isDark = isDarkColor(parseRgb(bodyBg));
        container.classList.toggle("is-dark", isDark);
        return container;
    };

    window.showNotification = (message, type = "error", options = {}) => {
        const container = ensureContainer();
        const toast = document.createElement("div");
        toast.className = `ce-notify ce-notify-${type}`;
        toast.setAttribute("role", type === "error" ? "alert" : "status");

        const text = document.createElement("div");
        text.className = "ce-notify-message";
        text.textContent = message;

        const close = document.createElement("button");
        close.className = "ce-notify-close";
        close.type = "button";
        close.setAttribute("aria-label", "Close notification");
        close.textContent = "×";

        close.addEventListener("click", () => {
            toast.remove();
        });

        toast.appendChild(text);
        toast.appendChild(close);
        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add("is-visible");
        });

        const duration = options.duration ?? 4500;
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.remove("is-visible");
                setTimeout(() => toast.remove(), 200);
            }, duration);
        }
    };

    window.showConfirm = (message, options = {}) =>
        new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.className = "ce-confirm-overlay";

            const bodyBg = getComputedStyle(document.body).backgroundColor;
            const isDark = isDarkColor(parseRgb(bodyBg));
            if (isDark) {
                overlay.classList.add("is-dark");
            }

            const card = document.createElement("div");
            card.className = "ce-confirm";

            const title = document.createElement("p");
            title.className = "ce-confirm-title";
            title.textContent = options.title || "Confirm";

            const text = document.createElement("p");
            text.className = "ce-confirm-message";
            text.textContent = message;

            const actions = document.createElement("div");
            actions.className = "ce-confirm-actions";

            const cancelBtn = document.createElement("button");
            cancelBtn.className = "ce-confirm-btn";
            cancelBtn.type = "button";
            cancelBtn.textContent = options.cancelText || "Cancel";

            const confirmBtn = document.createElement("button");
            confirmBtn.className = "ce-confirm-btn ce-confirm-btn-primary";
            confirmBtn.type = "button";
            confirmBtn.textContent = options.confirmText || "Confirm";

            cancelBtn.addEventListener("click", () => {
                overlay.remove();
                resolve(false);
            });

            confirmBtn.addEventListener("click", () => {
                overlay.remove();
                resolve(true);
            });

            actions.appendChild(cancelBtn);
            actions.appendChild(confirmBtn);
            card.appendChild(title);
            card.appendChild(text);
            card.appendChild(actions);
            overlay.appendChild(card);
            document.body.appendChild(overlay);
        });
})();

