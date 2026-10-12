
"use strict";

const money = amount =>
    "₱" + Number(amount).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

const deliveryPrices = {
    standard: 80,
    express: 150
};

const checkoutItems = document.getElementById("checkout-items");
const subtotalElement = document.getElementById("checkout-subtotal");
const shippingElement = document.getElementById("checkout-shipping");
const totalElement = document.getElementById("checkout-total");
const checkoutForm = document.getElementById("checkout-form");
const placeOrderButton = document.querySelector(".place-order-button");
const phoneInput = document.getElementById("customer-phone");

let cart = [];

try {
    const savedCart = JSON.parse(
        localStorage.getItem("phantom-cart") || "[]"
    );

    if (Array.isArray(savedCart)) {
        cart = savedCart
            .filter(item =>
                item &&
                typeof item.name === "string" &&
                Number.isFinite(Number(item.price)) &&
                Number(item.price) >= 0 &&
                Number.isFinite(Number(item.quantity)) &&
                Number(item.quantity) > 0
            )
            .map(item => ({
                name: item.name,
                color: item.color || "",
                price: Number(item.price),
                quantity: Math.floor(Number(item.quantity))
            }))
            .filter(item => item.quantity > 0);
    }
} catch {
    cart = [];
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function getSubtotal() {
    return cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
}

function getDelivery() {
    const selected = document.querySelector(
        'input[name="delivery"]:checked'
    )?.value;

    return deliveryPrices[selected] !== undefined
        ? selected
        : "standard";
}

function renderCheckout() {
    if (cart.length === 0) {
        checkoutItems.innerHTML = `
            <p>Your bag is empty. Please return to the shop.</p>
        `;

        if (placeOrderButton) {
            placeOrderButton.disabled = true;
            placeOrderButton.textContent = "YOUR BAG IS EMPTY";
        }
    } else {
        checkoutItems.innerHTML = cart.map(item => `
            <div class="checkout-item">
                <div>
                    <h3>${escapeHTML(item.name)}</h3>
                    <p>${escapeHTML(item.color)} · Qty: ${item.quantity}</p>
                </div>
                <strong>${money(item.price * item.quantity)}</strong>
            </div>
        `).join("");

        if (placeOrderButton) {
            placeOrderButton.disabled = false;
            placeOrderButton.textContent = "PLACE ORDER →";
        }
    }

    const itemsSubtotal = getSubtotal();
    const shipping = deliveryPrices[getDelivery()];

    subtotalElement.textContent = money(itemsSubtotal);
    shippingElement.textContent = money(shipping);
    totalElement.textContent = money(itemsSubtotal + shipping);
}

document.querySelectorAll('input[name="delivery"]').forEach(input => {
    input.addEventListener("change", renderCheckout);
});

phoneInput?.addEventListener("input", () => {
    let value = phoneInput.value.replace(/\D/g, "");

    if (value.length > 0 && value[0] !== "0") {
        value = "";
    }

    if (value.length > 1 && value[1] !== "9") {
        value = "0";
    }

    phoneInput.value = value.slice(0, 11);
});

checkoutForm.addEventListener("submit", event => {
    event.preventDefault();

    if (cart.length === 0) {
        alert("Your shopping bag is empty. Please return to the shop.");
        window.location.href = "index.html";
        return;
    }

    if (!checkoutForm.reportValidity()) {
        return;
    }

    const formData = new FormData(checkoutForm);
    const delivery = getDelivery();
    const itemsSubtotal = getSubtotal();
    const shipping = deliveryPrices[delivery];

    const order = {
        orderNumber: "PH-" + Date.now().toString().slice(-8),
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        address: String(formData.get("address") || "").trim(),
        city: String(formData.get("city") || "").trim(),
        postalCode: String(formData.get("postal") || "").trim(),
        delivery,
        items: cart,
        subtotal: itemsSubtotal,
        shipping,
        total: itemsSubtotal + shipping,
        date: new Date().toLocaleString("en-PH")
    };

    try {
        localStorage.setItem(
            "phantom-last-order",
            JSON.stringify(order)
        );

        localStorage.removeItem("phantom-cart");
    } catch {
        alert(
            "Unable to save your order. Please check your browser storage and try again."
        );
        return;
    }

    window.location.assign("receipt.html");
});

renderCheckout();
