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
   IMAGES → PDF — FIXED
========================================== */

const imagesToPdfInput =
    document.getElementById("imagesToPdfInput");

const imagesPreview =
    document.getElementById("imagesPreview");

const createImagesPdf =
    document.getElementById("createImagesPdf");


let selectedImages = [];


/* ==========================================
   اختيار الصور + المعاينة
========================================== */

if (imagesToPdfInput) {

    imagesToPdfInput.addEventListener("change", () => {

        selectedImages =
            Array.from(imagesToPdfInput.files || [])
                .filter(file =>
                    file.type.startsWith("image/")
                );


        if (!selectedImages.length) {

            if (imagesPreview) {

                imagesPreview.textContent =
                    "لم يتم اختيار صور";

            }

            if (createImagesPdf) {

                createImagesPdf.disabled =
                    true;

            }

            return;

        }


        if (imagesPreview) {

            imagesPreview.innerHTML = "";

            selectedImages.forEach(file => {

                const reader =
                    new FileReader();


                const image =
                    document.createElement("img");


                image.className =
                    "image-preview-item";


                image.alt =
                    file.name;


                reader.onload = event => {

                    image.src =
                        event.target.result;

                };


                reader.readAsDataURL(file);


                imagesPreview.appendChild(image);

            });

        }


        if (createImagesPdf) {

            createImagesPdf.disabled =
                false;

        }

    });

}
/* ==========================================
   HANDWRITING IMAGE → PDF
========================================== */

const handwritingImageInput =
    document.getElementById("handwritingImageInput");

const handwritingPreview =
    document.getElementById("handwritingPreview");

const enhanceHandwriting =
    document.getElementById("enhanceHandwriting");

const createHandwritingPdf =
    document.getElementById("createHandwritingPdf");


let handwritingOriginalImage = null;
let handwritingEnhancedImage = null;


/* ==========================================
   اختيار الصورة
========================================== */

if (handwritingImageInput) {

    handwritingImageInput.addEventListener(
        "change",
        () => {

            const file =
                handwritingImageInput.files?.[0];

            if (!file) {

                handwritingOriginalImage = null;
                handwritingEnhancedImage = null;

                if (handwritingPreview) {

                    handwritingPreview.innerHTML =
                        "لم يتم اختيار صورة";

                }

                if (enhanceHandwriting) {

                    enhanceHandwriting.disabled = true;

                }

                if (createHandwritingPdf) {

                    createHandwritingPdf.disabled = true;

                }

                return;

            }


            if (!file.type.startsWith("image/")) {

                alert(
                    "من فضلك اختر ملف صورة."
                );

                return;

            }


            const reader =
                new FileReader();


            reader.onload = event => {

                handwritingOriginalImage =
                    event.target.result;

                handwritingEnhancedImage =
                    null;


                showHandwritingPreview(
                    handwritingOriginalImage
                );


                if (enhanceHandwriting) {

                    enhanceHandwriting.disabled =
                        false;

                }


                if (createHandwritingPdf) {

                    createHandwritingPdf.disabled =
                        false;

                }

            };


            reader.onerror = () => {

                alert(
                    "تعذر قراءة الصورة."
                );

            };


            reader.readAsDataURL(file);

        }
    );

}


/* ==========================================
   عرض المعاينة
========================================== */

function showHandwritingPreview(imageData) {

    if (!handwritingPreview) {
        return;
    }


    handwritingPreview.innerHTML = "";


    const image =
        document.createElement("img");


    image.src =
        imageData;


    image.alt =
        "معاينة الورقة";


    image.style.maxWidth =
        "100%";

    image.style.maxHeight =
        "500px";

    image.style.display =
        "block";

    image.style.margin =
        "auto";

    image.style.borderRadius =
        "18px";


    handwritingPreview.appendChild(
        image
    );

}


/* ==========================================
   تحسين الورقة
========================================== */

