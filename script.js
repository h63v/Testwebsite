"use strict";


/* =========================================================
   CONFIG
========================================================= */

const SOURCES = [
    {
        type: "Manga",
        file: "files/Manga/index.json"
    },
    {
        type: "Manhwa",
        file: "files/Manhwa/index.json"
    }
];


/* =========================================================
   ELEMENTS
========================================================= */

const mangaGrid =
    document.getElementById("mangaGrid");

const mangaCount =
    document.getElementById("mangaCount");

const popularList =
    document.getElementById("popularList");

const noResults =
    document.getElementById("noResults");

const searchToggle =
    document.getElementById("searchToggle");

const searchPanel =
    document.getElementById("searchPanel");

const searchInput =
    document.getElementById("searchInput");

const clearSearch =
    document.getElementById("clearSearch");

const themeBtn =
    document.getElementById("themeBtn");

const menuBtn =
    document.getElementById("menuBtn");

let allWorks = [];


/* =========================================================
   LOAD DATA
========================================================= */

async function loadWorks() {

    mangaGrid.innerHTML =
        `<div class="loading">جاري تحميل الأعمال...</div>`;

    try {

        const requests = SOURCES.map(async source => {

            try {

                const response =
                    await fetch(source.file, {
                        cache: "no-store"
                    });

                if (!response.ok) {
                    throw new Error(
                        `${source.file} HTTP ${response.status}`
                    );
                }

                const data =
                    await response.json();

                if (!Array.isArray(data)) {
                    return [];
                }

                return data.map(work => ({
                    ...work,
                    type: work.type || source.type
                }));

            } catch (error) {

                console.error(
                    "فشل تحميل:",
                    source.file,
                    error
                );

                return [];
            }

        });


        const results =
            await Promise.all(requests);

        allWorks =
            results.flat();


        renderWorks(allWorks);

        renderPopular(allWorks);

        updateHero(allWorks);

    } catch (error) {

        console.error(error);

        mangaGrid.innerHTML = "";

        noResults.hidden = false;

        mangaCount.textContent =
            "حدث خطأ في تحميل الأعمال";
    }
}


/* =========================================================
   RENDER WORKS
========================================================= */

function renderWorks(works) {

    mangaGrid.innerHTML = "";

    if (!works.length) {

        noResults.hidden = false;

        mangaCount.textContent =
            "0 عمل";

        return;
    }

    noResults.hidden = true;

    mangaCount.textContent =
        `${works.length} عمل`;


    works.forEach(work => {

        const card =
            createWorkCard(work);

        mangaGrid.appendChild(card);

    });

    setupFavorites();
}


/* =========================================================
   CREATE CARD
========================================================= */

function createWorkCard(work) {

    const article =
        document.createElement("article");

    article.className =
        "manga-card";

    article.dataset.title =
        work.name || "";


    const cover =
        work.cover ||
        "https://picsum.photos/500/750";


    const status =
        work.status ||
        "مستمرة";


    const statusClass =
        status === "مكتملة"
            ? "completed"
            : "ongoing";


    const rating =
        work.rating ||
        "—";


    const chapter =
        work.latestChapter ??
        "—";


    const type =
        work.type ||
        "";


    /*
       رابط صفحة العمل
       مثال:
       files/Manga/solo-leveling.html
    */

    const folder =
        type === "Manhwa"
            ? "Manhwa"
            : "Manga";


    const workPage =
        work.page ||
        `${work.slug}.html`;


    const workUrl =
        `files/${folder}/${workPage}`;


    /*
       رابط الفصل الأخير
    */

    let chapterUrl =
        work.latestChapterUrl ||
        "";


    if (chapterUrl) {

        chapterUrl =
            `files/${folder}/${chapterUrl}`;

    } else {

        chapterUrl =
            workUrl;

    }


    article.innerHTML = `

        <div class="cover-container">

            <img
                src="${escapeAttribute(cover)}"
                alt="${escapeAttribute(work.name || "")}"
                loading="lazy"
                onerror="this.src='https://picsum.photos/500/750?random=99'"
            >

            <span class="status ${statusClass}">
                ${escapeHTML(status)}
            </span>

            <button
                class="favorite"
                aria-label="إضافة للمفضلة"
                data-favorite="${escapeAttribute(work.slug || work.name || "")}">
                ♡
            </button>

        </div>


        <div class="manga-content">

            <h3 title="${escapeAttribute(work.name || "")}">
                ${escapeHTML(work.name || "بدون اسم")}
            </h3>


            <div class="rating">
                ⭐ ${escapeHTML(String(rating))}
            </div>


            <div class="chapter-row">

                <span>
                    الفصل ${escapeHTML(String(chapter))}
                </span>

                <span>
                    ${escapeHTML(type)}
                </span>

            </div>


            <div class="card-buttons">

                <a
                    href="${escapeAttribute(chapterUrl)}"
                    class="read-btn">
                    ▶ قراءة
                </a>

                <a
                    href="${escapeAttribute(workUrl)}"
                    class="download-btn">
                    ↓ الفصول
                </a>

            </div>

        </div>

    `;

    return article;
}


/* =========================================================
   POPULAR
========================================================= */

