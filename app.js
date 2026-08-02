/* ==========================================
            WebBag Aurora V2
========================================== */

const tools = [

{

icon:"🖼️",

title:"إزالة الخلفية",

description:"احذف خلفية أي صورة بالذكاء الاصطناعي."

},

{

icon:"📄",

title:"تحويل PDF",

description:"تحويل ملفات PDF إلى Word والعكس."

},

{

icon:"🎙️",

title:"تحويل الصوت إلى نص",

description:"استخراج النصوص من الملفات الصوتية."

},

{

icon:"🤖",

title:"Chat AI",

description:"محادثة ذكية تعتمد على الذكاء الاصطناعي."

},

{

icon:"🎨",

title:"توليد الصور",

description:"إنشاء صور احترافية من وصف نصي."

},

{

icon:"🌐",

title:"ترجمة احترافية",

description:"ترجمة النصوص بأكثر من 100 لغة."

}

];

const toolsSection = document.getElementById("tools");

tools.forEach(tool=>{

toolsSection.innerHTML += `

<div class="tool-card">

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
