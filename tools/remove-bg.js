import WebBagAI from "../webbag-engine.js";
const input = document.getElementById("imageInput");
const preview = document.getElementById("preview");
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

    try{

        await WebBagAI.removeBackground(selectedFile);

        removeBtn.textContent = "✅ تم إزالة الخلفية";

    }

    catch(error){

        console.error(error);

        alert(error.message);

        removeBtn.textContent = "محرك إزالة الخلفية غير متصل";

    }

    removeBtn.disabled = false;

});

