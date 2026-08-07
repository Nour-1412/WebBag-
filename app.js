import { tools } from "./tools-data.js";

/* ==========================================
        WebBag Aurora V3
        Safe Multi-Page JavaScript
========================================== */


/* ==========================================
        Tools Section
========================================== */

const toolsSection = document.getElementById("tools");

if (toolsSection && Array.isArray(tools)) {

    tools.forEach(tool => {

        toolsSection.innerHTML += `

            <div class="tool-card"
                 data-page="${tool.page}"
                 data-category="${tool.category}">

                <div class="tool-icon">
                    ${tool.icon}
                </div>

                <div class="tool-title">
                    ${tool.title}
                </div>

                <div class="tool-desc">
                    ${tool.description}
                </div>

            </div>

        `;

    });

}

/* ==========================================
        Tool Cards Hover Animation
========================================== */

const toolCards = document.querySelectorAll(".tool-card");

toolCards.forEach(card => {

    card.addEventListener("mousemove", event => {

        const rect = card.getBoundingClientRect();

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        card.style.background = `
            radial-gradient(
                circle at ${x}px ${y}px,
                rgba(255,255,255,.95),
                rgba(255,255,255,.42)
            )
        `;

    });

    card.addEventListener("mouseleave", () => {

        card.style.background = "rgba(255,255,255,.42)";

    });

});
/* ==========================================
        Open Tool
========================================== */

document.querySelectorAll(".tool-card").forEach(card => {

    card.addEventListener("click", () => {

        const page = card.dataset.page;

        if (page) {

            window.location.href = page;

        }

    });

});
/* ==========================================
        Search System
========================================== */

const searchInput = document.getElementById("search");

if (searchInput) {

    searchInput.addEventListener("input", () => {

        const value = searchInput.value.trim().toLowerCase();

        document.querySelectorAll(".tool-card").forEach(card => {

            const title =
                card.querySelector(".tool-title")?.textContent.toLowerCase() || "";

            const description =
                card.querySelector(".tool-desc")?.textContent.toLowerCase() || "";

            const matches =
                title.includes(value) ||
                description.includes(value);

            card.style.display = matches ? "block" : "none";

        });

    });

                }
/* ==========================================
        Categories Filter
========================================== */

const categoryMap = {

    "الذكاء الاصطناعي": "ai",
    "الصور": "images",
    "الملفات": "files",
    "الترجمة": "translate",
    "الصوت": "audio"

};

const categoryCards =
    document.querySelectorAll(".category-card");

const allToolCards =
    document.querySelectorAll(".tool-card");


categoryCards.forEach(card => {

    card.addEventListener("click", () => {

        categoryCards.forEach(item => {

            item.classList.remove("active-category");

        });

        card.classList.add("active-category");

        const text =
            card.querySelector("span")?.textContent.trim();

        const category =
            categoryMap[text];

        if (!category) return;

        allToolCards.forEach(tool => {

            tool.style.display =
                tool.dataset.category === category
                    ? "block"
                    : "none";

        });

    });

});


const showAllBtn =
    document.getElementById("showAllBtn");


if (showAllBtn) {

    showAllBtn.addEventListener("click", () => {

        categoryCards.forEach(card => {

            card.classList.remove("active-category");

        });

        allToolCards.forEach(tool => {

            tool.style.display = "block";

        });

    });

            }
/* ==========================================
        Popular Tools
========================================== */

const popularSection =
document.getElementById("popularTools");

if(popularSection){

    tools
    .filter(tool => tool.popular)
    .slice(0, 3)
    .forEach(tool => {

        popularSection.innerHTML += `

        <div class="popular-tool">

            <div class="popular-icon">
                ${tool.icon}
            </div>

            <div class="popular-info">

                <div class="popular-title">
                    ${tool.title}
                </div>

                <div class="popular-rating">
                    ⭐ ${tool.rating} / 5
                </div>

            </div>

        </div>

        `;

    });

}
/* ==========================================
        Theme Mode
========================================== */

const themeBtn =
    document.getElementById("themeToggle");

