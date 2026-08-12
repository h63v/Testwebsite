/* =====================================================
   MOBILE MENU
===================================================== */

const menuBtn =
  document.getElementById("menuBtn");

const navigation =
  document.querySelector(".navigation");

menuBtn.addEventListener("click", () => {

  navigation.classList.toggle("show");

});


/* =====================================================
   SEARCH
===================================================== */

const searchToggle =
  document.getElementById("searchToggle");

const searchPanel =
  document.getElementById("searchPanel");

const searchInput =
  document.getElementById("searchInput");

const clearSearch =
  document.getElementById("clearSearch");

const mangaCards =
  document.querySelectorAll(".manga-card");

const noResults =
  document.getElementById("noResults");

const mangaCount =
  document.getElementById("mangaCount");


searchToggle.addEventListener("click", () => {

  searchPanel.classList.toggle("show");

  if (
    searchPanel.classList.contains("show")
  ) {

    searchInput.focus();

  }

});


searchInput.addEventListener(
  "input",
  () => {

    filterManga(
      searchInput.value
    );

  }
);


clearSearch.addEventListener(
  "click",
  () => {

    searchInput.value = "";

    filterManga("");

    searchInput.focus();

  }
);


function filterManga(value) {

  const query =
    value
      .toLowerCase()
      .trim();

  let visible = 0;

  mangaCards.forEach(card => {

    const title =
      card
        .dataset
        .title
        .toLowerCase();

    if (
      title.includes(query)
    ) {

      card.style.display = "";

      visible++;

    } else {

      card.style.display = "none";

    }

  });


  if (visible === 0) {

    noResults.style.display =
      "block";

  } else {

    noResults.style.display =
      "none";

  }


  if (query === "") {

    mangaCount.textContent =
      `${mangaCards.length} مانجا`;

  } else {

    mangaCount.textContent =
      `${visible} نتيجة`;

  }

}


/* =====================================================
   FAVORITES
===================================================== */

document
  .querySelectorAll(".favorite")
  .forEach(button => {

    button.addEventListener(
      "click",
      event => {

        event.preventDefault();

        event.stopPropagation();

        button.classList.toggle(
          "active"
        );

        if (
          button.classList.contains(
            "active"
          )
        ) {

          button.textContent = "♥";

        } else {

          button.textContent = "♡";

        }

      }
    );

  });


/* =====================================================
   THEME
===================================================== */

const themeBtn =
  document.getElementById("themeBtn");


themeBtn.addEventListener(
  "click",
  () => {

    document.body
      .classList
      .toggle("light");


    if (
      document.body.classList.contains(
        "light"
      )
    ) {

      themeBtn.textContent = "☀";

      localStorage.setItem(
        "theme",
        "light"
      );

    } else {

      themeBtn.textContent = "☾";

      localStorage.setItem(
        "theme",
        "dark"
      );

    }

  }
);


/* =====================================================
   LOAD SAVED THEME
===================================================== */

if (
  localStorage.getItem("theme")
  === "light"
) {

  document.body
    .classList
    .add("light");

  themeBtn.textContent = "☀";

}


/* =====================================================
   CLOSE MOBILE MENU
===================================================== */

document
  .querySelectorAll(".navigation a")
  .forEach(link => {

    link.addEventListener(
      "click",
      () => {

        navigation
          .classList
          .remove("show");

      }
    );

  });
