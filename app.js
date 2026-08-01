import { runGateway } from "./ai/gateway.js";

const app = document.getElementById("app");

function renderHome() {

    app.innerHTML = `

        <div class="home">

            <h2>مرحبًا بك في WebBag AI</h2>

            <p>

                اختر الخدمة التي تريد استخدامها.

            </p>

            <div class="services">

                <button id="removeBg">

                    إزالة الخلفية

                </button>

                <button id="pdfTool">

                    تحويل إلى PDF

                </button>

                <button id="ocrTool">

                    OCR

                </button>

            </div>

        </div>

    `;

    document
    .getElementById("removeBg")
    .onclick = () => {

        renderBackgroundRemover();

    };

    document
        .getElementById("pdfTool")
        .onclick = () => {

            alert("قريبًا 🚀");

        };

    document
        .getElementById("ocrTool")
        .onclick = () => {

            alert("قريبًا 🚀");

        };

}

renderHome();
function renderBackgroundRemover() {

    app.innerHTML = `

        <h2>🖼️ إزالة الخلفية</h2>

        <p>

            اختر صورة لإزالة الخلفية باستخدام الذكاء الاصطناعي.

        </p>

        <input
            type="file"
            id="imageInput"
            accept="image/*"
        >

        <br><br>

        <button id="removeButton">

            إزالة الخلفية

        </button>

        <br><br>

        <button id="backHome">

            ← الرجوع للرئيسية

        </button>

    `;

    document
        .getElementById("backHome")
        .onclick = renderHome;

}
document
    .getElementById("removeButton")
    .onclick = () => {

        alert("⏳ جاري تشغيل WebBag AI...");

    };
