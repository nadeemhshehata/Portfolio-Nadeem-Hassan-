const CART_KEY = "novatech_cart";

const products = [
    {
        id: 1,
        name: "Nova Wireless Earbuds Pro",
        category: "audio",
        price: 79.99,
        icon: "🎧",
        description: "Active noise cancellation, clear audio, and up to 24 hours of listening with the charging case."
    },
    {
        id: 2,
        name: "Ultra-Slim Armor Phone Case",
        category: "accessories",
        price: 29.99,
        icon: "📱",
        description: "A slim protective shell with reinforced corners, a matte finish, and a comfortable grip."
    },
    {
        id: 3,
        name: "PowerVolt 20K Power Bank",
        category: "charging",
        price: 49.99,
        icon: "🔋",
        description: "A 20,000 mAh portable battery with 65W USB-C fast charging for phones, tablets, and laptops."
    },
    {
        id: 4,
        name: "Pulse Smartwatch Elite",
        category: "wearables",
        price: 199.99,
        icon: "⌚",
        description: "An AMOLED fitness watch with heart-rate tracking, activity insights, and seven-day battery life."
    },
    {
        id: 5,
        name: "SoundWave Mini Speaker",
        category: "audio",
        price: 39.99,
        icon: "🔊",
        description: "A compact IPX7 water-resistant Bluetooth speaker with balanced 360-degree sound."
    },
    {
        id: 6,
        name: "HyperConnect 7-in-1 Hub",
        category: "accessories",
        price: 59.99,
        icon: "⌨️",
        description: "A USB-C hub with 4K HDMI, 100W power delivery, an SD reader, and three USB ports."
    }
];

function getCart() {
    try {
        const savedCart = JSON.parse(localStorage.getItem(CART_KEY));
        if (!Array.isArray(savedCart)) return [];

        return savedCart.filter(item =>
            Number.isInteger(item.id) &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0 &&
            products.some(product => product.id === item.id)
        );
    } catch {
        return [];
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
        showToast("Your browser could not save the cart.");
    }
    updateCartBadge();
}

function addToCart(productId) {
    const product = products.find(item => item.id === productId);
    if (!product) return;

    const cart = getCart();
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: product.id, quantity: 1 });
    }

    saveCart(cart);
    showToast(`${product.name} added to your cart.`);
    renderCart();
}

function removeFromCart(productId) {
    const product = products.find(item => item.id === productId);
    const cart = getCart().filter(item => item.id !== productId);
    saveCart(cart);
    renderCart();
    showToast(product ? `${product.name} removed.` : "Item removed.");
}

function updateQuantity(productId, change) {
    const cart = getCart();
    const item = cart.find(cartItem => cartItem.id === productId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }

    saveCart(cart);
    renderCart();
}

function updateCartBadge() {
    const badge = document.getElementById("cart-badge");
    if (!badge) return;

    const totalCount = getCart().reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = String(totalCount);
    badge.setAttribute("aria-label", `${totalCount} ${totalCount === 1 ? "item" : "items"}`);
}

function showToast(message) {
    const toastContainer = document.getElementById("toast");
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = "toast-msg";
    toast.textContent = message;
    toastContainer.appendChild(toast);

    window.setTimeout(() => toast.remove(), 3200);
}

function createProductCard(product) {
    return `
        <article class="product-card">
            <div class="product-visual ${product.category}" role="img" aria-label="${product.name} product illustration">
                <span class="product-icon" aria-hidden="true">${product.icon}</span>
            </div>
            <div class="product-info">
                <span class="category-tag">${product.category}</span>
                <h3>${product.name}</h3>
                <p class="description">${product.description}</p>
                <div class="product-bottom">
                    <span class="price">$${product.price.toFixed(2)}</span>
                    <button class="add-to-cart-btn" type="button" data-add-to-cart="${product.id}" aria-label="Add ${product.name} to cart">Add to Cart</button>
                </div>
            </div>
        </article>
    `;
}

function renderFeaturedProducts() {
    const container = document.getElementById("featured-products");
    if (!container) return;

    container.innerHTML = products.slice(0, 3).map(createProductCard).join("");
}

function renderProducts(itemsToRender = products) {
    const container = document.getElementById("products-grid");
    if (!container) return;

    if (itemsToRender.length === 0) {
        container.innerHTML = '<p class="no-results">No products match that search. Try another keyword or category.</p>';
        return;
    }

    container.innerHTML = itemsToRender.map(createProductCard).join("");
}

