async function initHomePage() {
  const container = document.getElementById("top-products");
  try {
    const response = await fetch("/top-products");
    const products = await response.json();
    container.innerHTML = products.map(product => `
      <div class="product-card">
        <h3>${product.name}</h3>
        <p>${product.description || "Опис відсутній"}</p>
        <p><strong>${product.price} грн</strong></p>
      </div>
    `).join('');
  } catch (error) {
    console.error("Помилка при завантаженні товарів:", error);
    container.innerHTML = "<p>Не вдалося завантажити товари.</p>";
  }
}

// Каталог
function initCatalogPage() {
  console.log("Це каталог");
  // Завантажити всі товари
}

// Контакти
function initContactsPage() {
  console.log("Це контакти");
  // Обробка форми зворотного зв’язку
}

// Визначаємо сторінку по URL або <body data-page="home">
document.addEventListener("DOMContentLoaded", async function () {
  const page = document.body.dataset.page;

  switch (page) {
    case "home":
      await initHomePage();
      break;
    case "catalog":
      initCatalogPage();
      break;
    case "contacts":
      initContactsPage();
      break;
  }

  // Код, який працює скрізь:
  handleLoginUI();
});

// Приклад функції, спільної для всіх сторінок
function handleLoginUI() {
  const isLogged = localStorage.getItem("isLoggedIn");
  const username = localStorage.getItem("username");
  if (isLogged === "true" && username) {
    document.getElementById("loginBtn").style.display = "none";
    document.getElementById("registerBtn").style.display = "none";
    document.getElementById("initial").textContent = username.charAt(0);
  }
}
