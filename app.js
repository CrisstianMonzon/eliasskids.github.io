let products = [];
let cart = [];
let currentCategory = 'todos';

async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}?action=getData`);
        const data = await response.json();
        if(data.status === 'success') {
            products = data.productos;
            renderProducts(products);
        }
    } catch (error) {
        console.error("Error al cargar productos", error);
        document.getElementById('product-grid').innerHTML = `<div class="col-span-full text-center text-red-500">Error al conectar con la base de datos. Verifica la URL de configuración.</div>`;
    }
}

function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    if (items.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-400">No hay productos disponibles en esta categoría.</div>`;
        return;
    }

    grid.innerHTML = items.map(p => `
        <div class="bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden flex flex-col">
            <img src="${p.imagen || 'https://via.placeholder.com/300'}" alt="${p.nombre}" class="w-full h-48 object-cover">
            <div class="p-4 flex flex-col flex-1">
                <span class="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">${p.categoria} - Talle: ${p.talle}</span>
                <h3 class="font-bold text-lg mb-1">${p.nombre}</h3>
                <div class="flex justify-between items-center mt-auto pt-2">
                    <span class="text-xl font-extrabold text-gray-900">$${Number(p.precio).toFixed(2)}</span>
                    <span class="text-xs text-gray-500">Stock: ${p.stock}</span>
                </div>
                <button onclick="addToCart('${p.id}')" ${p.stock <= 0 ? 'disabled' : ''} class="mt-3 w-full bg-indigo-50 text-indigo-600 py-2 rounded-lg font-medium hover:bg-indigo-600 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed">
                    ${p.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
                </button>
            </div>
        </div>
    `).join('');
}

function filterCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white');
        btn.classList.add('bg-white', 'text-gray-600', 'border');
    });
    event.target.classList.remove('bg-white', 'text-gray-600', 'border');
    event.target.classList.add('bg-indigo-600', 'text-white');
    filterProducts();
}

function filterProducts() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const filtered = products.filter(p => {
        const matchesCat = currentCategory === 'todos' || p.categoria.toLowerCase() === currentCategory;
        const matchesSearch = p.nombre.toLowerCase().includes(query) || p.talle.toLowerCase().includes(query);
        return matchesCat && matchesSearch;
    });
    renderProducts(filtered);
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.classList.toggle('hidden');
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    const cartItem = cart.find(item => item.id === id);

    if (cartItem) {
        if (cartItem.cantidad < Number(product.stock)) {
            cartItem.cantidad++;
        } else {
            alert('Has alcanzado el límite del stock disponible.');
        }
    } else {
        cart.push({ ...product, cantidad: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.cantidad, 0);
    document.getElementById('cart-count').innerText = count;

    const container = document.getElementById('cart-items');
    if (cart.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-400 py-8">Tu carrito está vacío</p>`;
        document.getElementById('cart-total').innerText = '$0.00';
        return;
    }

    container.innerHTML = cart.map(item => `
        py-4 flex justify-between items-center">
            <div>
                <h4 class="font-bold text-sm">${item.nombre}</h4>
                <p class="text-xs text-gray-500">Talle: ${item.talle} | $${item.precio} c/u</p>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="changeQty('${item.id}', -1)" class="bg-gray-200 px-2 py-0.5 rounded text-sm">-</button>
                <span class="text-sm font-bold">${item.cantidad}</span>
                <button onclick="changeQty('${item.id}', 1)" class="bg-gray-200 px-2 py-0.5 rounded text-sm">+</button>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    document.getElementById('cart-total').innerText = `$${total.toFixed(2)}`;
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    const product = products.find(p => p.id === id);
    if (item) {
        item.cantidad += delta;
        if (item.cantidad > Number(product.stock)) {
            item.cantidad = product.stock;
            alert('Stock máximo alcanzado.');
        }
        if (item.cantidad <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        updateCartUI();
    }
}

async function checkout() {
    if (cart.length === 0) return alert('El carrito está vacío');
    const metodoPago = document.getElementById('payment-method').value;
    const total = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    const saleData = {
        action: "registerSale",
        sale: {
            total: total,
            metodoPago: metodoPago,
            detalles: cart.map(i => ({ id: i.id, nombre: i.nombre, cantidad: i.cantidad, precio: i.precio }))
        }
    };

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify(saleData)
        });
        const result = await res.json();
        if (result.status === 'success') {
            alert(`¡Compra registrada con éxito! ID de operación: ${result.idVenta}`);
            cart = [];
            updateCartUI();
            toggleCart();
            fetchProducts(); // Recargar stock actualizado
        } else {
            alert('Hubo un error al procesar la venta.');
        }
    } catch (e) {
        console.error(e);
        alert('Error de red al procesar la compra.');
    }
}

window.onload = fetchProducts;
