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
