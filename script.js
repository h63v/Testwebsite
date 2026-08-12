const DATA_URL = "files/index.json";


/* =========================================================
   أدوات عامة
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function statusText(status) {

    switch (status) {

        case "ongoing":
            return "مستمرة";

        case "completed":
            return "مكتملة";

        case "hiatus":
            return "متوقفة";

        default:
            return "غير معروف";

    }

}


/* =========================================================
   تحميل JSON
========================================================= */

async function getData() {

    const response =
        await fetch(DATA_URL);

    if (!response.ok) {

        throw new Error(
            "تعذر تحميل files/index.json"
        );

    }

    return await response.json();

}


/* =========================================================
   قراءة معلومات العمل من HTML
========================================================= */

async function getWorkInfo(path) {

    const response =
        await fetch("files/" + path);

    if (!response.ok) {

        throw new Error(
            "تعذر تحميل ملف العمل: " + path
        );

    }

    const html =
        await response.text();


    const parser =
        new DOMParser();


    const doc =
        parser.parseFromString(
            html,
            "text/html"
        );


    function meta(name) {

        const element =
            doc.querySelector(
                `meta[name="${name}"]`
            );

        return element
            ? element.getAttribute("content") || ""
            : "";

    }


    return {

        title:
            meta("manga-title"),

        cover:
            meta("manga-cover"),

        status:
            meta("manga-status"),

        rating:
            meta("manga-rating"),

        genres:
            meta("manga-genres")
                .split(",")
                .map(item => item.trim())
                .filter(Boolean),

        description:
            meta("manga-description")

    };

}


/* =========================================================
   إنشاء بطاقة العمل
========================================================= */

function createCard(work) {

    const info =
        work.info;


    const card =
        document.createElement("article");

    card.className =
        "manga-card";


    card.dataset.title =
        info.title.toLowerCase();


    card.innerHTML = `

        <a href="manga.html?type=${encodeURIComponent(work.type)}&slug=${encodeURIComponent(work.slug)}">

            <img
                class="manga-cover"
                src="${escapeHTML(info.cover)}"
                alt="${escapeHTML(info.title)}"
                loading="lazy"
            >

        </a>


        <div class="manga-card-content">

            <h3>
                ${escapeHTML(info.title)}
            </h3>


            <div class="rating">
                ⭐ ${escapeHTML(info.rating || "0")}
            </div>


            <span class="status ${escapeHTML(info.status)}">
                ${escapeHTML(statusText(info.status))}
            </span>


            <a
                class="card-btn"
                href="manga.html?type=${encodeURIComponent(work.type)}&slug=${encodeURIComponent(work.slug)}">

                عرض العمل

            </a>

        </div>

    `;


    return card;

}


/* =========================================================
   تحميل الرئيسية
========================================================= */

async function loadHome() {

    const mangaGrid =
        document.getElementById("mangaGrid");

    const manhwaGrid =
        document.getElementById("manhwaGrid");


    if (!mangaGrid && !manhwaGrid) {
        return;
    }


    try {

        const data =
            await getData();


        const allWorks = [];


        for (const item of data.manga || []) {

            try {

                const info =
                    await getWorkInfo(item.info);

                allWorks.push({

                    ...item,

                    type: "manga",

                    info

                });

            } catch (error) {

                console.error(error);

            }

        }


        for (const item of data.manhwa || []) {

            try {

                const info =
                    await getWorkInfo(item.info);

                allWorks.push({

                    ...item,

                    type: "manhwa",

                    info

                });

            } catch (error) {

                console.error(error);

            }

        }


        window.allWorks =
            allWorks;


        renderHome();


        const search =
            document.getElementById("searchInput");


        if (search) {

            search.addEventListener(
                "input",
                renderHome
            );

        }


    } catch (error) {

        console.error(error);

        if (mangaGrid) {

            mangaGrid.innerHTML =
                `<div class="error">
                    حدث خطأ أثناء تحميل الأعمال.
                </div>`;

        }

    }

}


/* =========================================================
   عرض الرئيسية
========================================================= */