if (enhanceHandwriting) {

    enhanceHandwriting.addEventListener(
        "click",
        async () => {

            if (!handwritingOriginalImage) {

                alert("من فضلك اختر صورة أولاً.");

                return;

            }

            const originalText =
                enhanceHandwriting.textContent;

            enhanceHandwriting.disabled = true;

            enhanceHandwriting.textContent =
                "⏳ جارٍ تحسين الصورة...";

            try {

                const result =
                    await enhanceHandwritingImage(
                        handwritingOriginalImage
                    );

                if (!result) {

                    throw new Error(
                        "لم يتم إنشاء الصورة المحسنة."
                    );

                }

                handwritingEnhancedImage =
                    result;

                showHandwritingPreview(
                    handwritingEnhancedImage
                );

            } catch (error) {

                console.error(
                    "HANDWRITING ENHANCE ERROR:",
                    error
                );

                alert(
                    "تعذر تحسين الصورة. سيتم استخدام الصورة الأصلية."
                );

                handwritingEnhancedImage = null;

                showHandwritingPreview(
                    handwritingOriginalImage
                );

            } finally {

                enhanceHandwriting.disabled =
                    false;

                enhanceHandwriting.textContent =
                    originalText;

            }

        }
    );

}

            if (!handwritingOriginalImage) {

                return;

            }


            const originalText =
                enhanceHandwriting.textContent;


            enhanceHandwriting.disabled =
                true;

            enhanceHandwriting.textContent =
                "⏳ جارٍ تحسين الصورة...";


            try {

                handwritingEnhancedImage =
                    await enhanceHandwritingImage(
                        handwritingOriginalImage
                    );


                showHandwritingPreview(
                    handwritingEnhancedImage
                );


                /*
                 * بعد التحسين نستخدم النسخة المحسنة
                 * عند إنشاء PDF.
                 */

            } catch (error) {

                console.error(
                    "HANDWRITING ENHANCE ERROR:",
                    error
                );


                alert(
                    "حدث خطأ أثناء تحسين الصورة."
                );

            } finally {

                enhanceHandwriting.disabled =
                    false;

                enhanceHandwriting.textContent =
                    originalText;

            }

        }
    );

}


/* ==========================================
   معالجة الصورة محليًا
========================================== */

function enhanceHandwritingImage(imageData) {

    return new Promise((resolve, reject) => {

        const image =
            new Image();


        image.onload = () => {

            const canvas =
                document.createElement(
                    "canvas"
                );


            canvas.width =
                image.naturalWidth;

            canvas.height =
                image.naturalHeight;


            const context =
                canvas.getContext(
                    "2d"
                );


            if (!context) {

                reject(
                    new Error(
                        "تعذر إنشاء Canvas."
                    )
                );

                return;

            }


            context.drawImage(
                image,
                0,
                0
            );


            const imageDataObject =
                context.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );


            const pixels =
                imageDataObject.data;


            /*
             * تحسين بسيط وآمن:
             * زيادة التباين مع الحفاظ على الألوان
             * وعدم تحويل الورقة إلى أبيض وأسود.
             */

            const contrast = 1.18;

            const factor =
                (259 * (contrast + 255)) /
                (255 * (259 - contrast));


            for (
                let i = 0;
                i < pixels.length;
                i += 4
            ) {

                pixels[i] =
                    clampColor(
                        factor *
                        (pixels[i] - 128) +
                        128
                    );


                pixels[i + 1] =
                    clampColor(
                        factor *
                        (pixels[i + 1] - 128) +
                        128
                    );


                pixels[i + 2] =
                    clampColor(
                        factor *
                        (pixels[i + 2] - 128) +
                        128
                    );

            }


            context.putImageData(
                imageDataObject,
                0,
                0
            );


            resolve(
                canvas.toDataURL(
                    "image/jpeg",
                    0.95
                )
            );

        };


        image.onerror = () => {

            reject(
                new Error(
                    "تعذر تحميل الصورة."
                )
            );

        };


        image.src =
            imageData;

    });

}


/* ==========================================
   ضبط الألوان
========================================== */

