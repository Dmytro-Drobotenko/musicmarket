async function initHomePage() {
  const container = document.getElementById("top-products");
  const searchInput = document.getElementById("searchInput");
  try {
    const response = await fetch("/top-products");
    const products = await response.json();
    container.innerHTML = products.map(product => `
      <a href="/product/${product._id}" class="product-card" style="text-decoration: none; color: inherit;">
      <h3>${product.name}</h3>
      <p>${product.description || "Опис відсутній"}</p>
      <p><strong>${product.price} грн</strong></p>
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
  const products = await response.json();
  return products;
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

  const container = document.getElementById("search-results");
  container.innerHTML = "<p>Завантаження...</p>";

  try {
    const products = await fetchSearchResults(query, categoryId);

    if (products.length === 0) {
      container.innerHTML = "<p>Нічого не знайдено.</p>";
      return;
    }

    container.innerHTML = products.map(product => `
      <a href="/product/${product._id}" class="product-card" style="text-decoration: none; color: inherit; display: block; cursor: pointer;">
      <h3>${product.name}</h3>
      <p>${product.description || "Опис відсутній"}</p>
      <p><strong>${product.price} грн</strong></p>
      </a>
    `).join('');
  } catch (error) {
    console.error("Помилка пошуку:", error);
    container.innerHTML = "<p>Сталася помилка під час завантаження результатів.</p>";
  }
}


async function initSearchPage() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get('query');
  const categoryId = params.get('category');

  const container = document.getElementById("search-results");
  container.innerHTML = "<p>Завантаження...</p>";

  try {
    const apiParams = new URLSearchParams();
    if (query) apiParams.append('query', query);
    if (categoryId) apiParams.append('category', categoryId);

    const response = await fetch("/api/search?" + apiParams.toString());
    if (!response.ok) throw new Error('Помилка пошуку');

    const products = await response.json();

    if (products.length === 0) {
      container.innerHTML = "<p>Нічого не знайдено.</p>";
      return;
    }

    container.innerHTML = products.map(product => `
      <div class="product-card">
        <h3>${product.name}</h3>
        <p>${product.description || "Опис відсутній"}</p>
        <p><strong>${product.price} грн</strong></p>
      </div>
    `).join('');
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
    const product = await res.json();

    if (res.status !== 200) {
      document.querySelector('.product-title').textContent = 'Товар не знайдено';
      return;
    }

    document.querySelector('.product-title').textContent = product.name;
    document.querySelector('.product-description').textContent = product.description;
    document.querySelector('.product-price strong').textContent = product.price + " грн";
    document.querySelector('.product-stock strong').textContent = product.available_stock;
    document.querySelector('.product-image img').src = product.images?.[0] || '/placeholder.jpg';
    document.querySelector('.product-image img').alt = product.name;
  } catch (error) {
    console.error('Помилка завантаження товару:', error);
  }
  const buyButton = document.getElementById("buyButton");
  if (buyButton) {
    buyButton.addEventListener("click", () => addToCart(productId));
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
  const response = await fetch("/top-products"); // отримуємо всі продукти
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

  function checkout() {
    alert("Дякуємо за замовлення! (Тестовий функціонал)");
    localStorage.removeItem("cart");
    location.reload();
  }

  function clearCart() {
    localStorage.removeItem("cart");
    const tbody = document.querySelector("#cart-table tbody");
    if (tbody) tbody.innerHTML = "";
    document.getElementById("total-price").textContent = "0 грн";
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
  }
  
  const categoriesBtn = document.getElementById('categoriesBtn');
  const categoriesList = document.getElementById('categoriesList');
  if (categoriesBtn && categoriesList) {
    categoriesBtn.addEventListener('click', async (e) => {
      e.preventDefault(); // Щоб не прокручувалась сторінка

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
