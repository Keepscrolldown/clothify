const API_URL = window.location.origin;

let products = [];

async function fetchProducts() {
    const loadingEl = document.getElementById('products-loading');
    const gridEl = document.getElementById('products-grid');
    const noProductsEl = document.getElementById('no-products');

    try {
        const response = await fetch(`${API_URL}/api/products`);
        products = await response.json();

        loadingEl.style.display = 'none';

        if (products.length > 0) {
            renderProducts();
        } else {
            noProductsEl.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        loadingEl.textContent = 'Failed to load products';
    }
}

function renderProducts() {
    const gridEl = document.getElementById('products-grid');
    gridEl.innerHTML = '';

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.setAttribute('data-testid', `product-${product.id}`);

        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <button class="add-to-cart-button" data-testid="add-to-cart-${product.id}">Add to Cart</button>
            </div>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">₹${product.price.toLocaleString('en-IN')}</p>
        `;

        gridEl.appendChild(productCard);
    });
}

function startCarousel() {
    const carousel = document.getElementById('carousel-container');
    if (!carousel) return;

    let scrollAmount = 0;
    const slideWidth = carousel.clientWidth;
    const totalSlides = carousel.children.length;

    setInterval(() => {
        if (scrollAmount >= (totalSlides - 1) * slideWidth) {
            scrollAmount = 0;
        } else {
            scrollAmount += slideWidth;
        }
        carousel.scrollTo({ left: scrollAmount, behavior: 'smooth' });
    }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    startCarousel();
});