document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = 'https://api.escuelajs.co/api/v1/products';
    const tbody = document.getElementById('product-list');
    const searchInput = document.getElementById('searchInput');
    const paginationContainer = document.getElementById('pagination');

    let allProducts = [];
    let currentFilteredProducts = [];
    let currentPage = 1;
    const itemsPerPage = 5;

    const renderTable = (products) => {
        tbody.innerHTML = '';
        const fragment = document.createDocumentFragment();

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Không tìm thấy sản phẩm nào</td></tr>';
            return;
        }

        products.forEach(p => {
            let apiImage = p.images?.[0];

            if (Array.isArray(apiImage)) apiImage = apiImage[0];
            if (!apiImage) apiImage = 'https://via.placeholder.com/100';

            const tr = document.createElement('tr');

            tr.setAttribute('title', p.description || 'No description');
            tr.setAttribute('data-bs-toggle', 'tooltip');
            tr.setAttribute('data-bs-placement', 'top');
            tr.style.cursor = 'pointer';

            tr.innerHTML = `
                <td>${p.id}</td>
                <td class="fw-bold">${p.title}</td>
                <td class="text-success fw-bold">$${p.price}</td>
                <td>${p.category?.name ?? 'N/A'}</td>
                <td>
                    <img
                      src="${apiImage}"
                      class="product-img"
                      loading="lazy"
                      referrerpolicy="no-referrer"
                      onerror="this.onerror=null;this.src='https://picsum.photos/seed/${p.id}/100';">
                </td>
            `;

            tr.addEventListener('click', () => openModal(p));

            fragment.appendChild(tr);
        });

        tbody.appendChild(fragment);

        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    };

    const renderPagination = () => {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(currentFilteredProducts.length / itemsPerPage);

        if (totalPages <= 1) return;

        const createPageItem = (text, page, isActive = false, isDisabled = false) => {
            const li = document.createElement('li');
            li.className = `page-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`;
            const a = document.createElement('a');
            a.className = 'page-link';
            a.href = '#';
            a.textContent = text;
            if (!isDisabled) {
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    currentPage = page;
                    updateDisplay();
                });
            }
            li.appendChild(a);
            return li;
        };

        paginationContainer.appendChild(createPageItem('Previous', currentPage - 1, false, currentPage === 1));

        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationContainer.appendChild(createPageItem(i, i, i === currentPage));
        }

        paginationContainer.appendChild(createPageItem('Next', currentPage + 1, false, currentPage === totalPages));
    };

    const updateDisplay = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = currentFilteredProducts.slice(startIndex, endIndex);

        renderTable(paginatedItems);
        renderPagination();
    };

    fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
            allProducts = data;
            currentFilteredProducts = [...data];
            updateDisplay();
        })
        .catch(err => {
            console.error(err);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Lỗi khi tải dữ liệu</td></tr>';
        });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        currentFilteredProducts = allProducts.filter(p =>
            p.title.toLowerCase().includes(searchTerm)
        );
        currentPage = 1;

        currentSort = { column: null, direction: 'asc' };
        document.querySelectorAll('.sortable .sort-icon').forEach(icon => icon.textContent = '⇅');

        updateDisplay();
    });

    let currentSort = {
        column: null,
        direction: 'asc'
    };

    const sortData = (column) => {
        if (currentSort.column === column) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.column = column;
            currentSort.direction = 'asc';
        }

        document.querySelectorAll('.sortable .sort-icon').forEach(icon => icon.textContent = '⇅');
        const activeHeader = document.querySelector(`th[data-sort="${column}"] .sort-icon`);
        if (activeHeader) {
            activeHeader.textContent = currentSort.direction === 'asc' ? '↑' : '↓';
        }

        currentFilteredProducts.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });

        updateDisplay();
    };

    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-sort');
            sortData(column);
        });
    });

    const btnReset = document.getElementById('btnReset');
    btnReset.addEventListener('click', () => {
        searchInput.value = '';

        currentFilteredProducts = [...allProducts];

        currentPage = 1;

        currentSort = {
            column: null,
            direction: 'asc'
        };
        document.querySelectorAll('.sortable .sort-icon').forEach(icon => icon.textContent = '⇅');

        updateDisplay();
    });

    const btnExport = document.getElementById('btnExport');
    btnExport.addEventListener('click', () => {
        if (currentFilteredProducts.length === 0) {
            alert('Không có dữ liệu để xuất!');
            return;
        }

        const headers = ['ID', 'Title', 'Price', 'Category', 'Image URL'];

        const rows = currentFilteredProducts.map(p => {
            const id = p.id;
            const title = `"${(p.title || '').replace(/"/g, '""')}"`;
            const price = p.price;
            const category = `"${(p.category?.name || '').replace(/"/g, '""')}"`;
            const image = p.images?.[0] || '';

            return [id, title, price, category, image].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'products_export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    const createModalEl = document.getElementById('createProductModal');
    const createProductModal = new bootstrap.Modal(createModalEl);
    const btnAdd = document.getElementById('btnAdd');
    const btnCreateSave = document.getElementById('btnCreateSave');

    btnAdd.addEventListener('click', () => {
        console.log('Add Button Clicked');
        document.getElementById('createProductForm').reset();
        createProductModal.show();
    });

    btnCreateSave.addEventListener('click', () => {
        const title = document.getElementById('createTitle').value;
        const price = document.getElementById('createPrice').value;
        const description = document.getElementById('createDescription').value;
        const categoryId = document.getElementById('createCategoryId').value;
        const image = document.getElementById('createImage').value;

        if (!title || !price || !description || !categoryId || !image) {
            alert('Please fill in all fields');
            return;
        }

        const newProduct = {
            title: title,
            price: parseFloat(price),
            description: description,
            categoryId: parseInt(categoryId),
            images: [image]
        };

        btnCreateSave.textContent = 'Creating...';
        btnCreateSave.disabled = true;

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newProduct)
        })
            .then(res => {
                if (!res.ok) throw new Error('Create failed');
                return res.json();
            })
            .then(createdProduct => {
                alert('Tạo sản phẩm thành công!');

                allProducts.unshift(createdProduct);

                searchInput.value = '';
                currentFilteredProducts = [...allProducts];
                currentPage = 1;

                currentSort = { column: null, direction: 'asc' };
                document.querySelectorAll('.sortable .sort-icon').forEach(icon => icon.textContent = '⇅');

                updateDisplay();
                createProductModal.hide();
            })
            .catch(err => {
                console.error(err);
                alert('Lỗi khi tạo: ' + err.message);
            })
            .finally(() => {
                btnCreateSave.textContent = 'Create';
                btnCreateSave.disabled = false;
            });
    });

    const modalEl = document.getElementById('productModal');
    const productModal = new bootstrap.Modal(modalEl);
    const modalId = document.getElementById('modalId');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalDescription = document.getElementById('modalDescription');
    const modalImage = document.getElementById('modalImage');
    const btnEdit = document.getElementById('btnEdit');
    const btnSave = document.getElementById('btnSave');

    let currentEditingProduct = null;

    const openModal = (product) => {
        currentEditingProduct = product;

        modalId.value = product.id;
        modalTitle.value = product.title;
        modalPrice.value = product.price;
        modalDescription.value = product.description;
        modalImage.src = product.images?.[0] || 'https://via.placeholder.com/300';

        setEditMode(false);

        productModal.show();
    };

    const setEditMode = (isEdit) => {
        const inputs = [modalTitle, modalPrice, modalDescription];
        inputs.forEach(input => {
            if (isEdit) {
                input.removeAttribute('readonly');
                input.classList.add('bg-white');
            } else {
                input.setAttribute('readonly', true);
                input.classList.remove('bg-white');
            }
        });

        if (isEdit) {
            btnEdit.classList.add('d-none');
            btnSave.classList.remove('d-none');
        } else {
            btnEdit.classList.remove('d-none');
            btnSave.classList.add('d-none');
        }
    };

    btnEdit.addEventListener('click', () => {
        setEditMode(true);
    });

    btnSave.addEventListener('click', () => {
        if (!currentEditingProduct) return;

        const updatedData = {
            title: modalTitle.value,
            price: parseFloat(modalPrice.value),
            description: modalDescription.value,
            categoryId: currentEditingProduct.category.id,
            images: currentEditingProduct.images
        };

        btnSave.textContent = 'Saving...';
        btnSave.disabled = true;

        fetch(`${apiUrl}/${currentEditingProduct.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        })
            .then(res => res.json())
            .then(updatedProduct => {
                alert('Cập nhật thành công!');

                const index = allProducts.findIndex(p => p.id === updatedProduct.id);
                if (index !== -1) {
                    allProducts[index] = { ...allProducts[index], ...updatedProduct };

                    const filterIndex = currentFilteredProducts.findIndex(p => p.id === updatedProduct.id);
                    if (filterIndex !== -1) {
                        currentFilteredProducts[filterIndex] = { ...currentFilteredProducts[filterIndex], ...updatedProduct };
                    }

                    updateDisplay();
                }

                productModal.hide();
            })
            .catch(err => {
                console.error(err);
                alert('Lỗi cập nhật: ' + err.message);
            })
            .finally(() => {
                btnSave.textContent = 'Save Changes';
                btnSave.disabled = false;
            });
    });
});
