/* =========================================================
   MangaX - script.js
========================================================= */


/* =========================================================
   الإعدادات
========================================================= */

const DATA_URL = "files/index.json";


/* =========================================================
   أدوات مساعدة
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   حالة العمل
========================================================= */

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
   تحميل البيانات الرئيسية
========================================================= */

async function getData() {

    const response =
        await fetch(
            DATA_URL,
            {
                cache: "no-cache"
            }
        );


    if (!response.ok) {

        throw new Error(
            "تعذر تحميل files/index.json"
        );

    }


    return await response.json();

}


/* =========================================================
   تحميل معلومات العمل
========================================================= */

async function getWorkInfo(path) {

    const fileURL =
        new URL(
            "files/" + path,
            window.location.href
        );


    const response =
        await fetch(
            fileURL.href,
            {
                cache: "no-cache"
            }
        );


    if (!response.ok) {

        throw new Error(
            "تعذر تحميل ملف العمل: " +
            path
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
   الحصول على جميع الأعمال
========================================================= */

async function loadAllWorks() {

    const data =
        await getData();


    const works = [];


    /* ================= Manga ================= */

    for (
        const item
        of (data.manga || [])
    ) {

        try {

            const info =
                await getWorkInfo(
                    item.info
                );


            works.push({

                ...item,

                type: "manga",

                info

            });

        } catch (error) {

            console.error(
                "خطأ في تحميل Manga:",
                item,
                error
            );

        }

    }


    /* ================= Manhwa ================= */

    for (
        const item
        of (data.manhwa || [])
    ) {

        try {

            const info =
                await getWorkInfo(
                    item.info
                );


            works.push({

                ...item,

                type: "manhwa",

                info

            });

        } catch (error) {

            console.error(
                "خطأ في تحميل Manhwa:",
                item,
                error
            );

        }

    }


    return works;

}


/* =========================================================
   إنشاء رابط صفحة العمل
========================================================= */

function createMangaURL(work) {

    const params =
        new URLSearchParams();


    params.set(
        "type",
        work.type
    );


    params.set(
        "slug",
        work.slug
    );


    return (
        "manga.html?" +
        params.toString()
    );

}


/* =========================================================
   استخراج رقم الفصل
========================================================= */

function extractChapterNumber(path) {

    const match =
        String(path).match(
            /chapter[-_](\d+(?:\.\d+)?)/i
        );


    if (!match) {

        return 0;

    }


    return Number(
        match[1]
    );

}


/* =========================================================
   ترتيب الفصول
========================================================= */

function sortChapters(chapters) {

    return [...chapters].sort(
        (a, b) => {

            return (
                extractChapterNumber(b) -
                extractChapterNumber(a)
            );

        }
    );

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


    return (
        "reader.html?" +
        params.toString()
    );

}


/* =========================================================
   إنشاء بطاقة العمل
========================================================= */

function createCard(work) {

    const info =
        work.info;


    const latestChapter =
        sortChapters(
            work.chapters || []
        )[0];


    const latestNumber =
        latestChapter
            ? extractChapterNumber(
                latestChapter
            )
            : 0;


    const card =
        document.createElement(
            "article"
        );


    card.className =
        "manga-card";


    card.dataset.title =
        String(
            info.title || ""
        ).toLowerCase();


    card.innerHTML = `

        <div class="cover-container">

            <a
                href="${createMangaURL(work)}">

                <img
                    class="manga-cover"
                    src="${escapeHTML(info.cover)}"
                    alt="${escapeHTML(info.title)}"
                    loading="lazy"
                >

            </a>


            <span
                class="status ${escapeHTML(info.status)}">

                ${escapeHTML(
                    statusText(info.status)
                )}

            </span>


            <button
                class="favorite"
                type="button"
                aria-label="إضافة للمفضلة">

                ♡

            </button>

        </div>


        <div class="manga-content">

            <h3>

                ${escapeHTML(info.title)}

            </h3>


            <div class="rating">

                ⭐
                ${escapeHTML(
                    info.rating || "0"
                )}

            </div>


            <div class="chapter-row">

                <span>

                    ${
                        latestNumber
                            ? `الفصل ${latestNumber}`
                            : "لا توجد فصول"
                    }

                </span>


                <span>

                    آخر تحديث

                </span>

            </div>


            <div class="card-buttons">

                <a
                    href="${
                        latestChapter
                            ? createReaderURL(
                                latestChapter,
                                work
                            )
                            : createMangaURL(work)
                    }"
                    class="read-btn">

                    ▶ قراءة

                </a>


                <a
                    href="${
                        latestChapter
                            ? createReaderURL(
                                latestChapter,
                                work
                            )
                            : createMangaURL(work)
                    }"
                    class="download-btn">

                    ↓ تنزيل

                </a>

            </div>

        </div>

    `;


    setupFavoriteButton(
        card.querySelector(
            ".favorite"
        ),
        work.slug
    );


    return card;

}


/* =========================================================
   المفضلة
========================================================= */

function getFavorites() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "mangax-favorites"
            )
        ) || [];

    } catch {

        return [];

    }

}


