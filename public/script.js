async function initHomePage() {
  const container = document.getElementById("new-products");
  const searchInput = document.getElementById("searchInput");
  try {
    const response = await fetch('/api/search?sort=date_new')
    const products = await response.json();
    container.innerHTML = products.map(product => `
      <a href="/product/${product._id}" class="product-card" style="text-decoration: none; color: inherit;">
      <img src="${product.images || '/placeholder.jpg'}" alt="${product.name}">
      <h3>${product.name}</h3>
      <h2><strong>${product.price} грн</strong></h2>
      <p>${product.description || "Опис відсутній"}</p>
      </a>
      `).join('');
    } catch (error) {
    console.error("Помилка при завантаженні товарів:", error);
    container.innerHTML = "<p>Не вдалося завантажити товари.</p>";
  }
}

function initRegisterPage() {
  const registerForm = document.getElementById('registerForm');

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMsg = document.getElementById('errorMsg');

    if (password !== confirmPassword) {
      errorMsg.textContent = "Паролі не співпадають!";
      return;
    } else {
      errorMsg.textContent = "";
    }

    const formData = {
      firstName: document.getElementById('firstName').value,
      lastName: document.getElementById('lastName').value,
      username: document.getElementById('username').value,
      email: document.getElementById('email').value,
      password: password
    };

    try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
  });

  const result = await response.json();

  if (response.ok) {
  alert(result.message);
  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("username", formData.username);
  registerForm.reset();
  window.location.href = "/";
  } else {
    alert(result.error || "Сталася невідома помилка");
  }
} catch (error) {
  console.error('Помилка при реєстрації:', error);
  alert('Помилка з’єднання або обробки. Деталі: ' + error.message);
}
  });
}

function initLoginPage() {
  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const login = document.getElementById("login").value;
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("errorMsg");

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username", result.username);
        window.location.href = "/";
      } else {
        errorMsg.textContent = result.error || "Невірні дані";
      }
    } catch (error) {
      console.error("Помилка при вході:", error);
      errorMsg.textContent = "Сталася помилка з'єднання";
    }
  });
}

async function fetchSearchResults(query, category) {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (category) params.append('category', category);

  const response = await fetch('/api/search?' + params.toString());
  if (!response.ok) throw new Error('Помилка пошуку');
  return await response.json();
}

async function initSearchPage() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get('query');
  const categoryId = params.get('category');

  const sortSelect = document.getElementById("sortSelect");
  const container = document.getElementById("search-results");

  const sort = params.get('sort') || "";
  if (sortSelect) sortSelect.value = sort;

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      params.set('sort', sortSelect.value);
      history.replaceState(null, "", `${location.pathname}?${params.toString()}`);
      initSearchPage();
    });
  }

  container.innerHTML = "<p>Завантаження...</p>";

  try {
    const apiParams = new URLSearchParams();
    if (query) apiParams.append('query', query);
    if (categoryId) apiParams.append('category', categoryId);
    if (sort) apiParams.append('sort', sort);

    const response = await fetch("/api/search?" + apiParams.toString());
    if (!response.ok) throw new Error('Помилка пошуку');

    const products = await response.json();

    if (products.length === 0) {
      container.innerHTML = "<p>Нічого не знайдено.</p>";
      return;
    }

    container.innerHTML = `
      <div class="product-grid">
      ${products.map(product => `
      <a href="/product/${product._id}" class="product-card" style="text-decoration: none; color: inherit;">
      <img src="${product.images || '/placeholder.jpg'}" alt="${product.name}">
      <h3>${product.name}</h3>
      <h2><strong>${product.price} грн</strong></h2>
      <p>${product.description || "Опис відсутній"}</p>
      </a>
      `).join('')}
      </div>
    `;
  } catch (error) {
    console.error("Помилка пошуку:", error);
    container.innerHTML = "<p>Сталася помилка під час завантаження результатів.</p>";
  }
}


async function initProductPage() {
  if (document.body.dataset.page !== 'product') return;

  const productId = window.location.pathname.split('/').pop();

  try {
    const res = await fetch(`/api/product/${productId}`);
    if (!res.ok) {
      document.querySelector('.product-title').textContent = 'Товар не знайдено';
      return;
    }

    const product = await res.json();

    document.querySelector('.product-title').textContent = product.name;
    document.querySelector('.product-description').textContent = product.description || 'Опис відсутній';
    document.querySelector('.product-brand').textContent = "Бренд: " + product.brand;
    document.querySelector('.product-price strong').textContent = product.price + " грн";

    const stockEl = document.querySelector('.product-stock strong');
    if (stockEl) stockEl.textContent = product.available_stock ?? 'Невідомо';

    const imgEl = document.querySelector('.product-image img');
    if (imgEl) {
      imgEl.src = Array.isArray(product.images) ? product.images[0] : product.images;
      imgEl.alt = product.name;
    }

    const buyButton = document.getElementById("buyButton");
    if (buyButton) {
      buyButton.addEventListener("click", () => addToCart(productId));
    }

  } catch (error) {
    console.error('Помилка завантаження товару:', error);
  }
}


function handleLoginUI() {
  const isLogged = localStorage.getItem("isLoggedIn");
  const username = localStorage.getItem("username");

  const authActions = document.getElementById("auth-actions");
  const userPanel = document.getElementById("user-panel");
  const logoutBtn = document.getElementById("logout-btn");

  if (isLogged === "true" && username) {
    authActions.style.display = "none";
    userPanel.style.display = "inline";

    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("username");
      location.reload();
    });
  } else {
    authActions.style.display = "inline";
    if (userPanel) userPanel.style.display = "none";
  }
}

