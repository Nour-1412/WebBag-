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
/* ==========================================
   TEXT → PDF — ARABIC SAFE
========================================== */

const textToPdfInput =
    document.getElementById("textToPdfInput");

const createTextPdf =
    document.getElementById("createTextPdf");


if (createTextPdf && textToPdfInput) {

    createTextPdf.addEventListener("click", async () => {

        const text =
            textToPdfInput.value.trim();

        if (!text) {

            alert("من فضلك اكتب النص أولاً.");

            return;

        }

        const originalText =
            createTextPdf.textContent;

        createTextPdf.disabled = true;

        createTextPdf.textContent =
            "⏳ جارٍ إنشاء PDF...";

        let container = null;

        try {

            const {
                jsPDF
            } = window.jspdf;


            /* =========================
               إنشاء منطقة النص
            ========================= */

            container =
                document.createElement("div");

            container.style.position =
                "fixed";

            container.style.left =
                "-10000px";

            container.style.top =
                "0";

            container.style.width =
                "794px";

            container.style.boxSizing =
                "border-box";

            container.style.padding =
                "55px";

            container.style.background =
                "#ffffff";

            container.style.color =
                "#222222";

            container.style.fontFamily =
                "Cairo, Arial, sans-serif";

            container.style.fontSize =
                "22px";

            container.style.fontWeight =
                "400";

            container.style.lineHeight =
                "2";

            container.style.direction =
                "rtl";

            container.style.textAlign =
                "right";

            container.style.whiteSpace =
                "pre-wrap";

            container.style.wordBreak =
                "normal";

            container.style.overflowWrap =
                "break-word";

            container.textContent =
                text;


            document.body.appendChild(
                container
            );


            /*
              ننتظر تحميل الخط قبل التصوير
            */

            if (document.fonts) {

                await document.fonts.ready;

            }


            /* =========================
               تحويل النص إلى صورة
            ========================= */

            const canvas =
                await html2canvas(
                    container,
                    {
                        scale: 2,

                        useCORS: true,

                        backgroundColor:
                            "#ffffff",

                        logging: false
                    }
                );


            const imageData =
                canvas.toDataURL(
                    "image/png"
                );


            /* =========================
               إنشاء PDF
            ========================= */

            const pdf =
                new jsPDF({
                    orientation: "p",

                    unit: "mm",

                    format: "a4"
                });


            const pageWidth =
                pdf.internal.pageSize.getWidth();

            const pageHeight =
                pdf.internal.pageSize.getHeight();


            const margin = 10;

            const usableWidth =
                pageWidth - margin * 2;

            const usableHeight =
                pageHeight - margin * 2;


            const imageRatio =
                canvas.width /
                canvas.height;


            let imageWidth =
                usableWidth;

            let imageHeight =
                imageWidth /
                imageRatio;


            /*
              تقسيم النص على صفحات
              إذا كان أطول من صفحة A4
            */

            if (
                imageHeight <=
                usableHeight
            ) {

                const y =
                    (pageHeight -
                        imageHeight) / 2;

                pdf.addImage(
                    imageData,
                    "PNG",
                    margin,
                    y,
                    imageWidth,
                    imageHeight
                );

            } else {

                const pageCanvasHeight =
                    Math.floor(
                        canvas.width *
                        usableHeight /
                        usableWidth
                    );


                let sourceY = 0;

                let pageNumber = 0;


                while (
                    sourceY <
                    canvas.height
                ) {

                    const currentHeight =
                        Math.min(
                            pageCanvasHeight,
                            canvas.height -
                            sourceY
                        );


                    const pageCanvas =
                        document.createElement(
                            "canvas"
                        );


                    pageCanvas.width =
                        canvas.width;

                    pageCanvas.height =
                        currentHeight;


                    const context =
                        pageCanvas.getContext(
                            "2d"
                        );


                    context.drawImage(
                        canvas,

                        0,
                        sourceY,

                        canvas.width,
                        currentHeight,

                        0,
                        0,

                        canvas.width,
                        currentHeight
                    );


                    if (pageNumber > 0) {

                        pdf.addPage();

                    }


                    const pageImage =
                        pageCanvas.toDataURL(
                            "image/png"
                        );


                    const currentImageHeight =
                        currentHeight /
                        imageRatio;


                    pdf.addImage(
                        pageImage,
                        "PNG",
                        margin,
                        margin,
                        imageWidth,
                        currentImageHeight
                    );


                    sourceY +=
                        currentHeight;

                    pageNumber++;

                }

            }


            /* =========================
               تحميل الملف
            ========================= */

            pdf.save(
                "WebBag-Text.pdf"
            );


        } catch (error) {

            console.error(
                "TEXT PDF ERROR:",
                error
            );

            alert(
                "حدث خطأ أثناء إنشاء ملف PDF."
            );

        } finally {

            if (container) {

                container.remove();

            }

            createTextPdf.disabled =
                false;

            createTextPdf.textContent =
                originalText;

        }

    });

}