function saveFavorites(favorites) {

    localStorage.setItem(
        "mangax-favorites",
        JSON.stringify(favorites)
    );

}


function setupFavoriteButton(
    button,
    slug
) {

    if (!button) {
        return;
    }


    let favorites =
        getFavorites();


    if (
        favorites.includes(slug)
    ) {

        button.textContent =
            "♥";

        button.classList.add(
            "active"
        );

    }


    button.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();


            favorites =
                getFavorites();


            if (
                favorites.includes(slug)
            ) {

                favorites =
                    favorites.filter(
                        item => item !== slug
                    );


                button.textContent =
                    "♡";


                button.classList.remove(
                    "active"
                );

            } else {

                favorites.push(
                    slug
                );


                button.textContent =
                    "♥";


                button.classList.add(
                    "active"
                );

            }


            saveFavorites(
                favorites
            );

        }
    );

}


/* =========================================================
   عرض الصفحة الرئيسية
========================================================= */

async function loadHome() {

    const mangaGrid =
        document.getElementById(
            "mangaGrid"
        );


    const manhwaGrid =
        document.getElementById(
            "manhwaGrid"
        );


    if (
        !mangaGrid &&
        !manhwaGrid
    ) {

        return;

    }


    try {

        const works =
            await loadAllWorks();


        window.allWorks =
            works;


        renderHome();


        setupSearch();


        setupHero(
            works
        );


        setupPopular(
            works
        );


    } catch (error) {

        console.error(
            error
        );


        if (mangaGrid) {

            mangaGrid.innerHTML = `

                <div class="error">

                    حدث خطأ أثناء تحميل المانجا.

                    <br>

                    <small>
                        ${escapeHTML(
                            error.message
                        )}
                    </small>

                </div>

            `;

        }


        if (manhwaGrid) {

            manhwaGrid.innerHTML = `

                <div class="error">

                    حدث خطأ أثناء تحميل المانهوا.

                </div>

            `;

        }

    }

}


/* =========================================================
   عرض الأعمال
========================================================= */

