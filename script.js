/* ================= MOBILE MENU ================= */

const menuBtn = document.getElementById("menuBtn");
const navigation = document.querySelector(".navigation");

menuBtn.addEventListener("click", () => {
  navigation.classList.toggle("show");
});


/* ================= SEARCH ================= */

const searchToggle = document.getElementById("searchToggle");
const searchPanel = document.getElementById("searchPanel");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");

searchToggle.addEventListener("click", () => {

  searchPanel.classList.toggle("show");

  if (searchPanel.classList.contains("show")) {
    searchInput.focus();
  }

});


clearSearch.addEventListener("click", () => {

  searchInput.value = "";

  filterManga("");

  searchInput.focus();

});


searchInput.addEventListener("input", () => {

  filterManga(searchInput.value);

});


function filterManga(value) {

  const cards = document.querySelectorAll(".manga-card");

  const query = value.toLowerCase().trim();

  cards.forEach(card => {

    const title =
      card.dataset.title.toLowerCase();

    const category =
      card.dataset.category.toLowerCase();

    if (
      title.includes(query) ||
      category.includes(query)
    ) {

      card.style.display = "";

    } else {

      card.style.display = "none";

    }

  });

}


/* ================= FAVORITES ================= */

document.querySelectorAll(".favorite").forEach(button => {

  button.addEventListener("click", (event) => {

    event.preventDefault();
    event.stopPropagation();

    button.classList.toggle("active");

    if (button.classList.contains("active")) {

      button.textContent = "♥";

    } else {

      button.textContent = "♡";

    }

  });

});


/* ================= THEME ================= */

const themeBtn =
  document.getElementById("themeBtn");

themeBtn.addEventListener("click", () => {

  document.body.classList.toggle("light");

  if (document.body.classList.contains("light")) {

    themeBtn.textContent = "☀";

    localStorage.setItem("theme", "light");

  } else {

    themeBtn.textContent = "☾";

    localStorage.setItem("theme", "dark");

  }

});


/* ================= LOAD THEME ================= */

if (localStorage.getItem("theme") === "light") {

  document.body.classList.add("light");

  themeBtn.textContent = "☀";

}


/* ================= CLOSE MOBILE MENU ================= */

document.querySelectorAll(".navigation a").forEach(link => {

  link.addEventListener("click", () => {

    navigation.classList.remove("show");

  });

});        link.addEventListener('click', function() {
            navLinks.forEach(item => item.classList.remove('active'));
            this.classList.add('active');
        });
    });
});