/* ==========================================
   IMAGES → PDF
========================================== */

const imagesToPdfInput =
    document.getElementById(
        "imagesToPdfInput"
    );

const imagesPreview =
    document.getElementById(
        "imagesPreview"
    );

const createImagesPdf =
    document.getElementById(
        "createImagesPdf"
    );


let selectedImages = [];


if (imagesToPdfInput) {

    imagesToPdfInput.addEventListener(
        "change",
        () => {

            selectedImages =
                Array.from(
                    imagesToPdfInput.files
                );


            if (!selectedImages.length){

                imagesPreview.textContent =
                    "لم يتم اختيار صور";

                createImagesPdf.disabled =
                    true;

                return;

            }


            imagesPreview.innerHTML =
                "";


            selectedImages.forEach(
                file => {

                    const image =
                        document.createElement(
                            "img"
                        );

                    image.className =
                        "image-preview-item";

                    image.alt =
                        file.name;


                    const reader =
                        new FileReader();


                    reader.onload = event => {

                        image.src =
                            event.target.result;

                    };


                    reader.readAsDataURL(
                        file
                    );


                    imagesPreview.appendChild(
                        image
                    );

                }
            );


            createImagesPdf.disabled =
                false;

        }
    );

}


if (createImagesPdf) {

    createImagesPdf.addEventListener(
        "click",
        async () => {

            if (!selectedImages.length){

                return;

            }


            const buttonText =
                createImagesPdf.textContent;

            createImagesPdf.disabled =
                true;

            createImagesPdf.textContent =
                "⏳ جارٍ إنشاء PDF...";


            try {

                const {
                    jsPDF
                } = window.jspdf;


                let pdf = null;


                for (
                    let i = 0;
                    i < selectedImages.length;
                    i++
                ){

                    const file =
                        selectedImages[i];


                    const dataUrl =
                        await readImageFile(
                            file
                        );


                    const image =
                        await loadPdfImage(
                            dataUrl
                        );


                    const width =
                        image.naturalWidth;

                    const height =
                        image.naturalHeight;


                    const ratio =
                        width / height;


                    let pageWidth =
                        210;

                    let pageHeight =
                        297;


                    let imageWidth =
                        pageWidth - 20;

                    let imageHeight =
                        imageWidth / ratio;


                    if (
                        imageHeight >
                        pageHeight - 20
                    ){

                        imageHeight =
                            pageHeight - 20;

                        imageWidth =
                            imageHeight * ratio;

                    }


                    if (!pdf){

                        pdf =
                            new jsPDF({
                                orientation:
                                    imageWidth >
                                    imageHeight
                                        ? "landscape"
                                        : "portrait",

                                unit:"mm",

                                format:"a4"
                            });

                    } else {

                        pdf.addPage(
                            "a4",
                            imageWidth >
                            imageHeight
                                ? "landscape"
                                : "portrait"
                        );

                    }


                    const x =
                        (pdf.internal.pageSize.getWidth()
                            - imageWidth) / 2;

                    const y =
                        (pdf.internal.pageSize.getHeight()
                            - imageHeight) / 2;


                    pdf.addImage(
                        dataUrl,
                        getImageFormat(file),
                        x,
                        y,
                        imageWidth,
                        imageHeight
                    );

                }


                if (pdf){

                    pdf.save(
                        "WebBag-Images.pdf"
                    );

                }


            } catch(error){

                console.error(error);

                alert(
                    "حدث خطأ أثناء تحويل الصور إلى PDF."
                );

            } finally {

                createImagesPdf.disabled =
                    selectedImages.length === 0;

                createImagesPdf.textContent =
                    buttonText;

            }

        }
    );

}


/* ==========================================
   IMAGE HELPERS
========================================== */

function readImageFile(file){

    return new Promise(
        (resolve,reject) => {

            const reader =
                new FileReader();


            reader.onload =
                () => resolve(
                    reader.result
                );


            reader.onerror =
                reject;


            reader.readAsDataURL(
                file
            );

        }
    );

}


function loadPdfImage(dataUrl){

    return new Promise(
        (resolve,reject) => {

            const image =
                new Image();


            image.onload =
                () => resolve(image);


            image.onerror =
                reject;


            image.src =
                dataUrl;

        }
    );

}


function getImageFormat(file){

    const type =
        file.type.toLowerCase();


    if (
        type.includes("png")
    ){

        return "PNG";

    }


    if (
        type.includes("webp")
    ){

        return "WEBP";

    }


    return "JPEG";

                       }