function clampColor(value) {

    return Math.max(
        0,
        Math.min(
            255,
            value
        )
    );

}


/* ==========================================
   تحويل الصورة إلى PDF
========================================== */

if (createHandwritingPdf) {

    createHandwritingPdf.addEventListener(
        "click",
        async () => {

            const imageData =
                handwritingEnhancedImage ||
                handwritingOriginalImage;


            if (!imageData) {

                alert(
                    "من فضلك اختر صورة أولاً."
                );

                return;

            }


            const originalText =
                createHandwritingPdf.textContent;


            createHandwritingPdf.disabled =
                true;

            createHandwritingPdf.textContent =
                "⏳ جارٍ إنشاء PDF...";


            try {

                const {
                    jsPDF
                } = window.jspdf;


                const image =
                    await loadHandwritingImage(
                        imageData
                    );


                const width =
                    image.naturalWidth ||
                    image.width;


                const height =
                    image.naturalHeight ||
                    image.height;


                const orientation =
                    width >= height
                        ? "landscape"
                        : "portrait";


                const pdf =
                    new jsPDF({
                        orientation,
                        unit: "mm",
                        format: "a4"
                    });


                const pageWidth =
                    pdf.internal.pageSize.getWidth();

                const pageHeight =
                    pdf.internal.pageSize.getHeight();


                const margin = 10;


                const availableWidth =
                    pageWidth -
                    margin * 2;


                const availableHeight =
                    pageHeight -
                    margin * 2;


                const ratio =
                    width / height;


                let finalWidth =
                    availableWidth;


                let finalHeight =
                    finalWidth / ratio;


                if (
                    finalHeight >
                    availableHeight
                ) {

                    finalHeight =
                        availableHeight;

                    finalWidth =
                        finalHeight * ratio;

                }


                const x =
                    (pageWidth -
                        finalWidth) / 2;


                const y =
                    (pageHeight -
                        finalHeight) / 2;


                pdf.addImage(
                    imageData,
                    "JPEG",
                    x,
                    y,
                    finalWidth,
                    finalHeight
                );


                pdf.save(
                    "WebBag-Handwriting.pdf"
                );


            } catch (error) {

                console.error(
                    "HANDWRITING PDF ERROR:",
                    error
                );


                alert(
                    "حدث خطأ أثناء إنشاء PDF."
                );

            } finally {

                createHandwritingPdf.disabled =
                    false;

                createHandwritingPdf.textContent =
                    originalText;

            }

        }
    );

}


/* ==========================================
   تحميل صورة الكتابة اليدوية
========================================== */

function loadHandwritingImage(imageData) {

    return new Promise((resolve, reject) => {

        const image =
            new Image();


        image.onload = () => {

            resolve(image);

        };


        image.onerror = () => {

            reject(
                new Error(
                    "تعذر تحميل الصورة."
                )
            );

        };


        image.src =
            imageData;

    });

}

/* ==========================================
   إنشاء PDF من الصور
========================================== */

