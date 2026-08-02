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

removeBtn.addEventListener("click", function () {

    if (!selectedFile) {

        alert("اختر صورة أولاً");

        return;

    }

    alert("في الخطوة القادمة سيتم إزالة الخلفية بالذكاء الاصطناعي.");

});
