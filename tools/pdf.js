/* ==========================================
   WebBag PDF AI
   Part 1 — File Selection & PDF Reader
========================================== */

const pdfFileInput = document.getElementById("pdfFile");
const pdfFileName = document.getElementById("pdfFileName");
const pdfStatus = document.getElementById("pdfStatus");
const pdfText = document.getElementById("pdfText");

const summarizePdf = document.getElementById("summarizePdf");
const copyPdfText = document.getElementById("copyPdfText");
const clearPdf = document.getElementById("clearPdf");

let selectedPdfFile = null;
let extractedPdfText = "";


/* ==========================================
   اختيار ملف PDF
========================================== */

if (pdfFileInput) {

    pdfFileInput.addEventListener("change", async () => {

        const file = pdfFileInput.files[0];

        if (!file) {
            return;
        }

        selectedPdfFile = file;

        pdfFileName.textContent =
            `📄 ${file.name}`;

        pdfStatus.textContent =
            "⏳ جارٍ تجهيز ملف PDF...";

        pdfText.innerHTML = `
            <p class="pdf-placeholder">
                جارٍ قراءة الملف...
            </p>
        `;

        extractedPdfText = "";

        if (summarizePdf) {
            summarizePdf.disabled = true;
        }

        if (copyPdfText) {
            copyPdfText.disabled = true;
        }

        try {

            await loadPdfReader();

            await readPdfFile(file);

        } catch (error) {

            console.error(error);

            pdfStatus.textContent =
                "❌ حدث خطأ أثناء قراءة الملف.";

            pdfText.innerHTML = `
                <p class="pdf-placeholder">
                    تعذر قراءة هذا الملف.
                </p>
            `;

        }

    });

}


/* ==========================================
   تحميل PDF.js
========================================== */

let pdfReaderPromise = null;

function loadPdfReader() {

    if (pdfReaderPromise) {
        return pdfReaderPromise;
    }

    pdfReaderPromise = new Promise((resolve, reject) => {

        if (window.pdfjsLib) {
            resolve(window.pdfjsLib);
            return;
        }

        const script =
            document.createElement("script");

        script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";

        script.onload = () => {

            if (!window.pdfjsLib) {

                reject(
                    new Error("PDF.js loaded but is unavailable")
                );

                return;
            }

            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

            resolve(window.pdfjsLib);

        };

        script.onerror = () => {

            reject(
                new Error("Unable to load PDF.js")
            );

        };

        document.head.appendChild(script);

    });

    return pdfReaderPromise;
}


/* ==========================================
   قراءة ملف PDF
========================================== */

async function readPdfFile(file) {

    if (!file.type.includes("pdf")) {

        pdfStatus.textContent =
            "❌ الملف المختار ليس ملف PDF.";

        return;

    }

    const arrayBuffer =
        await file.arrayBuffer();

    const loadingTask =
        window.pdfjsLib.getDocument({
            data: arrayBuffer
        });

    const pdf =
        await loadingTask.promise;

    let fullText = "";

    for (
        let pageNumber = 1;
        pageNumber <= pdf.numPages;
        pageNumber++
    ) {

        const page =
            await pdf.getPage(pageNumber);

        const content =
            await page.getTextContent();

        const pageText =
            content.items
                .map(item => item.str)
                .join(" ");

        fullText +=
            `\n\n--- الصفحة ${pageNumber} ---\n\n`;

        fullText += pageText;

    }

    extractedPdfText =
        fullText.trim();

    if (!extractedPdfText) {

        pdfStatus.textContent =
            "⚠️ لم يتم العثور على نص قابل للاستخراج.";

        pdfText.innerHTML = `
            <p class="pdf-placeholder">
                يبدو أن الملف عبارة عن صور ممسوحة ضوئيًا
                أو لا يحتوي على نص قابل للقراءة مباشرة.
            </p>
        `;

        return;

    }

    pdfStatus.textContent =
        `✅ تم استخراج النص من ${pdf.numPages} صفحة.`;

    pdfText.textContent =
        extractedPdfText;

    if (copyPdfText) {
        copyPdfText.disabled = false;
    }

    if (summarizePdf) {
        summarizePdf.disabled = false;
    }

                                  }
/* ==========================================
   نسخ النص
========================================== */