function renderCart() {
    const cartContainer = document.getElementById("cart-container");
    if (!cartContainer) return;

    const subtotalElement = document.getElementById("cart-subtotal");
    const shippingElement = document.getElementById("cart-shipping");
    const totalElement = document.getElementById("cart-total");
    const checkoutButton = document.querySelector(".checkout-btn");
    const cart = getCart();

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p class="empty-cart-msg">Your cart is empty. <a href="products.html">Explore products</a></p>';
        subtotalElement.textContent = "$0.00";
        shippingElement.textContent = "Free over $50";
        totalElement.textContent = "$0.00";
        checkoutButton.disabled = true;
        return;
    }

    const detailedCart = cart.map(item => ({
        ...products.find(product => product.id === item.id),
        quantity: item.quantity
    })).filter(item => item.id);

    cartContainer.innerHTML = detailedCart.map(item => `
        <article class="cart-item">
            <div class="cart-item-visual ${item.category}" aria-hidden="true">${item.icon}</div>
            <div class="cart-item-info">
                <h3>${item.name}</h3>
                <span class="item-price">$${item.price.toFixed(2)} each</span>
            </div>
            <div class="cart-item-controls" aria-label="Quantity controls for ${item.name}">
                <button class="qty-btn" type="button" data-cart-action="decrease" data-product-id="${item.id}" aria-label="Decrease ${item.name} quantity">−</button>
                <span class="qty-display" aria-label="Quantity ${item.quantity}">${item.quantity}</span>
                <button class="qty-btn" type="button" data-cart-action="increase" data-product-id="${item.id}" aria-label="Increase ${item.name} quantity">+</button>
                <button class="remove-btn" type="button" data-cart-action="remove" data-product-id="${item.id}" aria-label="Remove ${item.name} from cart">×</button>
            </div>
        </article>
    `).join("");

    const subtotal = detailedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal >= 50 ? 0 : 9.99;
    const total = subtotal + shipping;

    subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    shippingElement.textContent = shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`;
    totalElement.textContent = `$${total.toFixed(2)}`;
    checkoutButton.disabled = false;
}

function setupProductActions() {
    document.addEventListener("click", event => {
        const addButton = event.target.closest("[data-add-to-cart]");
        if (addButton) {
            addToCart(Number(addButton.dataset.addToCart));
            return;
        }

        const cartButton = event.target.closest("[data-cart-action]");
        if (!cartButton) return;

        const productId = Number(cartButton.dataset.productId);
        const action = cartButton.dataset.cartAction;
        if (action === "increase") updateQuantity(productId, 1);
        if (action === "decrease") updateQuantity(productId, -1);
        if (action === "remove") removeFromCart(productId);
    });
}

function setupFilters() {
    const filterButtons = [...document.querySelectorAll(".filter-btn")];
    const searchInput = document.getElementById("product-search");
    const resultCount = document.getElementById("product-results-count");
    if (!filterButtons.length || !searchInput || !resultCount) return;

    let activeCategory = "all";
    let searchQuery = "";

    const applyFilters = () => {
        const query = searchQuery.trim().toLowerCase();
        const filteredProducts = products.filter(product => {
            const matchesCategory = activeCategory === "all" || product.category === activeCategory;
            const matchesSearch = !query || [product.name, product.description, product.category]
                .some(value => value.toLowerCase().includes(query));
            return matchesCategory && matchesSearch;
        });

        renderProducts(filteredProducts);
        resultCount.textContent = filteredProducts.length === products.length
            ? `Showing all ${products.length} products`
            : `Showing ${filteredProducts.length} ${filteredProducts.length === 1 ? "product" : "products"}`;
    };

    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            filterButtons.forEach(item => {
                const isActive = item === button;
                item.classList.toggle("active", isActive);
                item.setAttribute("aria-pressed", String(isActive));
            });
            activeCategory = button.dataset.filter || "all";
            applyFilters();
        });
    });

    searchInput.addEventListener("input", event => {
        searchQuery = event.target.value;
        applyFilters();
    });
}

function setupMobileMenu() {
    const toggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
    if (!toggle || !navLinks) return;

    const setMenuState = isOpen => {
        navLinks.classList.toggle("active", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    };

    toggle.addEventListener("click", () => {
        setMenuState(toggle.getAttribute("aria-expanded") !== "true");
    });

    navLinks.addEventListener("click", event => {
        if (event.target.closest("a")) setMenuState(false);
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 780) setMenuState(false);
    });
}

function setupNewsletter() {
    const form = document.querySelector(".newsletter-form");
    if (!form) return;

    form.addEventListener("submit", event => {
        event.preventDefault();
        const input = form.querySelector('input[type="email"]');
        if (!input || !input.value) return;

        showToast("Demo complete—your email was not sent or stored.");
        form.reset();
    });
}

function setupCheckout() {
    const checkoutButton = document.querySelector(".checkout-btn");
    if (!checkoutButton) return;

    checkoutButton.addEventListener("click", () => {
        if (!checkoutButton.disabled) {
            showToast("Demo checkout complete—no payment or personal data was collected.");
        }
    });
}

function setupPrivacyControl() {
    const clearButton = document.getElementById("clear-site-data");
    const status = document.getElementById("privacy-status");
    if (!clearButton || !status) return;

    const updateStatus = () => {
        const itemCount = getCart().reduce((sum, item) => sum + item.quantity, 0);
        status.textContent = itemCount > 0
            ? `${itemCount} ${itemCount === 1 ? "cart item is" : "cart items are"} saved in this browser.`
            : "No NovaTech cart data is currently saved.";
    };

    updateStatus();
    clearButton.addEventListener("click", () => {
        localStorage.removeItem(CART_KEY);
        updateCartBadge();
        updateStatus();
        showToast("Saved NovaTech cart data cleared.");
    });
}

document.addEventListener("DOMContentLoaded", () => {
    updateCartBadge();
    renderFeaturedProducts();
    renderProducts();
    renderCart();
    setupProductActions();
    setupFilters();
    setupMobileMenu();
    setupNewsletter();
    setupCheckout();
    setupPrivacyControl();
});
