
"use strict";

const money = amount =>
    "₱" + Number(amount).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value || "—";
    }
}

let order;

try {
    order = JSON.parse(localStorage.getItem("phantom-last-order") || "null");
} catch {
    order = null;
}

if (!order || !Array.isArray(order.items) || order.items.length === 0) {
    document.querySelector(".receipt-container").innerHTML = `
        <div class="receipt-status">
            <p class="eyebrow">PHANTOM® / RECEIPT</p>
            <h1>No receipt found<span>.</span></h1>
            <p class="receipt-intro">
                Complete checkout first to generate your demo receipt.
            </p>
            <p style="margin-top: 24px;">
                <a class="continue-button" href="index.html">
                    RETURN TO SHOP →
                </a>
            </p>
        </div>
    `;
} else {
    setText("receipt-order-number", order.orderNumber);
    setText("receipt-date", order.date);
    setText("receipt-name", order.name);
    setText("receipt-email", order.email);
    setText("receipt-phone", order.phone);
    setText("receipt-address", order.address);
    setText("receipt-city", order.city);
    setText("receipt-postal", order.postalCode);

    setText(
        "receipt-delivery",
        order.delivery === "express"
            ? "Express delivery"
            : "Standard delivery"
    );

    setText("receipt-subtotal", money(order.subtotal));
    setText("receipt-shipping", money(order.shipping));
    setText("receipt-total", money(order.total));

    const itemsElement = document.getElementById("receipt-items");

    itemsElement.innerHTML = order.items.map(item => `
        <div class="receipt-item">
            <div>
                <strong>${escapeHTML(item.name)}</strong>
                <p>
                    ${escapeHTML(item.color || "Standard")}
                    · Qty: ${Number(item.quantity)}
                </p>
            </div>
            <strong>${money(Number(item.price) * Number(item.quantity))}</strong>
        </div>
    `).join("");

    document.getElementById("print-receipt").addEventListener("click", () => {
        window.print();
    });
}