if (createImagesPdf) {

    createImagesPdf.addEventListener("click", async () => {

        if (!selectedImages.length) {

            alert("من فضلك اختر صورة أولاً.");

            return;

        }


        const originalText =
            createImagesPdf.textContent;


        createImagesPdf.disabled =
            true;

        createImagesPdf.textContent =
            "⏳ جارٍ إنشاء PDF...";


        try {

            const { jsPDF } =
                window.jspdf;


            let pdf = null;


            for (
                let i = 0;
                i < selectedImages.length;
                i++
            ) {

                const file =
                    selectedImages[i];


                /*
                 * نحول كل صورة إلى JPEG عبر Canvas.
                 * هذا يتجنب مشاكل PNG / WEBP / بعض
                 * صيغ الصور مع jsPDF.
                 */

                const imageData =
                    await convertImageToJpeg(file);


                const image =
                    await loadImage(imageData);


                const imageWidth =
                    image.naturalWidth ||
                    image.width;


                const imageHeight =
                    image.naturalHeight ||
                    image.height;


                if (
                    !imageWidth ||
                    !imageHeight
                ) {

                    throw new Error(
                        "تعذر قراءة أبعاد الصورة."
                    );

                }


                const ratio =
                    imageWidth /
                    imageHeight;


                /*
                 * نحدد اتجاه الصفحة حسب
                 * اتجاه الصورة.
                 */

                const orientation =
                    imageWidth >= imageHeight
                        ? "landscape"
                        : "portrait";


                if (!pdf) {

                    pdf =
                        new jsPDF({
                            orientation,
                            unit: "mm",
                            format: "a4"
                        });

                } else {

                    pdf.addPage(
                        "a4",
                        orientation
                    );

                }


                const pageWidth =
                    pdf.internal.pageSize.getWidth();

                const pageHeight =
                    pdf.internal.pageSize.getHeight();


                const margin = 10;


                const availableWidth =
                    pageWidth -
                    margin * 2;


                const availableHeight =
                    pageHeight -
                    margin * 2;


                let finalWidth =
                    availableWidth;


                let finalHeight =
                    finalWidth / ratio;


                /*
                 * إذا كانت الصورة أطول من الصفحة،
                 * نصغرها مع الحفاظ على النسبة.
                 */

                if (
                    finalHeight >
                    availableHeight
                ) {

                    finalHeight =
                        availableHeight;

                    finalWidth =
                        finalHeight * ratio;

                }


                /*
                 * توسيط الصورة في الصفحة.
                 */

                const x =
                    (pageWidth -
                        finalWidth) / 2;


                const y =
                    (pageHeight -
                        finalHeight) / 2;


                pdf.addImage(
                    imageData,
                    "JPEG",
                    x,
                    y,
                    finalWidth,
                    finalHeight
                );

            }


            if (pdf) {

                pdf.save(
                    "WebBag-Images.pdf"
                );

            }


        } catch (error) {

            console.error(
                "IMAGES PDF ERROR:",
                error
            );


            alert(
                "حدث خطأ أثناء تحويل الصور إلى PDF."
            );

        } finally {

            createImagesPdf.disabled =
                selectedImages.length === 0;


            createImagesPdf.textContent =
                originalText;

        }

    });

}


/* ==========================================
   تحويل الصورة إلى JPEG
========================================== */

function convertImageToJpeg(file) {

    return new Promise((resolve, reject) => {

        const reader =
            new FileReader();


        reader.onload = event => {

            const image =
                new Image();


            image.onload = () => {

                const canvas =
                    document.createElement("canvas");


                canvas.width =
                    image.naturalWidth;


                canvas.height =
                    image.naturalHeight;


                const context =
                    canvas.getContext("2d");


                if (!context) {

                    reject(
                        new Error(
                            "تعذر إنشاء Canvas."
                        )
                    );

                    return;

                }


                /*
                 * خلفية بيضاء حتى الصور التي
                 * تحتوي على شفافية لا تظهر سوداء.
                 */

                context.fillStyle =
                    "#ffffff";


                context.fillRect(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );


                context.drawImage(
                    image,
                    0,
                    0
                );


                resolve(
                    canvas.toDataURL(
                        "image/jpeg",
                        0.95
                    )
                );

            };


            image.onerror = () => {

                reject(
                    new Error(
                        "تعذر تحميل الصورة."
                    )
                );

            };


            image.src =
                event.target.result;

        };


        reader.onerror = () => {

            reject(
                new Error(
                    "تعذر قراءة ملف الصورة."
                )
            );

        };


        reader.readAsDataURL(file);

    });

}


/* ==========================================
   تحميل الصورة
========================================== */

function loadImage(dataUrl) {

    return new Promise((resolve, reject) => {

        const image =
            new Image();


        image.onload = () => {

            resolve(image);

        };


        image.onerror = () => {

            reject(
                new Error(
                    "تعذر تحميل بيانات الصورة."
                )
            );

        };


        image.src =
            dataUrl;

    });

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