function renderHome() {

    const mangaGrid =
        document.getElementById(
            "mangaGrid"
        );


    const manhwaGrid =
        document.getElementById(
            "manhwaGrid"
        );


    if (
        !mangaGrid ||
        !manhwaGrid
    ) {

        return;

    }


    const searchInput =
        document.getElementById(
            "searchInput"
        );


    const query =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    mangaGrid.innerHTML =
        "";


    manhwaGrid.innerHTML =
        "";


    const works =
        (window.allWorks || [])
            .filter(
                work => {

                    if (!query) {

                        return true;

                    }


                    const title =
                        String(
                            work.info.title || ""
                        ).toLowerCase();


                    const genres =
                        (
                            work.info.genres || []
                        )
                        .join(" ")
                        .toLowerCase();


                    return (
                        title.includes(query) ||
                        genres.includes(query)
                    );

                }
            );


    const manga =
        works.filter(
            work =>
                work.type === "manga"
        );


    const manhwa =
        works.filter(
            work =>
                work.type === "manhwa"
        );


    const count =
        document.getElementById(
            "mangaCount"
        );


    if (count) {

        count.textContent =
            `${works.length} عمل`;

    }


    /* ================= Manga ================= */

    if (manga.length === 0) {

        mangaGrid.innerHTML = `

            <div class="loading">

                لا توجد نتائج في Manga.

            </div>

        `;

    } else {

        manga.forEach(
            work => {

                mangaGrid.appendChild(
                    createCard(work)
                );

            }
        );

    }


    /* ================= Manhwa ================= */

    if (manhwa.length === 0) {

        manhwaGrid.innerHTML = `

            <div class="loading">

                لا توجد نتائج في Manhwa.

            </div>

        `;

    } else {

        manhwa.forEach(
            work => {

                manhwaGrid.appendChild(
                    createCard(work)
                );

            }
        );

    }


    const noResults =
        document.getElementById(
            "noResults"
        );


    if (noResults) {

        noResults.style.display =
            works.length === 0
                ? "block"
                : "none";

    }

}


/* =========================================================
   البحث
========================================================= */

function setupSearch() {

    const input =
        document.getElementById(
            "searchInput"
        );


    const toggle =
        document.getElementById(
            "searchToggle"
        );


    const panel =
        document.getElementById(
            "searchPanel"
        );


    const clear =
        document.getElementById(
            "clearSearch"
        );


    if (input) {

        input.addEventListener(
            "input",
            () => {

                renderHome();

            }
        );

    }


    if (
        toggle &&
        panel
    ) {

        toggle.addEventListener(
            "click",
            () => {

                panel.classList.toggle(
                    "active"
                );


                if (
                    panel.classList.contains(
                        "active"
                    ) &&
                    input
                ) {

                    setTimeout(
                        () => input.focus(),
                        100
                    );

                }

            }
        );

    }


    if (
        clear &&
        input
    ) {

        clear.addEventListener(
            "click",
            () => {

                input.value =
                    "";

                renderHome();

                input.focus();

            }
        );

    }

}


/* =========================================================
   Hero
========================================================= */

function setupHero(works) {

    const title =
        document.getElementById(
            "heroTitle"
        );


    const description =
        document.getElementById(
            "heroDescription"
        );


    const info =
        document.getElementById(
            "heroInfo"
        );


    const button =
        document.getElementById(
            "heroReadButton"
        );


    const background =
        document.getElementById(
            "heroBackground"
        );


    if (
        !title ||
        !works.length
    ) {

        return;

    }


    /*
       نستخدم أول عمل في البيانات
       كعمل Hero.
    */

    const work =
        works[0];


    const latest =
        sortChapters(
            work.chapters || []
        )[0];


    const latestNumber =
        latest
            ? extractChapterNumber(
                latest
            )
            : 0;


    title.textContent =
        work.info.title;


    description.textContent =
        work.info.description ||
        "استكشف هذا العمل واقرأ أحدث فصوله.";


    if (info) {

        info.innerHTML = `

            <span>

                ⭐
                ${escapeHTML(
                    work.info.rating || "0"
                )}

            </span>


            <span>

                📚
                ${latestNumber
                    ? `${latestNumber} فصل`
                    : "لا توجد فصول"
                }

            </span>


            <span>

                📖
                ${escapeHTML(
                    work.info.genres?.[0] ||
                    "مانجا"
                )}

            </span>

        `;

    }


    if (
        button &&
        latest
    ) {

        button.href =
            createReaderURL(
                latest,
                work
            );

    } else if (button) {

        button.href =
            createMangaURL(
                work
            );

    }


    if (background) {

        background.style.backgroundImage =
            `url("${work.info.cover}")`;

    }

}


