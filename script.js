
const products = [
    { id: 1, name: "Essential Tee", category: "tops", color: "White", price: 350 },
    { id: 2, name: "Core Hoodie", category: "tops", color: "Grey", price: 850 },
    { id: 3, name: "Utility Pants", category: "bottoms", color: "Black", price: 650 },
    { id: 4, name: "Mono Cap", category: "accessories", color: "Black", price: 250 }
];

let cart = [];

try {
    const savedCart = JSON.parse(localStorage.getItem("phantom-cart") || "[]");

    if (Array.isArray(savedCart)) {
        cart = savedCart
            .filter(item => products.some(product => product.id === Number(item.id)))
            .map(item => ({
                ...products.find(product => product.id === Number(item.id)),
                quantity: Math.max(1, Math.floor(Number(item.quantity) || 1))
            }));
    }
} catch {
    cart = [];
}

let activeCategory = "all";
let toastTimer;

const $ = selector => document.querySelector(selector);

const productGrid = $("#product-grid");
const productSearch = $("#product-search");
const productSort = $("#product-sort");
const cartDrawer = $("#cart-drawer");
const cartOverlay = $("#cart-overlay");
const cartItems = $("#cart-items");

function formatPrice(price) {
    return "₱" + Number(price).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function saveCart() {
    try {
        localStorage.setItem("phantom-cart", JSON.stringify(cart));
    } catch {
        showToast("Unable to save the cart on this device.");
    }
}

function renderProducts() {
    if (!productGrid) return;

    const searchTerm = productSearch
        ? productSearch.value.trim().toLowerCase()
        : "";

    let filteredProducts = products.filter(product => {
        const matchesCategory =
            activeCategory === "all" || product.category === activeCategory;

        const matchesSearch =
            product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            product.color.toLowerCase().includes(searchTerm);

        return matchesCategory && matchesSearch;
    });

    const sortMode = productSort ? productSort.value : "featured";

    if (sortMode === "price-low") {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortMode === "price-high") {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortMode === "name") {
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
    }

    productGrid.innerHTML = filteredProducts.map((product, index) => `
        <article class="product-card" style="animation-delay:${index * 70}ms">
            <div class="product-info">
                <div>
                    <h3>${product.name}</h3>
                    <p>${product.color} · ${product.category}</p>
                </div>
                <span class="product-price">${formatPrice(product.price)}</span>
            </div>
            <button class="quick-add" data-action="add" data-id="${product.id}" type="button">
                ADD TO BAG +
            </button>
        </article>
    `).join("");

    const visibleCount = $("#visible-count");
    const noProducts = $("#no-products");

    if (visibleCount) visibleCount.textContent = filteredProducts.length;
    if (noProducts) noProducts.hidden = filteredProducts.length !== 0;

    document.querySelectorAll(".filter-btn").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.category === activeCategory
        );
    });
}


function renderCart() {
    const cartItems = document.getElementById("cart-items");
    if (!cartItems) return;

    const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const cartCount = document.getElementById("cart-count");
    const headingCount = document.getElementById("cart-heading-count");
    const subtotal = document.getElementById("cart-subtotal");
    const checkoutButton = document.getElementById("checkout-button");

    if (cartCount) cartCount.textContent = quantity;
    if (headingCount) headingCount.textContent = `(${quantity})`;
    if (subtotal) subtotal.textContent = formatPrice(total);
    if (checkoutButton) checkoutButton.disabled = quantity === 0;

    if (cart.length === 0) {
        cartItems.innerHTML =
            '<p class="empty-cart">Your bag is currently empty.</p>';
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p>${item.color} · ${formatPrice(item.price)}</p>
                <div class="quantity-controls">
                    <button data-action="decrease" data-id="${item.id}" type="button">−</button>
                    <span>${item.quantity}</span>
                    <button data-action="increase" data-id="${item.id}" type="button">+</button>
                </div>
                <button class="remove-item" data-action="remove" data-id="${item.id}" type="button">Remove</button>
            </div>
            <span class="cart-item-price">${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join("");
}


    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p>${item.color} · ${formatPrice(item.price)}</p>
                <div class="quantity-controls">
                    <button data-action="decrease" data-id="${item.id}" type="button" aria-label="Decrease quantity">−</button>
                    <span>${item.quantity}</span>
                    <button data-action="increase" data-id="${item.id}" type="button" aria-label="Increase quantity">+</button>
                </div>
                <button class="remove-item" data-action="remove" data-id="${item.id}" type="button">Remove</button>
            </div>
            <span class="cart-item-price">${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join("");

function addToCart(id) {
    const product = products.find(item => item.id === id);
    if (!product) return;

    const existing = cart.find(item => item.id === id);

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    renderCart();
    showToast(`${product.name} added to your bag!`);
}

function openCart() {
    cartDrawer?.classList.add("active");
    cartOverlay?.classList.add("active");
    cartDrawer?.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function closeCart() {
    cartDrawer?.classList.remove("active");
    cartOverlay?.classList.remove("active");
    cartDrawer?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

productGrid?.addEventListener("click", event => {
    const button = event.target.closest('[data-action="add"]');
    if (button) addToCart(Number(button.dataset.id));
});

document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", () => {
        activeCategory = button.dataset.category;
        renderProducts();
    });
});

productSearch?.addEventListener("input", renderProducts);
productSort?.addEventListener("change", renderProducts);

cartItems?.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;
    const item = cart.find(product => product.id === id);

    if (!item) return;

    if (action === "increase") {
        item.quantity++;
    } else if (action === "decrease") {
        item.quantity--;

        if (item.quantity <= 0) {
            cart = cart.filter(product => product.id !== id);
        }
    } else if (action === "remove") {
        cart = cart.filter(product => product.id !== id);
        showToast("Item removed from your bag.");
    }

    saveCart();
    renderCart();
});

$("#cart-open")?.addEventListener("click", openCart);
$("#cart-close")?.addEventListener("click", closeCart);
cartOverlay?.addEventListener("click", closeCart);

$("#shop-link")?.addEventListener("click", () => {
    activeCategory = "all";
    renderProducts();
});

$("#hero-shop")?.addEventListener("click", () => {
    activeCategory = "all";
    renderProducts();
});

$("#checkout-button")?.addEventListener("click", () => {
    if (cart.length === 0) {
        showToast("Your bag is empty.");
        return;
    }

    saveCart();
    window.location.href = "checkout.html";
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeCart();
});

renderProducts();
renderCart();
