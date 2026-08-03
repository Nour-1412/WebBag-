import WebBagAI from "../webbag-engine.js";
const input = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const progress =
document.querySelector(".progress-fill");

const progressText =
document.querySelector(".progress-text");
const removeBtn = document.getElementById("removeBtn");

let selectedFile = null;

input.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) return;

    selectedFile = file;

    const reader = new FileReader();

    reader.onload = function (e) {

        preview.src = e.target.result;
        preview.style.display = "block";

    };

    reader.readAsDataURL(file);

});

removeBtn.addEventListener("click", async () => {

    if (!selectedFile) {

        removeBtn.textContent = "اختر صورة أولاً";

        setTimeout(() => {
            removeBtn.textContent = "إزالة الخلفية";
        },1500);

        return;
    }

    removeBtn.disabled = true;
    removeBtn.textContent = "⏳ جاري إزالة الخلفية...";
    progress.style.width = "0%";
progressText.textContent = "جاري تجهيز الصورة...";

let percent = 0;

const loading = setInterval(() => {

    percent += 8;

    if(percent > 90) percent = 90;

    progress.style.width = percent + "%";

},250);

    try{

       const result = await WebBagAI.removeBackground(selectedFile);
        clearInterval(loading);

progress.style.width = "100%";

progressText.textContent = "اكتملت المعالجة";

const url = URL.createObjectURL(result);

preview.src = url;

removeBtn.textContent = "✅ تمت المعالجة"; 

    }

    catch(error){

        console.error(error);
        clearInterval(loading);

progress.style.width = "0%";

progressText.textContent = "فشل الاتصال بالمحرك";

        alert(error.message);

        removeBtn.textContent = "محرك إزالة الخلفية غير متصل";

    }

    removeBtn.disabled = false;

});

