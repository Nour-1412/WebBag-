/* ==========================================
            WebBag Aurora V2
========================================== */
const tools = [

{
icon:"🖼️",
title:"إزالة الخلفية",
description:"احذف خلفية أي صورة بالذكاء الاصطناعي.",
page:"tools/remove-bg.html",
category:"images"
},

{
icon:"📄",
title:"تحويل PDF",
description:"تحويل ملفات PDF إلى Word والعكس.",
page:"tools/pdf.html",
category:"files"
},

{
icon:"🎙️",
title:"الصوت إلى نص",
description:"تحويل الملفات الصوتية إلى نص.",
page:"tools/speech.html",
category:"audio"
},

{
icon:"🤖",
title:"Chat AI",
description:"محادثة ذكية تعتمد على الذكاء الاصطناعي.",
page:"tools/chat.html",
category:"ai"
},

{
icon:"🎨",
title:"توليد الصور",
description:"إنشاء صور بالذكاء الاصطناعي.",
page:"tools/image.html",
category:"images"
},

{
icon:"🌍",
title:"الترجمة",
description:"ترجمة احترافية بأكثر من 100 لغة.",
page:"tools/translate.html",
category:"translate"
}

];


const toolsSection = document.getElementById("tools");
tools.forEach(tool=>{

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
        Categories Filter
========================================== */

const categoryCards = document.querySelectorAll(".category-card");

categoryCards.forEach(card => {

    card.addEventListener("click", () => {

        const text = card.querySelector("span").textContent.trim();

        let category = "";

        if (text === "الذكاء الاصطناعي") category = "ai";
        if (text === "الصور") category = "images";
        if (text === "الملفات") category = "files";
        if (text === "الترجمة") category = "translate";
        if (text === "الصوت") category = "audio";

        const cards = document.querySelectorAll(".tool-card");

        cards.forEach(tool => {

            if (tool.dataset.category === category) {

                tool.style.display = "";

            } else {

                tool.style.display = "none";

            }

        });

    });

});

const showAllBtn = document.getElementById("showAllBtn");

showAllBtn.addEventListener("click", () => {

    document.querySelectorAll(".tool-card").forEach(card => {

        card.style.display = "";

    });

});
