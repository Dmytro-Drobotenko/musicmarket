async function initAdminPage() {
  if (document.body.dataset.page !== 'admin') return;

  const urlParams = new URLSearchParams(window.location.search);
  const urlUsername = urlParams.get('username');

  const storedUsername = localStorage.getItem('username');
  const storedRole = localStorage.getItem('role');

  if (storedRole !== 'admin' || storedUsername !== urlUsername) {
    window.location.href = '/';
    return;
  }

  const tableBody = document.getElementById('order-table-body');

  try {
    const res = await fetch('/api/admin/orders');
    const orders = await res.json();

    for (const order of orders) {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${order._id}</td>
        <td>${order.username || `user_id: ${order.user_id}`}</td>
        <td>${new Date(order.creation_date).toLocaleString()}</td>
        <td>${order.sum} грн</td>
        <td>${order.received ? "Отримано" : "Очікує"}</td>
        <td><button class="btn small toggle-details" data-id="${order._id}">Показати</button></td>
      `;

      tableBody.appendChild(tr);

      // Рядок для деталей
      const detailRow = document.createElement('tr');
      detailRow.classList.add('order-details-row');
      detailRow.style.display = 'none';
      detailRow.innerHTML = `
        <td colspan="6">
          <div class="order-items" data-order-id="${order._id}">Завантаження...</div>
        </td>
      `;
      tableBody.appendChild(detailRow);
    }

    tableBody.addEventListener('click', async (e) => {
      const btn = e.target.closest('.toggle-details');
      if (!btn) return;
      const orderId = btn.dataset.id;
      const detailsRow = btn.closest('tr').nextElementSibling;
      const container = detailsRow.querySelector('.order-items');
      if (detailsRow.style.display === 'none') {
        btn.textContent = 'Сховати';
        detailsRow.style.display = '';
        if (!container.dataset.loaded) {
          container.innerHTML = '<div class="loading">Завантаження...</div>';
          try {
            const response = await fetch(`/api/admin/orders/${orderId}/items`);
            const data = await response.json();
            if (!response.ok || !data.success) {
              throw new Error(data.error || 'Помилка завантаження');
            }
            const { items, user } = data;
            let html = `
            <div class="user-info">
                <strong>Користувач:</strong> ${user.name} ${user.surname} ${user.email}
                <hr>
            </div>
            `;
            if (items && items.length > 0) {
              html += '<ul>';
              items.forEach(item => {
                html += `
                <li>
                    <a href="/product/${item.product_id}" target="_blank">
                    Товар #${item.product_id}: ${item.quantity} × ${item.unit_price} грн
                    </a>
                </li>
                `;
              });
              html += '</ul>';
            } else {
              html += '<p class="no-items">Немає товарів у замовленні</p>';
            }
            container.innerHTML = html;
            container.dataset.loaded = "true";
          } catch (error) {
            console.error('Помилка:', error);
            container.innerHTML = `
            <div class="error">
                <p>${error.message}</p>
            </div>
            `;
            container.dataset.loaded = "true";
            }
          }
        } else {
          btn.textContent = 'Показати';
          detailsRow.style.display = 'none';
        }
    });
  } catch (error) {
    console.error('Помилка при завантаженні замовлень:', error);
    tableBody.innerHTML = `<tr><td colspan="6">Помилка завантаження</td></tr>`;
  }
  const categoriesBtn = document.getElementById('categoriesBtn');
  const categoriesList = document.getElementById('categoriesList');
  if (categoriesBtn && categoriesList) {
    categoriesBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (categoriesList.style.display === 'none' || categoriesList.style.display === '') {
        try {
          const response = await fetch('/categories');
          if (!response.ok) throw new Error('Не вдалося завантажити категорії');
          const categories = await response.json();
          categoriesList.innerHTML = categories.map(cat => `<li><a href="/search?category=${cat._id}">${cat.category_name}</a></li>`).join('');
          categoriesList.style.display = 'block';
        } catch (error) {
          console.error('Помилка при завантаженні категорій:', error);
          categoriesList.innerHTML = '<li>Помилка завантаження</li>';
          categoriesList.style.display = 'block';
       }
     } else {
       categoriesList.style.display = 'none';
      }
    });
    document.addEventListener('click', (event) => {
     if (
        !categoriesBtn.contains(event.target) &&
        !categoriesList.contains(event.target)
      ) {
        categoriesList.style.display = 'none';
      }
    });
  }
}

initAdminPage();