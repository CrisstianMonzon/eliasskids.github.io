let adminProducts = [];
let adminSales = [];

function handleLogin(e) {
    e.preventDefault();
    const pass = document.getElementById('admin-pass').value;
    if (pass === 'admin123') { // Puedes cambiar la contraseña aquí
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('admin-dashboard').classList.remove('hidden');
        fetchAdminData();
    } else {
        alert('Contraseña incorrecta');
    }
}

async function fetchAdminData() {
    try {
        const response = await fetch(`${API_URL}?action=getData`);
        const data = await response.json();
        if (data.status === 'success') {
            adminProducts = data.productos;
            adminSales = data.ventas;
            renderAdminProducts();
            renderAdminSales(adminSales);
        }
    } catch (e) {
        console.error(e);
        alert('Error al conectar con Google Sheets.');
    }
}

function renderAdminProducts() {
    const tbody = document.getElementById('admin-product-table');
    if (adminProducts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-gray-400">No hay productos registrados.</td></tr>`;
        return;
    }
    tbody.innerHTML = adminProducts.map(p => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-4"><img src="${p.imagen}" class="w-10 h-10 object-cover rounded"></td>
            <td class="p-4 font-medium">${p.nombre}</td>
            <td class="p-4 uppercase text-xs text-indigo-600 font-semibold">${p.categoria}</td>
            <td class="p-4">$${Number(p.precio).toFixed(2)}</td>
            <td class="p-4 font-bold ${p.stock <= 5 ? 'text-red-500' : ''}">${p.stock}</td>
            <td class="p-4">${p.talle}</td>
            <td class="p-4 text-center space-x-2">
                <button onclick="editProduct('${p.id}')" class="text-blue-500 hover:text-blue-700"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteProduct('${p.id}')" class="text-red-500 hover:text-red-700"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function renderAdminSales(sales) {
    const tbody = document.getElementById('admin-sales-table');
    if (sales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400">No hay ventas registradas.</td></tr>`;
        return;
    }
    tbody.innerHTML = sales.map(s => {
        let detailsText = '';
        try {
            const parsed = JSON.parse(s.detalles);
            detailsText = parsed.map(d => `${d.cantidad}x ${d.nombre}`).join(', ');
        } catch(err) {
            detailsText = s.detalles;
        }
        return `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-4 font-mono text-xs">${s.idVenta}</td>
                <td class="p-4">${new Date(s.fecha).toLocaleString()}</td>
                <td class="p-4">${s.metodoPago}</td>
                <td class="p-4 font-bold text-green-600">$${Number(s.total).toFixed(2)}</td>
                <td class="p-4 text-xs text-gray-500">${detailsText}</td>
            </tr>
        `;
    }).join('');
}

function switchTab(tab) {
    if (tab === 'productos') {
        document.getElementById('tab-productos').classList.remove('hidden');
        document.getElementById('tab-ventas').classList.add('hidden');
        document.getElementById('tab-prod-btn').className = "pb-2 font-bold text-indigo-600 border-b-2 border-indigo-600";
        document.getElementById('tab-sales-btn').className = "pb-2 font-bold text-gray-500 hover:text-indigo-600";
    } else {
        document.getElementById('tab-productos').classList.add('hidden');
        document.getElementById('tab-ventas').classList.remove('hidden');
        document.getElementById('tab-sales-btn').className = "pb-2 font-bold text-indigo-600 border-b-2 border-indigo-600";
        document.getElementById('tab-prod-btn').className = "pb-2 font-bold text-gray-500 hover:text-indigo-600";
    }
}

function openProductModal(p = null) {
    document.getElementById('product-modal').classList.remove('hidden');
    if (p) {
        document.getElementById('modal-title').innerText = "Editar Producto";
        document.getElementById('prod-id').value = p.id;
        document.getElementById('prod-nombre').value = p.nombre;
        document.getElementById('prod-categoria').value = p.categoria;
        document.getElementById('prod-talle').value = p.talle;
        document.getElementById('prod-precio').value = p.precio;
        document.getElementById('prod-stock').value = p.stock;
        document.getElementById('prod-imagen').value = p.imagen;
    } else {
        document.getElementById('modal-title').innerText = "Agregar Producto";
        document.getElementById('prod-id').value = "";
        document.getElementById('prod-nombre').value = "";
        document.getElementById('prod-talle').value = "";
        document.getElementById('prod-precio').value = "";
        document.getElementById('prod-stock').value = "";
        document.getElementById('prod-imagen').value = "";
    }
}

function closeProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
}

async function saveProductData(e) {
    e.preventDefault();
    const product = {
        id: document.getElementById('prod-id').value,
        nombre: document.getElementById('prod-nombre').value,
        categoria: document.getElementById('prod-categoria').value,
        talle: document.getElementById('prod-talle').value,
        precio: document.getElementById('prod-precio').value,
        stock: document.getElementById('prod-stock').value,
        imagen: document.getElementById('prod-imagen').value
    };

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ action: "saveProduct", product })
        });
        const result = await res.json();
        if (result.status === 'success') {
            closeProductModal();
            fetchAdminData();
        } else {
            alert('Error al guardar el producto.');
        }
    } catch(err) {
        console.error(err);
        alert('Error de red.');
    }
}

function editProduct(id) {
    const p = adminProducts.find(prod => prod.id === id);
    if (p) openProductModal(p);
}

async function deleteProduct(id) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ action: "deleteProduct", id })
        });
        const result = await res.json();
        if (result.status === 'success') {
            fetchAdminData();
        } else {
            alert('Error al eliminar.');
        }
    } catch(err) {
        console.error(err);
        alert('Error de red.');
    }
}

function generateReport(tipo) {
    const now = new Date();
    let filtered = adminSales.filter(s => {
        const saleDate = new Date(s.fecha);
        if (tipo === 'diario') {
            return saleDate.toDateString() === now.toDateString();
        } else if (tipo === 'semanal') {
            const diffTime = Math.abs(now - saleDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 7;
        } else if (tipo === 'mensual') {
            return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        }
        return true;
    });

    renderAdminSales(filtered);
    alert(`Mostrando reporte ${tipo}. Total de transacciones en este período: ${filtered.length}`);
}