const savedTheme =
    localStorage.getItem("theme");


if (savedTheme === "dark") {

    document.body.classList.add("dark");

}


if (themeBtn) {

    themeBtn.textContent =
        document.body.classList.contains("dark")
            ? "☀️"
            : "🌙";


    themeBtn.addEventListener("click", () => {

        document.body.classList.toggle("dark");

        const isDark =
            document.body.classList.contains("dark");


        themeBtn.textContent =
            isDark ? "☀️" : "🌙";


        localStorage.setItem(
            "theme",
            isDark ? "dark" : "light"
        );

    });

}
/* ==========================================
        FAQ Accordion
========================================== */

const faqQuestions =
    document.querySelectorAll(".faq-question");


faqQuestions.forEach(question => {

    question.addEventListener("click", () => {

        const answer =
            question.nextElementSibling;

        const icon =
            question.querySelector("span");


        if (!answer) return;


        /* Close all other answers */

        document
            .querySelectorAll(".faq-answer")
            .forEach(otherAnswer => {

                if (otherAnswer !== answer) {

                    otherAnswer.style.maxHeight = null;


                    const otherIcon =
                        otherAnswer
                            .previousElementSibling
                            ?.querySelector("span");


                    if (otherIcon) {

                        otherIcon.textContent = "+";

                    }

                }

            });


        /* Toggle current answer */

        if (answer.style.maxHeight) {

            answer.style.maxHeight = null;

            if (icon) {

                icon.textContent = "+";

            }

        } else {

            answer.style.maxHeight =
                answer.scrollHeight + "px";

            if (icon) {

                icon.textContent = "−";

            }

        }

    });

});
 /* ==========================================
        Animated Stats Counter
========================================== */

const statNumbers =
    document.querySelectorAll(".stat-number");

let statsStarted = false;


function startStats() {

    if (statsStarted || statNumbers.length === 0) {
        return;
    }

    statsStarted = true;


    statNumbers.forEach(stat => {

        const target =
            Number(stat.dataset.target);


        if (!Number.isFinite(target)) {
            return;
        }


        let current = 0;

        const increment =
            target / 120;


        const timer =
            setInterval(() => {

                current += increment;


                if (current >= target) {

                    current = target;

                    clearInterval(timer);

                }


                if (target >= 1000000) {

                    stat.textContent =
                        (current / 1000000)
                            .toFixed(1)
                            .replace(".0", "") + "M+";

                }

                else if (target >= 1000) {

                    stat.textContent =
                        Math.floor(current / 1000) + "K+";

                }

                else {

                    stat.textContent =
                        Math.floor(current) + "+";

                }

            }, 15);

    });

}


/* Start counter when stats section appears */

const statsSection =
    document.querySelector(".stats-section");


if (statsSection) {

    const statsObserver =
        new IntersectionObserver(entries => {

            if (entries[0].isIntersecting) {

                startStats();

                statsObserver.disconnect();

            }

        });


    statsObserver.observe(statsSection);

                              }
 /* ==========================================
        Scroll Animation
========================================== */

const animatedElements =
    document.querySelectorAll(
        ".tool-card, .stat-card, .category-card, " +
        ".feature-card, .price-card, .about-card, " +
        ".why-card, .team-card, .value-card, " +
        ".timeline-item"
    );


if (animatedElements.length > 0) {

    animatedElements.forEach(element => {

        element.classList.add("hidden");

    });


    const scrollObserver =
        new IntersectionObserver(entries => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("show");

                    scrollObserver.unobserve(
                        entry.target
                    );

                }

            });

        }, {

            threshold: 0.1

        });


    animatedElements.forEach(element => {

        scrollObserver.observe(element);

    });

}
/* ==========================================
        Popular Tools Click
========================================== */

document
    .querySelectorAll("#popularTools .tool-card")
    .forEach(card => {

        card.addEventListener("click", () => {

            const page =
                card.dataset.page;

            if (page) {

                window.location.href = page;

            }

        });

    });
/* ==========================================
        WebBag App Ready
========================================== */

document.documentElement.classList.add("app-ready");