function renderHome() {

    const mangaGrid =
        document.getElementById("mangaGrid");

    const manhwaGrid =
        document.getElementById("manhwaGrid");


    if (!mangaGrid || !manhwaGrid) {
        return;
    }


    const searchInput =
        document.getElementById("searchInput");


    const query =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    mangaGrid.innerHTML = "";

    manhwaGrid.innerHTML = "";


    const works =
        (window.allWorks || [])
            .filter(work => {

                if (!query) {
                    return true;
                }

                return work.info.title
                    .toLowerCase()
                    .includes(query);

            });


    const manga =
        works.filter(
            work => work.type === "manga"
        );


    const manhwa =
        works.filter(
            work => work.type === "manhwa"
        );


    if (manga.length === 0) {

        mangaGrid.innerHTML =
            `<div class="loading">
                لا توجد نتائج.
            </div>`;

    } else {

        manga.forEach(work => {

            mangaGrid.appendChild(
                createCard(work)
            );

        });

    }


    if (manhwa.length === 0) {

        manhwaGrid.innerHTML =
            `<div class="loading">
                لا توجد نتائج.
            </div>`;

    } else {

        manhwa.forEach(work => {

            manhwaGrid.appendChild(
                createCard(work)
            );

        });

    }

}


/* =========================================================
   البحث عن عمل
========================================================= */

async function findWork(type, slug) {

    const data =
        await getData();


    const list =
        type === "manhwa"
            ? data.manhwa || []
            : data.manga || [];


    const item =
        list.find(
            work => work.slug === slug
        );


    if (!item) {
        return null;
    }


    const info =
        await getWorkInfo(item.info);


    return {

        ...item,

        type,

        info

    };

}


/* =========================================================
   صفحة العمل
========================================================= */

async function loadMangaPage() {

    const details =
        document.getElementById(
            "mangaDetails"
        );


    const chapterList =
        document.getElementById(
            "chapterList"
        );


    if (!details || !chapterList) {
        return;
    }


    const params =
        new URLSearchParams(
            window.location.search
        );


    const type =
        params.get("type") || "manga";


    const slug =
        params.get("slug");


    if (!slug) {

        details.innerHTML =
            `<div class="error">
                لم يتم تحديد العمل.
            </div>`;

        return;

    }


    try {

        const work =
            await findWork(
                type,
                slug
            );


        if (!work) {

            details.innerHTML =
                `<div class="error">
                    العمل غير موجود.
                </div>`;

            return;

        }


        document.title =
            work.info.title +
            " - MangaX";


        const genresHTML =
            work.info.genres
                .map(
                    genre => `
                        <span class="genre">
                            ${escapeHTML(genre)}
                        </span>
                    `
                )
                .join("");


        details.innerHTML = `

            <img
                class="details-cover"
                src="${escapeHTML(work.info.cover)}"
                alt="${escapeHTML(work.info.title)}"
            >


            <div class="details-info">

                <h1>
                    ${escapeHTML(work.info.title)}
                </h1>


                <div class="details-rating">

                    ⭐
                    ${escapeHTML(
                        work.info.rating || "0"
                    )}

                </div>


                <div class="details-status">

                    الحالة:

                    <span class="status ${escapeHTML(work.info.status)}">

                        ${escapeHTML(
                            statusText(
                                work.info.status
                            )
                        )}

                    </span>

                </div>


                <div class="genres">

                    ${genresHTML}

                </div>


                <p class="description">

                    ${escapeHTML(
                        work.info.description
                    )}

                </p>


                ${
                    work.chapters &&
                    work.chapters.length
                        ? `
                            <div class="detail-buttons">

                                <a
                                    class="detail-button"
                                    href="${createReaderURL(
                                        work.chapters[
                                            work.chapters.length - 1
                                        ],
                                        work
                                    )}">

                                    ▶ قراءة آخر فصل

                                </a>

                            </div>
                        `
                        : ""
                }

            </div>

        `;


        renderChapters(
            work,
            chapterList
        );


    } catch (error) {

        console.error(error);

        details.innerHTML =
            `<div class="error">
                حدث خطأ أثناء تحميل العمل.
            </div>`;

    }

}


/* =========================================================
   إنشاء رابط القارئ
========================================================= */

function createReaderURL(
    chapterPath,
    work
) {

    const params =
        new URLSearchParams();


    params.set(
        "chapter",
        chapterPath
    );


    params.set(
        "title",
        work.info.title
    );


    params.set(
        "slug",
        work.slug
    );


    params.set(
        "type",
        work.type
    );


    return "reader.html?" +
        params.toString();

}


/* =========================================================
   عرض الفصول
========================================================= */

function renderChapters(
    work,
    container
) {

    container.innerHTML = "";


    const chapters =
        [...(work.chapters || [])];


    if (chapters.length === 0) {

        container.innerHTML =
            `<div class="loading">
                لا توجد فصول حاليًا.
            </div>`;

        return;

    }


    /*
       ترتيب تنازلي حسب رقم الفصل
    */

    chapters.sort(
        (a, b) =>
            extractChapterNumber(b) -
            extractChapterNumber(a)
    );


    chapters.forEach(
        (chapterPath, index) => {

            const number =
                extractChapterNumber(
                    chapterPath
                );


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "chapter-item";


            item.innerHTML = `

                <div>

                    <div class="chapter-number">

                        الفصل
                        ${escapeHTML(number)}

                    </div>

                </div>


                <a
                    class="chapter-read"
                    href="${createReaderURL(
                        chapterPath,
                        work
                    )}">

                    قراءة

                </a>

            `;


            container.appendChild(item);

        }
    );

}


