const API_URL = window.location.origin;
let products = [];
let editingProductId = null;

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'admin-login.html';
    }
}

async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/api/products`);
        products = await response.json();
        
        document.getElementById('loading').style.display = 'none';
        
        if (products.length > 0) {
            renderProductsTable();
        } else {
            document.getElementById('no-products').style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        showToast('Failed to fetch products', 'error');
    }
}

function renderProductsTable() {
    const container = document.getElementById('products-table-container');
    container.style.display = 'block';
    
    const tableHTML = `
        <div class="products-table">
            <table>
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => `
                        <tr>
                            <td><img src="${product.image}" alt="${product.name}" class="product-image"></td>
                            <td class="product-name">${product.name}</td>
                            <td class="product-category">${product.category || 'N/A'}</td>
                            <td class="product-price">₹${product.price.toLocaleString('en-IN')}</td>
                            <td class="product-stock">${product.stock || 0}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="edit-button" onclick="openModal('${product.id}')" data-testid="edit-product-${product.id}">Edit</button>
                                    <button class="delete-button" onclick="deleteProduct('${product.id}')" data-testid="delete-product-${product.id}">Delete</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = tableHTML;
}

function openModal(productId = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const submitText = document.getElementById('submit-text');
    
    if (productId) {
        const product = products.find(p => p.id === productId);
        if (product) {
            editingProductId = productId;
            modalTitle.textContent = 'Edit Product';
            submitText.textContent = 'Update';
            
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-image').value = product.image;
            document.getElementById('product-category').value = product.category || '';
            document.getElementById('product-stock').value = product.stock || '';
            document.getElementById('product-sizes').value = Array.isArray(product.sizes) ? product.sizes.join(', ') : '';
            document.getElementById('product-description').value = product.description || '';
        }
    } else {
        editingProductId = null;
        modalTitle.textContent = 'Add New Product';
        submitText.textContent = 'Create';
        document.getElementById('product-form').reset();
    }
    
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('product-form').reset();
    editingProductId = null;
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('adminToken');
    const submitButton = e.target.querySelector('.submit-button');
    const submitText = document.getElementById('submit-text');
    
    submitButton.disabled = true;
    submitText.textContent = editingProductId ? 'Updating...' : 'Creating...';
    
    const productData = {
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value),
        image: document.getElementById('product-image').value,
        category: document.getElementById('product-category').value,
        stock: parseInt(document.getElementById('product-stock').value) || 0,
        sizes: document.getElementById('product-sizes').value.split(',').map(s => s.trim()).filter(s => s),
        description: document.getElementById('product-description').value
    };
    
    try {
        const url = editingProductId 
            ? `${API_URL}/api/products/${editingProductId}`
            : `${API_URL}/api/products`;
        
        const method = editingProductId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(editingProductId ? 'Product updated successfully' : 'Product created successfully', 'success');
            closeModal();
            document.getElementById('no-products').style.display = 'none';
            await fetchProducts();
        } else {
            showToast(data.error || 'Operation failed', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error', 'error');
    } finally {
        submitButton.disabled = false;
        submitText.textContent = editingProductId ? 'Update' : 'Create';
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    const token = localStorage.getItem('adminToken');
    
    try {
        const response = await fetch(`${API_URL}/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Product deleted successfully', 'success');
            await fetchProducts();
        } else {
            showToast(data.error || 'Failed to delete product', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error', 'error');
    }
}

function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = 'admin-login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    fetchProducts();
    
    document.getElementById('add-product-btn').addEventListener('click', () => openModal());
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('product-form').addEventListener('submit', handleSubmit);
    
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') {
            closeModal();
        }
    });
});