/* =========================================================
   الأكثر قراءة
========================================================= */

function setupPopular(works) {

    const container =
        document.getElementById(
            "popularList"
        );


    if (!container) {

        return;

    }


    if (!works.length) {

        container.innerHTML = `

            <div class="loading">

                لا توجد أعمال.

            </div>

        `;

        return;

    }


    /*
       ترتيب حسب التقييم.
       لاحقًا يمكن تغيير هذا إلى
       نظام مشاهدات حقيقي.
    */

    const popular =
        [...works]
            .sort(
                (a, b) =>
                    Number(
                        b.info.rating || 0
                    ) -
                    Number(
                        a.info.rating || 0
                    )
            )
            .slice(0, 4);


    container.innerHTML =
        "";


    popular.forEach(
        (work, index) => {

            const item =
                document.createElement(
                    "a"
                );


            item.href =
                createMangaURL(
                    work
                );


            item.className =
                "popular-item";


            item.innerHTML = `

                <span class="rank">

                    ${String(
                        index + 1
                    ).padStart(
                        2,
                        "0"
                    )}

                </span>


                <img
                    src="${escapeHTML(
                        work.info.cover
                    )}"
                    alt="${escapeHTML(
                        work.info.title
                    )}"
                    loading="lazy"
                >


                <div>

                    <h3>

                        ${escapeHTML(
                            work.info.title
                        )}

                    </h3>


                    <p>

                        ${escapeHTML(
                            (
                                work.info.genres ||
                                []
                            )
                            .slice(0, 2)
                            .join(" • ")
                        )}

                    </p>


                    <strong>

                        ⭐
                        ${escapeHTML(
                            work.info.rating || "0"
                        )}

                    </strong>

                </div>

            `;


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   العثور على عمل معين
========================================================= */

async function findWork(
    type,
    slug
) {

    const data =
        await getData();


    const list =
        type === "manhwa"
            ? data.manhwa || []
            : data.manga || [];


    const item =
        list.find(
            work =>
                work.slug === slug
        );


    if (!item) {

        return null;

    }


    const info =
        await getWorkInfo(
            item.info
        );


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


    if (
        !details ||
        !chapterList
    ) {

        return;

    }


    const params =
        new URLSearchParams(
            window.location.search
        );


    const type =
        params.get("type") ||
        "manga";


    const slug =
        params.get("slug");


    if (!slug) {

        details.innerHTML = `

            <div class="error">

                لم يتم تحديد العمل.

            </div>

        `;

        return;

    }


    try {

        const work =
            await findWork(
                type,
                slug
            );


        if (!work) {

            details.innerHTML = `

                <div class="error">

                    العمل غير موجود.

                </div>

            `;

            return;

        }


        document.title =
            `${work.info.title} - MangaX`;


        const genresHTML =
            (
                work.info.genres || []
            )
            .map(
                genre => `

                    <span class="genre">

                        ${escapeHTML(
                            genre
                        )}

                    </span>

                `
            )
            .join("");


        const chapters =
            sortChapters(
                work.chapters || []
            );


        const latest =
            chapters[0];


        details.innerHTML = `

            <img
                class="details-cover"
                src="${escapeHTML(
                    work.info.cover
                )}"
                alt="${escapeHTML(
                    work.info.title
                )}"
            >


            <div class="details-info">


                <h1>

                    ${escapeHTML(
                        work.info.title
                    )}

                </h1>


                <div class="details-rating">

                    ⭐
                    ${escapeHTML(
                        work.info.rating || "0"
                    )}

                </div>


                <div class="details-status">

                    الحالة:

                    <span
                        class="status ${escapeHTML(
                            work.info.status
                        )}">

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


                <div class="detail-buttons">

                    ${
                        latest
                            ? `

                                <a
                                    class="detail-button"
                                    href="${createReaderURL(
                                        latest,
                                        work
                                    )}">

                                    ▶ قراءة آخر فصل

                                </a>

                            `
                            : ""
                    }

                </div>


            </div>

        `;


        renderChapters(
            work,
            chapterList
        );


    } catch (error) {

        console.error(
            error
        );


        details.innerHTML = `

            <div class="error">

                حدث خطأ أثناء تحميل العمل.

                <br><br>

                <small>

                    ${escapeHTML(
                        error.message
                    )}

                </small>

            </div>

        `;

    }

}


/* =========================================================
   قائمة الفصول
========================================================= */

function renderChapters(
    work,
    container
) {

    container.innerHTML =
        "";


    const chapters =
        sortChapters(
            work.chapters || []
        );


    if (!chapters.length) {

        container.innerHTML = `

            <div class="loading">

                لا توجد فصول حاليًا.

            </div>

        `;

        return;

    }


    chapters.forEach(
        chapterPath => {

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
                        ${escapeHTML(
                            number
                        )}

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


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   =========================================================
   قارئ الفصول
   =========================================================
========================================================= */


/* =========================================================
   تحميل صور الفصل
========================================================= */

async function getChapterImages(
    chapterPath
) {

    /*
       مثال:

       chapterPath:
       Manga/solo-leveling-chapter-210.html

       يتم إنشاء URL كامل للملف.

       وهذا مهم جدًا حتى تعمل الصور
       ذات المسارات النسبية.
    */

    const chapterURL =
        new URL(
            "files/" + chapterPath,
            window.location.href
        );


    const response =
        await fetch(
            chapterURL.href,
            {
                cache: "no-cache"
            }
        );


    if (!response.ok) {

        throw new Error(
            `تعذر تحميل ملف الفصل:
             ${chapterPath}`
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


    /*
       نقرأ جميع الصور الموجودة
       داخل ملف الفصل.
    */

    const imageElements =
        [
            ...doc.querySelectorAll(
                "img"
            )
        ];


    const images = [];


    for (
        const img
        of imageElements
    ) {

        /*
           يدعم:

           src
           data-src
           data-original
           data-lazy-src
        */

        let src =
            img.getAttribute(
                "src"
            );


        if (!src) {

            src =
                img.getAttribute(
                    "data-src"
                );

        }


        if (!src) {

            src =
                img.getAttribute(
                    "data-original"
                );

        }


        if (!src) {

            src =
                img.getAttribute(
                    "data-lazy-src"
                );

        }


        if (!src) {

            continue;

        }


        src =
            src.trim();


        /*
           إذا كان الرابط:

           https://example.com/image.jpg

           نستخدمه كما هو.

           أما:

           ../images/image.jpg

           أو:

           images/image.jpg

           فنحوّله إلى URL كامل
           بالنسبة لموقع ملف الفصل.
        */

        try {

            const absoluteURL =
                new URL(
                    src,
                    chapterURL.href
                );


            images.push(
                absoluteURL.href
            );

        } catch (error) {

            console.error(
                "رابط صورة غير صالح:",
                src,
                error
            );

        }

    }


    return images;

}


/* =========================================================
   تحميل القارئ
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
        params.get(
            "chapter"
        );


    const title =
        params.get(
            "title"
        ) ||
        "قارئ الفصل";


    if (!chapter) {

        reader.innerHTML = `

            <div class="error">

                لم يتم تحديد الفصل.

            </div>

        `;

        return;

    }


    const chapterNumber =
        extractChapterNumber(
            chapter
        );


    /* ================= العنوان ================= */

    if (titleElement) {

        titleElement.textContent =
            `الفصل ${chapterNumber} — ${title}`;

    }


    document.title =
        `الفصل ${chapterNumber} — ${title}`;


    try {

        /*
           جلب صور الفصل
        */

        const images =
            await getChapterImages(
                chapter
            );


        reader.innerHTML =
            "";


        /* ================= لا توجد صور ================= */

        if (!images.length) {

            reader.innerHTML = `

                <div class="error">

                    لم يتم العثور على صور
                    داخل ملف الفصل.

                    <br><br>

                    <small>

                        تأكد أن ملف الفصل يحتوي
                        على عناصر &lt;img&gt;.

                    </small>

                </div>

            `;

            return;

        }


        /* ================= عرض الصور ================= */

        images.forEach(
            (src, index) => {

                const img =
                    document.createElement(
                        "img"
                    );


                img.src =
                    src;


                img.alt =
                    `${title} - الصفحة ${index + 1}`;


                /*
                   أول صورة تحمل مباشرة.
                */

                img.loading =
                    index === 0
                        ? "eager"
                        : "lazy";


                img.decoding =
                    "async";


                /*
                   في حال فشل تحميل صورة
                   نعرض الخطأ في Console.
                */

                img.addEventListener(
                    "error",
                    () => {

                        console.error(
                            "فشل تحميل صورة الفصل:",
                            src
                        );

                    }
                );


                reader.appendChild(
                    img
                );

            }
        );


        /*
           تشغيل أزرار السابق والتالي
        */

        await setupChapterNavigation();


    } catch (error) {

        console.error(
            error
        );


        reader.innerHTML = `

            <div class="error">

                حدث خطأ أثناء تحميل صور الفصل.

                <br><br>

                <small>

                    ${escapeHTML(
                        error.message
                    )}

                </small>

            </div>

        `;

    }

}


/* =========================================================
   أزرار الفصل السابق / التالي
========================================================= */

async function setupChapterNavigation() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const type =
        params.get(
            "type"
        ) ||
        "manga";


    const slug =
        params.get(
            "slug"
        );


    const currentChapter =
        params.get(
            "chapter"
        );


    const previousButton =
        document.getElementById(
            "previousChapter"
        );


    const nextButton =
        document.getElementById(
            "nextChapter"
        );


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


        /*
           نرتب من الأقدم للأحدث
           هنا حتى نعرف السابق والتالي.
        */

        const chapters =
            [
                ...(work.chapters || [])
            ]
            .sort(
                (a, b) =>
                    extractChapterNumber(a) -
                    extractChapterNumber(b)
            );


        const currentIndex =
            chapters.indexOf(
                currentChapter
            );


        /* ================= السابق ================= */

        if (previousButton) {

            if (
                currentIndex > 0
            ) {

                previousButton.disabled =
                    false;


                previousButton.onclick =
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

                previousButton.disabled =
                    true;

            }

        }


        /* ================= التالي ================= */

        if (nextButton) {

            if (
                currentIndex !== -1 &&
                currentIndex <
                    chapters.length - 1
            ) {

                nextButton.disabled =
                    false;


                nextButton.onclick =
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

                nextButton.disabled =
                    true;

            }

        }


    } catch (error) {

        console.error(
            "خطأ في التنقل بين الفصول:",
            error
        );

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


    const savedTheme =
        localStorage.getItem(
            "mangax-theme"
        );


    if (
        savedTheme === "light"
    ) {

        document.body.classList.add(
            "light-mode"
        );

    }


    button.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "light-mode"
            );


            const light =
                document.body.classList.contains(
                    "light-mode"
                );


            localStorage.setItem(
                "mangax-theme",
                light
                    ? "light"
                    : "dark"
            );

        }
    );

}


/* =========================================================
   القائمة في الجوال
========================================================= */

function setupMobileMenu() {

    const button =
        document.getElementById(
            "menuBtn"
        );


    const navigation =
        document.querySelector(
            ".navigation"
        );


    if (
        !button ||
        !navigation
    ) {

        return;

    }


    button.addEventListener(
        "click",
        () => {

            navigation.classList.toggle(
                "mobile-open"
            );

        }
    );


    navigation
        .querySelectorAll("a")
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        navigation.classList.remove(
                            "mobile-open"
                        );

                    }
                );

            }
        );

}


/* =========================================================
   تشغيل النظام
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupTheme();

        setupMobileMenu();

        loadHome();

        loadMangaPage();

        loadReader();

    }
);