/* =========================================================
   استخراج رقم الفصل
========================================================= */

function extractChapterNumber(path) {

    const match =
        path.match(
            /chapter-(\d+(?:\.\d+)?)/i
        );


    if (!match) {
        return 0;
    }


    return Number(match[1]);

}


/* =========================================================
   قراءة ملف الفصل
========================================================= */

async function getChapterImages(
    chapterPath
) {

    const response =
        await fetch(
            "files/" + chapterPath
        );


    if (!response.ok) {

        throw new Error(
            "تعذر تحميل الفصل"
        );

    }


    const html =
        await response.text();


    const parser =
        new DOMParser();


    const doc =
        parser.parseFromString(
            html,
            "text/html"
        );


    const images =
        [...doc.querySelectorAll("img")];


    return images
        .map(img => {

            return (
                img.getAttribute("src") ||
                img.getAttribute("data-src")
            );

        })
        .filter(Boolean);

}


/* =========================================================
   صفحة القارئ
========================================================= */

async function loadReader() {

    const reader =
        document.getElementById(
            "reader"
        );


    const titleElement =
        document.getElementById(
            "readerTitle"
        );


    if (!reader) {
        return;
    }


    const params =
        new URLSearchParams(
            window.location.search
        );


    const chapter =
        params.get("chapter");


    const title =
        params.get("title") ||
        "قارئ الفصل";


    if (!chapter) {

        reader.innerHTML =
            `<div class="error">
                لم يتم تحديد الفصل.
            </div>`;

        return;

    }


    titleElement.textContent =
        title +
        " - الفصل " +
        extractChapterNumber(chapter);


    document.title =
        title +
        " - الفصل " +
        extractChapterNumber(chapter);


    try {

        const images =
            await getChapterImages(
                chapter
            );


        reader.innerHTML = "";


        if (images.length === 0) {

            reader.innerHTML =
                `<div class="error">
                    لم يتم العثور على صور داخل الفصل.
                </div>`;

            return;

        }


        images.forEach(
            (src, index) => {

                const img =
                    document.createElement(
                        "img"
                    );


                img.src = src;

                img.alt =
                    `${title} - صفحة ${index + 1}`;

                img.loading =
                    "lazy";


                reader.appendChild(img);

            }
        );


        setupChapterNavigation();


    } catch (error) {

        console.error(error);

        reader.innerHTML =
            `<div class="error">
                حدث خطأ أثناء تحميل صور الفصل.
            </div>`;

    }

}


/* =========================================================
   التنقل بين الفصول
========================================================= */

async function setupChapterNavigation() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const type =
        params.get("type") || "manga";


    const slug =
        params.get("slug");


    if (!slug) {
        return;
    }


    try {

        const work =
            await findWork(
                type,
                slug
            );


        if (!work) {
            return;
        }


        const chapters =
            [...(work.chapters || [])];


        chapters.sort(
            (a, b) =>
                extractChapterNumber(a) -
                extractChapterNumber(b)
        );


        const current =
            params.get("chapter");


        const currentIndex =
            chapters.indexOf(current);


        const previous =
            document.getElementById(
                "previousChapter"
            );


        const next =
            document.getElementById(
                "nextChapter"
            );


        if (currentIndex > 0) {

            previous.disabled = false;


            previous.onclick =
                () => {

                    window.location.href =
                        createReaderURL(
                            chapters[
                                currentIndex - 1
                            ],
                            work
                        );

                };

        } else {

            previous.disabled = true;

        }


        if (
            currentIndex !== -1 &&
            currentIndex <
                chapters.length - 1
        ) {

            next.disabled = false;


            next.onclick =
                () => {

                    window.location.href =
                        createReaderURL(
                            chapters[
                                currentIndex + 1
                            ],
                            work
                        );

                };

        } else {

            next.disabled = true;

        }


    } catch (error) {

        console.error(error);

    }

}


/* =========================================================
   الوضع الليلي
========================================================= */

function setupTheme() {

    const button =
        document.getElementById(
            "themeBtn"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "light-mode"
            );

        }
    );

}


/* =========================================================
   تشغيل الصفحة
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupTheme();

        loadHome();

        loadMangaPage();

        loadReader();

    }
);
