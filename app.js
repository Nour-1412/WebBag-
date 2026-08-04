import { tools } from "./tools-data.js";
/* ==========================================
            WebBag Aurora V2
========================================== */

const toolsSection = document.getElementById("tools");
tools.forEach(tool=>{

toolsSection.innerHTML += `

<div class="tool-card"
data-page="${tool.page}"
data-category="${tool.category}">

<div class="tool-icon">

<img
class="tool-logo"
src="${tool.image}"
alt="${tool.title}">

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

/* ==========================================
        Hover Animation
========================================== */

const cards = document.querySelectorAll(".tool-card");

cards.forEach(card=>{

card.addEventListener("mousemove",(e)=>{

const rect=card.getBoundingClientRect();

const x=e.clientX-rect.left;

const y=e.clientY-rect.top;

card.style.background=

`radial-gradient(circle at ${x}px ${y}px,
rgba(255,255,255,.95),
rgba(255,255,255,.42))`;

});

card.addEventListener("mouseleave",()=>{

card.style.background="rgba(255,255,255,.42)";

});

});
/* ==========================================
        Search System
========================================== */

const searchInput = document.getElementById("search");

if(searchInput){

searchInput.addEventListener("input",()=>{

const value = searchInput.value.toLowerCase();

const cards = document.querySelectorAll(".tool-card");

cards.forEach(card=>{

const title = card.querySelector(".tool-title").textContent.toLowerCase();

const desc = card.querySelector(".tool-desc").textContent.toLowerCase();

if(title.includes(value) || desc.includes(value)){

card.style.display="block";

}else{

card.style.display="none";

}

});

});

            }

/* ==========================================
        Open Tool
========================================== */

document.querySelectorAll(".tool-card").forEach(card=>{

card.addEventListener("click",()=>{

const page = card.dataset.page;

window.location.href = page;

});

});

/* ==========================================
        Categories Filter V2
========================================== */

const categoryMap = {

    "الذكاء الاصطناعي":"ai",

    "الصور":"images",

    "الملفات":"files",

    "الترجمة":"translate",

    "الصوت":"audio"

};

const categoryCards =
document.querySelectorAll(".category-card");

const toolCards =
document.querySelectorAll(".tool-card");

categoryCards.forEach(card=>{

    card.addEventListener("click",()=>{

        categoryCards.forEach(c=>{

            c.classList.remove("active-category");

        });

        card.classList.add("active-category");

        const text =
        card.querySelector("span").textContent.trim();

        const category =
        categoryMap[text];

        toolCards.forEach(tool=>{

            if(tool.dataset.category===category){

                tool.style.display="block";

            }else{

                tool.style.display="none";

            }

        });

    });

});

document
.getElementById("showAllBtn")
.addEventListener("click",()=>{

    categoryCards.forEach(c=>{

        c.classList.remove("active-category");

    });

    toolCards.forEach(tool=>{

        tool.style.display="block";

    });

});
/* ==========================================
        Animated Stats Counter
========================================== */

const statNumbers = document.querySelectorAll(".stat-number");

let statsStarted = false;

function startStats(){

    if(statsStarted) return;

    statsStarted = true;

    statNumbers.forEach(stat=>{

        const target = +stat.dataset.target;

        let current = 0;

        const increment = target / 120;

        const timer = setInterval(()=>{

            current += increment;

            if(current >= target){

                current = target;

                clearInterval(timer);

            }

            if(target >= 1000000){

                stat.textContent =
                (current/1000000).toFixed(1).replace(".0","") + "M+";

            }

            else if(target >= 1000){

                stat.textContent =
                Math.floor(current/1000) + "K+";

            }

            else{

                stat.textContent =
                Math.floor(current) + "+";

            }

        },15);

    });

}

const statsSection =
document.querySelector(".stats-section");

const observer =
new IntersectionObserver(entries=>{

    if(entries[0].isIntersecting){

        startStats();

    }

});

observer.observe(statsSection);

/* ==========================================
        Popular Tools
========================================== */

const popularSection =
document.getElementById("popularTools");

tools
.filter(tool => tool.popular)
.forEach(tool=>{

popularSection.innerHTML += `

<div class="tool-card"
data-page="${tool.page}">

<div class="tool-icon">
${tool.icon}
</div>

<div class="tool-title">
${tool.title}
</div>

<div class="tool-desc">
${tool.description}
</div>

<button class="tool-btn" type="button">
استخدام الأداة
</button>

</div>

`;

});

/* ==========================================
        Popular Tools Dynamic
========================================== */

document
.querySelectorAll("#popularTools .tool-card")
.forEach(card=>{

card.addEventListener("click",()=>{

window.location.href = card.dataset.page;

});

});