function renderPopular(works) {

    popularList.innerHTML = "";

    if (!works.length) {

        popularList.innerHTML =
            `<div class="loading">لا توجد أعمال.</div>`;

        return;
    }


    const sorted =
        [...works]
            .sort(
                (a, b) =>
                    Number(b.rating || 0) -
                    Number(a.rating || 0)
            )
            .slice(0, 4);


    sorted.forEach((work, index) => {

        const folder =
            work.type === "Manhwa"
                ? "Manhwa"
                : "Manga";


        const item =
            document.createElement("div");

        item.className =
            "popular-item";


        item.innerHTML = `

            <span class="rank">
                ${String(index + 1).padStart(2, "0")}
            </span>

            <img
                src="${escapeAttribute(work.cover || "https://picsum.photos/300/450")}"
                alt="${escapeAttribute(work.name || "")}"
                loading="lazy"
            >

            <div>

                <h3>
                    ${escapeHTML(work.name || "")}
                </h3>

                <p>
                    ${(work.genres || []).map(
                        genre => escapeHTML(genre)
                    ).join(" • ")}
                </p>

                <strong>
                    ⭐ ${escapeHTML(String(work.rating || "—"))}
                </strong>

            </div>

        `;


        item.style.cursor =
            "pointer";


        item.addEventListener(
            "click",
            () => {

                if (work.slug) {

                    window.location.href =
                        `files/${folder}/${work.slug}.html`;

                }

            }
        );


        popularList.appendChild(item);

    });
}


/* =========================================================
   HERO
========================================================= */

function updateHero(works) {

    if (!works.length) return;


    const best =
        [...works]
            .sort(
                (a, b) =>
                    Number(b.rating || 0) -
                    Number(a.rating || 0)
            )[0];


    document.getElementById("heroTitle")
        .textContent =
        best.name || "MangaX";


    document.getElementById("heroRating")
        .textContent =
        `⭐ ${best.rating || "—"}`;


    document.getElementById("heroChapter")
        .textContent =
        `📚 الفصل ${best.latestChapter || "—"}`;


    document.getElementById("heroType")
        .textContent =
        `📖 ${best.type || ""}`;


    document.getElementById("heroDescription")
        .textContent =
        `${(best.genres || []).join(" • ")} — ${best.status || ""}`;


    const hero =
        document.querySelector(".hero-background");


    if (best.cover) {

        hero.style.backgroundImage =
            `url("${best.cover}")`;

    }

}


/* =========================================================
   SEARCH
========================================================= */

searchToggle.addEventListener(
    "click",
    () => {

        searchPanel.classList.toggle("open");

        if (
            searchPanel.classList.contains("open")
        ) {

            searchInput.focus();

        }

    }
);


searchInput.addEventListener(
    "input",
    () => {

        const query =
            searchInput.value
                .trim()
                .toLowerCase();


        if (!query) {

            renderWorks(allWorks);

            return;
        }


        const filtered =
            allWorks.filter(work => {

                const name =
                    String(work.name || "")
                        .toLowerCase();


                const genres =
                    (work.genres || [])
                        .join(" ")
                        .toLowerCase();


                const type =
                    String(work.type || "")
                        .toLowerCase();


                return (
                    name.includes(query) ||
                    genres.includes(query) ||
                    type.includes(query)
                );

            });


        renderWorks(filtered);

    }
);


clearSearch.addEventListener(
    "click",
    () => {

        searchInput.value = "";

        renderWorks(allWorks);

        searchInput.focus();

    }
);


/* =========================================================
   THEME
========================================================= */

const savedTheme =
    localStorage.getItem("mangax-theme");


if (savedTheme === "light") {

    document.body.classList.add("light");

    themeBtn.textContent = "☀";

}


themeBtn.addEventListener(
    "click",
    () => {

        document.body.classList.toggle("light");


        const light =
            document.body.classList.contains("light");


        localStorage.setItem(
            "mangax-theme",
            light ? "light" : "dark"
        );


        themeBtn.textContent =
            light ? "☀" : "☾";

    }
);


/* =========================================================
   MOBILE MENU
========================================================= */

menuBtn.addEventListener(
    "click",
    () => {

        const navigation =
            document.querySelector(".navigation");


        if (
            navigation.style.display === "flex"
        ) {

            navigation.style.display =
                "";

        } else {

            navigation.style.display =
                "flex";

            navigation.style.position =
                "absolute";

            navigation.style.top =
                "68px";

            navigation.style.right =
                "10px";

            navigation.style.left =
                "10px";

            navigation.style.padding =
                "15px";

            navigation.style.background =
                "var(--card)";

            navigation.style.border =
                "1px solid var(--border)";

            navigation.style.borderRadius =
                "15px";

            navigation.style.flexDirection =
                "column";

        }

    }
);


/* =========================================================
   FAVORITES
========================================================= */

function setupFavorites() {

    document
        .querySelectorAll(".favorite")
        .forEach(button => {

            const id =
                button.dataset.favorite;


            const saved =
                JSON.parse(
                    localStorage.getItem(
                        "mangax-favorites"
                    ) || "[]"
                );


            if (saved.includes(id)) {

                button.classList.add("active");

                button.textContent = "♥";

            }


            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    let favorites =
                        JSON.parse(
                            localStorage.getItem(
                                "mangax-favorites"
                            ) || "[]"
                        );


                    if (
                        favorites.includes(id)
                    ) {

                        favorites =
                            favorites.filter(
                                item => item !== id
                            );

                        button.classList.remove(
                            "active"
                        );

                        button.textContent =
                            "♡";

                    } else {

                        favorites.push(id);

                        button.classList.add(
                            "active"
                        );

                        button.textContent =
                            "♥";

                    }


                    localStorage.setItem(
                        "mangax-favorites",
                        JSON.stringify(favorites)
                    );

                }
            );

        });

}


/* =========================================================
   SECURITY / HTML ESCAPING
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

    return escapeHTML(value);

}


/* =========================================================
   START
========================================================= */

loadWorks();
