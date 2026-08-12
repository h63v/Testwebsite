"use strict";

/* =========================================================
   DATA SOURCES
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

const mangaGrid = document.getElementById("mangaGrid");
const mangaCount = document.getElementById("mangaCount");
const popularList = document.getElementById("popularList");
const noResults = document.getElementById("noResults");

const searchToggle = document.getElementById("searchToggle");
const searchPanel = document.getElementById("searchPanel");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");

const themeBtn = document.getElementById("themeBtn");
const menuBtn = document.getElementById("menuBtn");

let allWorks = [];


/* =========================================================
   NORMALIZE URL
========================================================= */

/*
    هذه الدالة تضمن أن الرابط ينتهي بـ .html

    solo-leveling
        ↓
    solo-leveling.html

    solo-leveling.html
        ↓
    solo-leveling.html
*/

function normalizeHtmlFile(filename) {

    if (!filename) {
        return "";
    }

    filename = String(filename).trim();

    if (!filename.toLowerCase().endsWith(".html")) {
        filename += ".html";
    }

    return filename;
}


/* =========================================================
   GET WORK PAGE URL
========================================================= */

function getWorkUrl(work) {

    /*
        نوع المحتوى يحدد المجلد
    */

    const folder =
        String(work.type || "Manga").toLowerCase() === "manhwa"
            ? "Manhwa"
            : "Manga";


    /*
        نستخدم page أولاً.

        مثال:
        "solo-leveling.html"
    */

    let page = work.page;


    /*
        إذا لم يوجد page،
        نستخدم slug ونضيف .html
    */

    if (!page) {
        page = work.slug;
    }


    /*
        تأكد من وجود .html
    */

    page = normalizeHtmlFile(page);


    /*
        النتيجة:

        files/Manga/solo-leveling.html
    */

    return `files/${folder}/${page}`;
}


/* =========================================================
   GET CHAPTER URL
========================================================= */