if (copyPdfText) {

    copyPdfText.addEventListener("click", async () => {

        if (!extractedPdfText) {
            return;
        }

        try {

            await navigator.clipboard.writeText(
                extractedPdfText
            );

            const originalText =
                copyPdfText.textContent;

            copyPdfText.textContent =
                "✅ تم نسخ النص";

            setTimeout(() => {

                copyPdfText.textContent =
                    originalText;

            }, 1800);

        } catch (error) {

            console.error(error);

            pdfStatus.textContent =
                "❌ تعذر نسخ النص.";

        }

    });

}


/* ==========================================
   مسح الملف
========================================== */

if (clearPdf) {

    clearPdf.addEventListener("click", () => {

        selectedPdfFile = null;

        extractedPdfText = "";

        if (pdfFileInput) {
            pdfFileInput.value = "";
        }

        if (pdfFileName) {

            pdfFileName.textContent =
                "لم يتم اختيار ملف";

        }

        if (pdfStatus) {

            pdfStatus.textContent =
                "في انتظار اختيار ملف PDF...";

        }

        if (pdfText) {

            pdfText.innerHTML = `
                <p class="pdf-placeholder">
                    سيظهر محتوى الملف هنا بعد قراءته.
                </p>
            `;

        }

        if (pdfSummary) {

            pdfSummary.innerHTML = `
                <p class="pdf-placeholder">
                    سيظهر الملخص هنا بعد اختيار الملف.
                </p>
            `;

        }

        if (summarizePdf) {
            summarizePdf.disabled = true;
        }

        if (copyPdfText) {
            copyPdfText.disabled = true;
        }

    });

}


/* ==========================================
   التلخيص
========================================== */

if (summarizePdf) {

    summarizePdf.addEventListener("click", () => {

        if (!extractedPdfText) {
            return;
        }

        if (!pdfSummary) {
            return;
        }

        pdfSummary.innerHTML = `
            <p>
                تم استخراج النص من الملف بنجاح.
            </p>

            <p>
                التلخيص الذكي سيُضاف في المرحلة التالية
                باستخدام محرك ذكاء اصطناعي مناسب.
            </p>
        `;

    });

      }
/* ==========================================
   حالة الأداة النهائية
========================================== */

function resetPdfInterface() {

    selectedPdfFile = null;
    extractedPdfText = "";

    if (pdfFileInput) {
        pdfFileInput.value = "";
    }

    if (pdfFileName) {
        pdfFileName.textContent =
            "لم يتم اختيار ملف";
    }

    if (pdfStatus) {
        pdfStatus.textContent =
            "في انتظار اختيار ملف PDF...";
    }

    if (pdfText) {
        pdfText.innerHTML = `
            <p class="pdf-placeholder">
                سيظهر محتوى الملف هنا بعد قراءته.
            </p>
        `;
    }

    if (pdfSummary) {
        pdfSummary.innerHTML = `
            <p class="pdf-placeholder">
                سيظهر الملخص هنا بعد اختيار الملف.
            </p>
        `;
    }

    if (summarizePdf) {
        summarizePdf.disabled = true;
    }

    if (copyPdfText) {
        copyPdfText.disabled = true;
    }

}


/* ==========================================
   التحقق من الملف
========================================== */

function isValidPdf(file) {

    if (!file) {
        return false;
    }

    return (
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );

}


/* ==========================================
   حماية واجهة النص
========================================== */

function showPdfError(message) {

    if (pdfStatus) {
        pdfStatus.textContent =
            `❌ ${message}`;
    }

    if (pdfText) {
        pdfText.innerHTML = `
            <p class="pdf-placeholder">
                ${message}
            </p>
        `;
    }

}


/* ==========================================
   إعادة التحقق عند اختيار ملف
========================================== */

if (pdfFileInput) {

    pdfFileInput.addEventListener("change", () => {

        const file =
            pdfFileInput.files[0];

        if (!file) {
            return;
        }

        if (!isValidPdf(file)) {

            showPdfError(
                "يرجى اختيار ملف PDF صالح."
            );

            resetPdfInterface();

            return;
        }

    });

}


/* ==========================================
   جاهزية الأداة
========================================== */

if (pdfStatus) {

    pdfStatus.textContent =
        "✅ أداة PDF AI جاهزة.";

      }