function addToCart(productId) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const existingItem = cart.find(item => item.productId === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ productId, quantity: 1 });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  alert('Товар додано до кошика!');
}

async function initCartPage() {
  const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
  const response = await fetch('/api/search?sort=date_new')
    const allProducts = await response.json();

    const tbody = document.querySelector("#cart-table tbody");
    let total = 0;

    cartItems.forEach(cartItem => {
      const product = allProducts.find(p => String(p._id) === String(cartItem.productId));
      if (!product) return;

      const row = document.createElement("tr");
      const subtotal = product.price * cartItem.quantity;
      total += subtotal;

      row.innerHTML = `
        <td>${product.name}</td>
        <td>${product.price} грн</td>
        <td>${cartItem.quantity}</td>
        <td>${subtotal} грн</td>
      `;
      tbody.appendChild(row);
    });

    document.getElementById("total-price").textContent = `${total} грн`;
  }

  async function checkout() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const username = localStorage.getItem("username");
  if (!isLoggedIn || !username) {
    alert("Спочатку увійдіть у свій акаунт");
    window.location.href = "/login";
    return;
  }

  const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
  if (cartItems.length === 0) {
    alert("Кошик порожній");
    return;
  }

  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Username': username
      },
      body: JSON.stringify({ items: cartItems })
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Checkout error:", data);
      alert("Помилка оформлення: " + (data.error || res.statusText));
      return;
    }

    alert(`Замовлення №${data.orderId} успішно оформлено!`);
    localStorage.removeItem("cart");
    location.reload();
  } catch (error) {
    alert("Помилка з’єднання: " + error.message);
    console.error("Network error on checkout:", error);
  }
}


  function clearCart() {
    localStorage.removeItem("cart");
    const tbody = document.querySelector("#cart-table tbody");
    if (tbody) tbody.innerHTML = "";
    document.getElementById("total-price").textContent = "0 грн";
  }

async function loadOrderHistory() {
  try {
    const res = await fetch('/api/orders', {
      headers: {
        'X-Username': localStorage.getItem('username')
      }
    });

    if (!res.ok) throw new Error("Помилка отримання історії");

    const orders = await res.json();
    const container = document.getElementById('order-history');
    container.innerHTML = ''; // очищаємо попередній вміст

    if (orders.length === 0) {
      container.innerHTML = '<div class="no-orders">Історія замовлень порожня</div>';
      return;
    }

    orders.forEach(order => {
      const div = document.createElement('div');
      div.className = 'order-item';
      div.innerHTML = `
        <div><strong>Дата:</strong> ${new Date(order.creation_date).toLocaleDateString()}</div>
        <div><strong>Сума:</strong> ${order.sum} грн</div>
        <div><strong>Статус:</strong> ${order.received ? 'Отримано' : 'Очікується'}</div>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error('Помилка історії замовлень:', err);
    document.getElementById('order-history').innerHTML = '<div class="no-orders">Не вдалося завантажити історію</div>';
  }
}


async function initProfilePage() {
  if (document.body.dataset.page !== 'profile') return;
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const username = localStorage.getItem('username');
  if (!isLoggedIn || !username) {
    window.location.href = '/login';
    return;
  }
  try {
    const res = await fetch('/api/profile', {
      headers: {
        'X-Username': username
      }
    });
    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }
    if (!res.ok) {
      throw new Error(`HTTP помилка! Статус: ${res.status}`);
    }
    const userData = await res.json();
    document.getElementById('profile-name').textContent = userData.name;
    document.getElementById('profile-surname').textContent = userData.surname;
    document.getElementById('profile-username').textContent = userData.username;
    document.getElementById('profile-email').textContent = userData.email;
    document.getElementById('profile-phone').textContent = userData.phone;

  } catch (error) {
    console.error('Помилка завантаження профілю:', error);
    document.querySelector('.profile-error').textContent = 'Помилка завантаження даних';
  }
  document.getElementById('edit-phone').addEventListener('click', async () => {
  const newPhone = prompt("Введіть новий номер телефону:");
  if (!newPhone) return;

  try {
    const res = await fetch('/api/profile/phone', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Username': localStorage.getItem('username')
      },
      body: JSON.stringify({ phone: newPhone })
    });

    if (!res.ok) throw new Error("Не вдалося оновити номер");
    document.getElementById('profile-phone').textContent = newPhone;
  } catch (err) {
    alert("Помилка при оновленні номеру: " + err.message);
  }
});

await loadOrderHistory();

document.getElementById('delete-phone').addEventListener('click', async () => {
  if (!confirm("Ви впевнені, що хочете видалити номер телефону?")) return;

  try {
    const res = await fetch('/api/profile/phone', {
      method: 'DELETE',
      headers: {
        'X-Username': localStorage.getItem('username')
      }
    });

    if (!res.ok) throw new Error("Не вдалося видалити номер");
    document.getElementById('profile-phone').textContent = "Відсутній";
  } catch (err) {
    alert("Помилка при видаленні номеру: " + err.message);
  }
});
}

document.addEventListener("DOMContentLoaded", async function () {
  const page = document.body.dataset.page;

  switch (page) {
    case "home":
      await initHomePage();
      break;
    case "register":
      initRegisterPage();
      break;
    case "login":
      initLoginPage();
      break;
    case "search":
      initSearchPage();
      break;
    case "product":
      initProductPage();
      break;
    case "cart":
      initCartPage();
      break;
    case "profile":
      initProfilePage();
      break;
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
  handleLoginUI();
});