function getChapterUrl(work) {

    const folder =
        String(work.type || "Manga").toLowerCase() === "manhwa"
            ? "Manhwa"
            : "Manga";


    if (!work.latestChapterUrl) {
        return getWorkUrl(work);
    }


    const chapter =
        normalizeHtmlFile(
            work.latestChapterUrl
        );


    /*
        files/Manga/
        solo-leveling-chapter-2.html
    */

    return `files/${folder}/${chapter}`;
}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadWorks() {

    mangaGrid.innerHTML = `
        <div class="loading">
            جاري تحميل الأعمال...
        </div>
    `;


    try {

        const requests =
            SOURCES.map(async source => {

                try {

                    const response =
                        await fetch(
                            source.file,
                            {
                                cache: "no-store"
                            }
                        );


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

                        type:
                            work.type ||
                            source.type

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
            await Promise.all(
                requests
            );


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
   CREATE WORK CARD
========================================================= */

function createWorkCard(work) {

    const article =
        document.createElement("article");


    article.className =
        "manga-card";


    article.dataset.title =
        work.name || "";


    /* -------------------------------
       DATA
    -------------------------------- */

    const name =
        work.name ||
        "بدون اسم";


    const cover =
        work.cover ||
        "https://picsum.photos/500/750?random=99";


    const status =
        work.status ||
        "مستمرة";


    const statusClass =
        status === "مكتملة"
            ? "completed"
            : "ongoing";


    const rating =
        work.rating ?? "—";


    const latestChapter =
        work.latestChapter ?? "—";


    const type =
        work.type || "";


    /* -------------------------------
       URLS
    -------------------------------- */

    /*
        صفحة العمل

        مثال:

        files/Manga/solo-leveling.html
    */

    const workUrl =
        getWorkUrl(work);


    /*
        آخر فصل

        مثال:

        files/Manga/
        solo-leveling-chapter-2.html
    */

    const chapterUrl =
        getChapterUrl(work);


    /* -------------------------------
       CARD
    -------------------------------- */

    article.innerHTML = `

        <div class="cover-container">

            <img
                src="${escapeAttribute(cover)}"
                alt="${escapeAttribute(name)}"
                loading="lazy"
                onerror="
                    this.src='https://picsum.photos/500/750?random=99'
                "
            >

            <span class="status ${statusClass}">
                ${escapeHTML(status)}
            </span>

            <button
                class="favorite"
                aria-label="إضافة للمفضلة"
                data-favorite="${escapeAttribute(
                    work.slug || name
                )}">
                ♡
            </button>

        </div>


        <div class="manga-content">

            <h3
                title="${escapeAttribute(name)}">

                ${escapeHTML(name)}

            </h3>


            <div class="rating">

                ⭐ ${escapeHTML(
                    String(rating)
                )}

            </div>


            <div class="chapter-row">

                <span>
                    الفصل ${escapeHTML(
                        String(latestChapter)
                    )}
                </span>

                <span>
                    ${escapeHTML(type)}
                </span>

            </div>


            <div class="card-buttons">

                <!--
                    صفحة العمل
                    وليس الفصل
                -->

                <a
                    href="${escapeAttribute(workUrl)}"
                    class="read-btn">

                    📖 العمل

                </a>


                <!--
                    آخر فصل
                -->

                <a
                    href="${escapeAttribute(chapterUrl)}"
                    class="download-btn">

                    الفصل الأخير

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

        popularList.innerHTML = `
            <div class="loading">
                لا توجد أعمال.
            </div>
        `;

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


    sorted.forEach(
        (work, index) => {

            const item =
                document.createElement("div");


            item.className =
                "popular-item";


            const name =
                work.name ||
                "بدون اسم";


            const genres =
                Array.isArray(work.genres)
                    ? work.genres
                    : [];


            const workUrl =
                getWorkUrl(work);


            item.innerHTML = `

                <span class="rank">

                    ${String(index + 1).padStart(
                        2,
                        "0"
                    )}

                </span>


                <img
                    src="${escapeAttribute(
                        work.cover ||
                        "https://picsum.photos/300/450"
                    )}"
                    alt="${escapeAttribute(name)}"
                    loading="lazy"
                >


                <div>

                    <h3>
                        ${escapeHTML(name)}
                    </h3>


                    <p>
                        ${genres
                            .map(
                                genre =>
                                    escapeHTML(
                                        genre
                                    )
                            )
                            .join(" • ")}
                    </p>


                    <strong>

                        ⭐ ${escapeHTML(
                            String(
                                work.rating || "—"
                            )
                        )}

                    </strong>

                </div>

            `;


            item.style.cursor =
                "pointer";


            item.addEventListener(
                "click",
                () => {

                    /*
                        يفتح صفحة العمل
                        وليس الفصل
                    */

                    window.location.href =
                        workUrl;

                }
            );


            popularList.appendChild(item);

        }
    );

}


/* =========================================================
   HERO
========================================================= */

function updateHero(works) {

    if (!works.length) {
        return;
    }


    const best =
        [...works]
            .sort(
                (a, b) =>
                    Number(b.rating || 0) -
                    Number(a.rating || 0)
            )[0];


    const heroTitle =
        document.getElementById(
            "heroTitle"
        );


    const heroDescription =
        document.getElementById(
            "heroDescription"
        );


    const heroRating =
        document.getElementById(
            "heroRating"
        );


    const heroChapter =
        document.getElementById(
            "heroChapter"
        );


    const heroType =
        document.getElementById(
            "heroType"
        );


    if (heroTitle) {

        heroTitle.textContent =
            best.name || "MangaX";

    }


    if (heroRating) {

        heroRating.textContent =
            `⭐ ${best.rating || "—"}`;

    }


    if (heroChapter) {

        heroChapter.textContent =
            `📚 الفصل ${
                best.latestChapter || "—"
            }`;

    }


    if (heroType) {

        heroType.textContent =
            `📖 ${best.type || ""}`;

    }


    if (heroDescription) {

        heroDescription.textContent =
            `${(
                best.genres || []
            ).join(" • ")} — ${
                best.status || ""
            }`;

    }


    const hero =
        document.querySelector(
            ".hero-background"
        );


    if (
        hero &&
        best.cover
    ) {

        hero.style.backgroundImage =
            `url("${best.cover}")`;

    }

}


/* =========================================================
   SEARCH
========================================================= */

if (searchToggle) {

    searchToggle.addEventListener(
        "click",
        () => {

            searchPanel.classList.toggle(
                "open"
            );


            if (
                searchPanel.classList.contains(
                    "open"
                )
            ) {

                searchInput.focus();

            }

        }
    );

}


if (searchInput) {

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
                allWorks.filter(
                    work => {

                        const name =
                            String(
                                work.name || ""
                            ).toLowerCase();


                        const genres =
                            Array.isArray(
                                work.genres
                            )
                                ? work.genres
                                    .join(" ")
                                    .toLowerCase()
                                : "";


                        const type =
                            String(
                                work.type || ""
                            ).toLowerCase();


                        return (
                            name.includes(query) ||
                            genres.includes(query) ||
                            type.includes(query)
                        );

                    }
                );


            renderWorks(filtered);

        }
    );

}


if (clearSearch) {

    clearSearch.addEventListener(
        "click",
        () => {

            searchInput.value = "";

            renderWorks(allWorks);

            searchInput.focus();

        }
    );

}


/* =========================================================
   THEME
========================================================= */

const savedTheme =
    localStorage.getItem(
        "mangax-theme"
    );


if (
    savedTheme === "light"
) {

    document.body.classList.add(
        "light"
    );


    if (themeBtn) {
        themeBtn.textContent = "☀";
    }

}


if (themeBtn) {

    themeBtn.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "light"
            );


            const isLight =
                document.body.classList.contains(
                    "light"
                );


            localStorage.setItem(
                "mangax-theme",
                isLight
                    ? "light"
                    : "dark"
            );


            themeBtn.textContent =
                isLight
                    ? "☀"
                    : "☾";

        }
    );

}


/* =========================================================
   MOBILE MENU
========================================================= */

if (menuBtn) {

    menuBtn.addEventListener(
        "click",
        () => {

            const navigation =
                document.querySelector(
                    ".navigation"
                );


            if (!navigation) {
                return;
            }


            if (
                navigation.style.display ===
                "flex"
            ) {

                navigation.style.display =
                    "";

                return;

            }


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
    );

}


/* =========================================================
   FAVORITES
========================================================= */

function setupFavorites() {

    document
        .querySelectorAll(
            ".favorite"
        )
        .forEach(
            button => {

                const id =
                    button.dataset.favorite;


                let favorites = [];


                try {

                    favorites =
                        JSON.parse(
                            localStorage.getItem(
                                "mangax-favorites"
                            ) || "[]"
                        );

                } catch {

                    favorites = [];

                }


                if (
                    favorites.includes(id)
                ) {

                    button.classList.add(
                        "active"
                    );


                    button.textContent =
                        "♥";

                }


                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        event.stopPropagation();


                        let currentFavorites =
                            [];


                        try {

                            currentFavorites =
                                JSON.parse(
                                    localStorage.getItem(
                                        "mangax-favorites"
                                    ) || "[]"
                                );

                        } catch {

                            currentFavorites =
                                [];

                        }


                        if (
                            currentFavorites.includes(
                                id
                            )
                        ) {

                            currentFavorites =
                                currentFavorites.filter(
                                    item =>
                                        item !== id
                                );


                            button.classList.remove(
                                "active"
                            );


                            button.textContent =
                                "♡";

                        } else {

                            currentFavorites.push(
                                id
                            );


                            button.classList.add(
                                "active"
                            );


                            button.textContent =
                                "♥";

                        }


                        localStorage.setItem(
                            "mangax-favorites",
                            JSON.stringify(
                                currentFavorites
                            )
                        );

                    }
                );

            }
        );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function escapeAttribute(value) {

    return escapeHTML(value);

}


/* =========================================================
   START
========================================================= */

loadWorks();
