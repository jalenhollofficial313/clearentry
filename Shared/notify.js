(() => {
    if (window.showNotification && window.showConfirm) return;

    const ensureStyles = () => {
        if (document.getElementById("ce-notify-styles")) return;
        const style = document.createElement("style");
        style.id = "ce-notify-styles";
        style.textContent = `
            .ce-toast-container {
                position: fixed;
                right: 20px;
                bottom: 20px;
                display: grid;
                gap: 10px;
                z-index: 9999;
            }
            .ce-toast {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                padding: 12px 14px;
                border-radius: 12px;
                border: 1px solid #e2e8f0;
                background: #ffffff;
                color: #0f172a;
                box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
                font-size: 13px;
                min-width: 240px;
                max-width: 320px;
            }
            .ce-toast__title {
                font-weight: 600;
                margin: 0 0 4px;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: #64748b;
            }
            .ce-toast__message {
                margin: 0;
            }
            .ce-toast__close {
                margin-left: auto;
                border: none;
                background: transparent;
                color: #94a3b8;
                cursor: pointer;
                font-size: 16px;
                line-height: 1;
            }
            .ce-toast--success {
                border-color: #bbf7d0;
            }
            .ce-toast--warning {
                border-color: #fde68a;
            }
            .ce-toast--error {
                border-color: #fecaca;
            }
            .ce-confirm-overlay {
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, 0.55);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                padding: 24px;
            }
            .ce-confirm {
                background: #ffffff;
                border-radius: 14px;
                border: 1px solid #e2e8f0;
                padding: 18px;
                width: min(420px, 92vw);
                display: grid;
                gap: 12px;
                color: #0f172a;
                box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
            }
            .ce-confirm__title {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
            }
            .ce-confirm__message {
                margin: 0;
                font-size: 13px;
                color: #64748b;
            }
            .ce-confirm__actions {
                display: flex;
                justify-content: flex-end;
                gap: 8px;
            }
            .ce-confirm__btn {
                border: 1px solid #e2e8f0;
                background: #ffffff;
                color: #0f172a;
                border-radius: 10px;
                padding: 8px 12px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
            }
            .ce-confirm__btn--primary {
                background: #0f172a;
                border-color: #0f172a;
                color: #ffffff;
            }
            body.dark .ce-toast {
                background: #14181f;
                color: #ffffff;
                border-color: rgba(128, 128, 128, 0.25);
            }
            body.dark .ce-toast__title {
                color: #8c98a4;
            }
            body.dark .ce-confirm {
                background: #14181f;
                border-color: rgba(128, 128, 128, 0.25);
                color: #ffffff;
            }
            body.dark .ce-confirm__message {
                color: #8c98a4;
            }
            body.dark .ce-confirm__btn {
                background: #0f1317;
                border-color: rgba(128, 128, 128, 0.25);
                color: #ffffff;
            }
            body.dark .ce-confirm__btn--primary {
                background: #00ff99;
                border-color: #00ff99;
                color: #0b1b12;
            }
        `;
        document.head.appendChild(style);
    };

    const ensureContainer = () => {
        let container = document.getElementById("ce-toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "ce-toast-container";
            container.className = "ce-toast-container";
            document.body.appendChild(container);
        }
        return container;
    };

    window.showNotification = (message, type = "info", options = {}) => {
        ensureStyles();
        const container = ensureContainer();
        const toast = document.createElement("div");
        toast.className = `ce-toast ce-toast--${type}`;

        const title = document.createElement("p");
        title.className = "ce-toast__title";
        title.textContent = type === "error" ? "Error" : type === "warning" ? "Warning" : "Notice";

        const body = document.createElement("p");
        body.className = "ce-toast__message";
        body.textContent = message;

        const close = document.createElement("button");
        close.className = "ce-toast__close";
        close.textContent = "×";
        close.addEventListener("click", () => toast.remove());

        toast.appendChild(title);
        toast.appendChild(body);
        toast.appendChild(close);
        container.appendChild(toast);

        const duration = options.duration ?? 3500;
        if (duration > 0) {
            setTimeout(() => {
                toast.remove();
            }, duration);
        }
    };

    window.showConfirm = (message, options = {}) =>
        new Promise((resolve) => {
            ensureStyles();
            const overlay = document.createElement("div");
            overlay.className = "ce-confirm-overlay";

            const card = document.createElement("div");
            card.className = "ce-confirm";

            const title = document.createElement("p");
            title.className = "ce-confirm__title";
            title.textContent = options.title || "Confirm Action";

            const body = document.createElement("p");
            body.className = "ce-confirm__message";
            body.textContent = message;

            const actions = document.createElement("div");
            actions.className = "ce-confirm__actions";

            const cancelBtn = document.createElement("button");
            cancelBtn.className = "ce-confirm__btn";
            cancelBtn.textContent = options.cancelText || "Cancel";
            cancelBtn.addEventListener("click", () => {
                overlay.remove();
                resolve(false);
            });

            const confirmBtn = document.createElement("button");
            confirmBtn.className = "ce-confirm__btn ce-confirm__btn--primary";
            confirmBtn.textContent = options.confirmText || "Confirm";
            confirmBtn.addEventListener("click", () => {
                overlay.remove();
                resolve(true);
            });

            actions.appendChild(cancelBtn);
            actions.appendChild(confirmBtn);
            card.appendChild(title);
            card.appendChild(body);
            card.appendChild(actions);
            overlay.appendChild(card);
            document.body.appendChild(overlay);
        });
})();

