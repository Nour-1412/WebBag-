/* =========================================================
WebBag PDF AI
Complete PDF Tool
Compatible with the supplied HTML
========================================================= */

/* =========================================================
GLOBAL STATE
========================================================= */

let selectedPdfFile = null;
let extractedPdfText = "";

let selectedImages = [];

let handwritingOriginalImage = null;
let handwritingEnhancedImage = null;

/* =========================================================
DOM ELEMENTS
========================================================= */

/* ---------- PDF Reader ---------- */

const pdfFileInput =
document.getElementById("pdfFile");

const pdfFileName =
document.getElementById("pdfFileName");

const pdfStatus =
document.getElementById("pdfStatus");

const pdfText =
document.getElementById("pdfText");

const pdfSummary =
document.getElementById("pdfSummary");

const summarizePdf =
document.getElementById("summarizePdf");

const copyPdfText =
document.getElementById("copyPdfText");

const clearPdf =
document.getElementById("clearPdf");

/* ---------- Text → PDF ---------- */

const textToPdfInput =
document.getElementById("textToPdfInput");

const createTextPdf =
document.getElementById("createTextPdf");

/* ---------- Images → PDF ---------- */

const imagesToPdfInput =
document.getElementById("imagesToPdfInput");

const imagesPreview =
document.getElementById("imagesPreview");

const createImagesPdf =
document.getElementById("createImagesPdf");

/* ---------- Handwriting → PDF ---------- */

const handwritingImageInput =
document.getElementById("handwritingImageInput");

const handwritingPreview =
document.getElementById("handwritingPreview");

const enhanceHandwriting =
document.getElementById("enhanceHandwriting");

const createHandwritingPdf =
document.getElementById("createHandwritingPdf");

/* =========================================================
UTILITY
========================================================= */

function setButtonLoading(button, loadingText) {

if (!button) {
    return null;
}

const originalText =
    button.textContent;

button.disabled = true;

button.textContent =
    loadingText;

return originalText;

}

function restoreButton(button, originalText) {

if (!button) {
    return;
}

button.disabled = false;

if (originalText !== null &&
    originalText !== undefined) {

    button.textContent =
        originalText;

}

}

function createTimestamp() {

return new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

}

function isValidPdf(file) {

if (!file) {
    return false;
}

return (
    file.type === "application/pdf" ||
    file.name
        .toLowerCase()
        .endsWith(".pdf")
);

}

function showPdfError(message) {

if (pdfStatus) {

    pdfStatus.textContent =
        `❌ ${message}`;

}

if (pdfText) {

    pdfText.innerHTML = `
        <p class="pdf-placeholder">
            ${escapeHtml(message)}
        </p>
    `;

}

}

function escapeHtml(value) {

const div =
    document.createElement("div");

div.textContent =
    value ?? "";

return div.innerHTML;

}

/* =========================================================
PDF.JS LOADER
========================================================= */

let pdfReaderPromise = null;

function loadPdfReader() {

if (pdfReaderPromise) {
    return pdfReaderPromise;
}


pdfReaderPromise =
    new Promise((resolve, reject) => {

        if (window.pdfjsLib) {

            configurePdfReader();

            resolve(
                window.pdfjsLib
            );

            return;

        }


        const script =
            document.createElement("script");


        script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";


        script.async = true;


        script.onload = () => {

            if (!window.pdfjsLib) {

                reject(
                    new Error(
                        "PDF.js loaded but is unavailable."
                    )
                );

                return;

            }


            configurePdfReader();


            resolve(
                window.pdfjsLib
            );

        };


        script.onerror = () => {

            reject(
                new Error(
                    "Unable to load PDF.js."
                )
            );

        };


        document.head.appendChild(
            script
        );

    });


return pdfReaderPromise;

}

function configurePdfReader() {

if (
    window.pdfjsLib &&
    window.pdfjsLib.GlobalWorkerOptions
) {

    window.pdfjsLib
        .GlobalWorkerOptions
        .workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

}

}

/* =========================================================
READ PDF
========================================================= */

async function readPdfFile(file) {

if (!isValidPdf(file)) {

    showPdfError(
        "يرجى اختيار ملف PDF صالح."
    );

    return;

}


if (pdfStatus) {

    pdfStatus.textContent =
        "⏳ جارٍ قراءة ملف PDF...";

}


if (pdfText) {

    pdfText.innerHTML = `
        <p class="pdf-placeholder">
            ⏳ جارٍ استخراج النص من الملف...
        </p>
    `;

}


extractedPdfText = "";


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

    if (pdfStatus) {

        pdfStatus.textContent =
            `⏳ جارٍ قراءة الصفحة ${pageNumber} من ${pdf.numPages}...`;

    }


    const page =
        await pdf.getPage(
            pageNumber
        );


    const content =
        await page.getTextContent();


    const pageText =
        content.items
            .map(item => item.str || "")
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();


    fullText +=
        `\n\n--- الصفحة ${pageNumber} ---\n\n`;


    fullText +=
        pageText;

}


extractedPdfText =
    fullText.trim();


if (!extractedPdfText) {

    if (pdfStatus) {

        pdfStatus.textContent =
            "⚠️ لم يتم العثور على نص قابل للاستخراج.";

    }


    if (pdfText) {

        pdfText.innerHTML = `
            <p class="pdf-placeholder">
                يبدو أن الملف عبارة عن صور ممسوحة ضوئيًا
                أو لا يحتوي على نص قابل للاستخراج مباشرة.
            </p>
        `;

    }


    if (copyPdfText) {
        copyPdfText.disabled = true;
    }


    if (summarizePdf) {
        summarizePdf.disabled = true;
    }


    return;

}


if (pdfStatus) {

    pdfStatus.textContent =
        `✅ تم استخراج النص من ${pdf.numPages} صفحة بنجاح.`;

}


if (pdfText) {

    pdfText.textContent =
        extractedPdfText;

}


if (copyPdfText) {
    copyPdfText.disabled = false;
}


if (summarizePdf) {
    summarizePdf.disabled = false;
}

}

/* =========================================================
PDF FILE SELECTION
========================================================= */

if (pdfFileInput) {

pdfFileInput.addEventListener(
    "change",
    async () => {

        const file =
            pdfFileInput.files &&
            pdfFileInput.files[0]
                ? pdfFileInput.files[0]
                : null;


        if (!file) {
            return;
        }


        if (!isValidPdf(file)) {

            pdfFileInput.value = "";

            selectedPdfFile = null;

            extractedPdfText = "";


            showPdfError(
                "يرجى اختيار ملف PDF صالح."
            );


            if (summarizePdf) {
                summarizePdf.disabled = true;
            }


            if (copyPdfText) {
                copyPdfText.disabled = true;
            }


            return;

        }


        selectedPdfFile =
            file;


        extractedPdfText =
            "";


        if (pdfFileName) {

            pdfFileName.textContent =
                `📄 ${file.name}`;

        }


        if (pdfText) {

            pdfText.innerHTML = `
                <p class="pdf-placeholder">
                    ⏳ جارٍ تجهيز الملف...
                </p>
            `;

        }


        if (summarizePdf) {
            summarizePdf.disabled = true;
        }


        if (copyPdfText) {
            copyPdfText.disabled = true;
        }


        try {

            await loadPdfReader();

            await readPdfFile(
                file
            );

        } catch (error) {

            console.error(
                "PDF READER ERROR:",
                error
            );


            showPdfError(
                "حدث خطأ أثناء قراءة ملف PDF."
            );

        }

    }
);

}

/* =========================================================
COPY PDF TEXT
========================================================= */

if (copyPdfText) {

copyPdfText.addEventListener(
    "click",
    async () => {

        if (!extractedPdfText) {

            return;

        }


        try {

            await navigator
                .clipboard
                .writeText(
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

            console.error(
                "COPY PDF TEXT ERROR:",
                error
            );


            if (pdfStatus) {

                pdfStatus.textContent =
                    "❌ تعذر نسخ النص.";

            }

        }

    }
);

}

/* =========================================================
LOCAL PDF SUMMARY
========================================================= */

if (summarizePdf) {

summarizePdf.addEventListener(
    "click",
    () => {

        if (!extractedPdfText) {
            return;
        }


        if (!pdfSummary) {
            return;
        }


        const originalText =
            summarizePdf.textContent;


        summarizePdf.disabled =
            true;


        summarizePdf.textContent =
            "⏳ جارٍ إعداد الملخص...";


        try {

            const summary =
                createLocalSummary(
                    extractedPdfText
                );


            pdfSummary.innerHTML =
                summary;


        } catch (error) {

            console.error(
                "PDF SUMMARY ERROR:",
                error
            );


            pdfSummary.innerHTML = `
                <p class="pdf-placeholder">
                    ❌ تعذر إنشاء الملخص.
                </p>
            `;

        } finally {

            summarizePdf.disabled =
                false;

            summarizePdf.textContent =
                originalText;

        }

    }
);

}

/* =========================================================
LOCAL SUMMARY ENGINE
========================================================= */

function createLocalSummary(text) {

const cleanText =
    text
        .replace(/--- الصفحة \d+ ---/g, "")
        .replace(/\s+/g, " ")
        .trim();


if (!cleanText) {

    return `
        <p class="pdf-placeholder">
            لا يوجد نص كافٍ لإنشاء ملخص.
        </p>
    `;

}


const sentences =
    cleanText
        .split(
            /(?<=[.!؟?])\s+/
        )
        .map(sentence =>
            sentence.trim()
        )
        .filter(sentence =>
            sentence.length > 25
        );


if (!sentences.length) {

    return `
        <p>
            تم استخراج النص بنجاح.
        </p>

        <p>
            ${escapeHtml(
                cleanText.slice(0, 1200)
            )}
        </p>
    `;

}


const maxSentences =
    Math.min(
        6,
        sentences.length
    );


const selected =
    sentences.slice(
        0,
        maxSentences
    );


return `
    <p>
        ✨ <strong>ملخص مبدئي للملف</strong>
    </p>

    <ul>
        ${selected
            .map(sentence =>
                `<li>${escapeHtml(sentence)}</li>`
            )
            .join("")}
    </ul>

    <p class="pdf-summary-note">
        هذا ملخص محلي مبدئي. يمكن ربطه لاحقًا بمحرك
        ذكاء اصطناعي لإنتاج تلخيص أعمق وتحليل كامل للملف.
    </p>
`;

}

/* =========================================================
CLEAR PDF
========================================================= */

if (clearPdf) {

clearPdf.addEventListener(
    "click",
    () => {

        resetPdfInterface();

    }
);

}

/* =========================================================
RESET PDF INTERFACE
========================================================= */

function resetPdfInterface() {

selectedPdfFile =
    null;

extractedPdfText =
    "";


if (pdfFileInput) {

    pdfFileInput.value =
        "";

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

/* =========================================================
TEXT → PDF
========================================================= */

if (
createTextPdf &&
textToPdfInput
) {

createTextPdf.addEventListener(
    "click",
    async () => {

        const text =
            textToPdfInput.value.trim();


        if (!text) {

            alert(
                "من فضلك اكتب النص أولاً."
            );

            return;

        }


        const originalText =
            setButtonLoading(
                createTextPdf,
                "⏳ جارٍ إنشاء PDF..."
            );


        let container =
            null;


        try {

            if (!window.jspdf) {

                throw new Error(
                    "jsPDF غير متاح."
                );

            }


            if (!window.html2canvas) {

                throw new Error(
                    "html2canvas غير متاح."
                );

            }


            const {
                jsPDF
            } =
                window.jspdf;


            container =
                document.createElement(
                    "div"
                );


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


            if (document.fonts) {

                await document.fonts.ready;

            }


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


            const margin =
                10;


            const usableWidth =
                pageWidth -
                margin * 2;


            const usableHeight =
                pageHeight -
                margin * 2;


            const imageRatio =
                canvas.width /
                canvas.height;


            const pageCanvasHeight =
                Math.floor(
                    canvas.width *
                    usableHeight /
                    usableWidth
                );


            let sourceY =
                0;


            let pageNumber =
                0;


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


                if (!context) {

                    throw new Error(
                        "تعذر إنشاء Canvas."
                    );

                }


                context.fillStyle =
                    "#ffffff";


                context.fillRect(
                    0,
                    0,
                    pageCanvas.width,
                    pageCanvas.height
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
                    usableWidth,
                    currentImageHeight
                );


                sourceY +=
                    currentHeight;


                pageNumber++;

            }


            pdf.save(
                `WebBag-Text-${createTimestamp()}.pdf`
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


            restoreButton(
                createTextPdf,
                originalText
            );

        }

    }
);

}

/* =========================================================
IMAGES → PDF
========================================================= */

if (imagesToPdfInput) {

imagesToPdfInput.addEventListener(
    "change",
    () => {

        selectedImages =
            Array.from(
                imagesToPdfInput.files || []
            )
            .filter(
                file =>
                    file.type &&
                    file.type.startsWith(
                        "image/"
                    )
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

            imagesPreview.innerHTML =
                "";


            selectedImages.forEach(
                file => {

                    const reader =
                        new FileReader();


                    const image =
                        document.createElement(
                            "img"
                        );


                    image.className =
                        "image-preview-item";


                    image.alt =
                        file.name;


                    reader.onload =
                        event => {

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

        }


        if (createImagesPdf) {

            createImagesPdf.disabled =
                false;

        }

    }
);

}

if (createImagesPdf) {

createImagesPdf.addEventListener(
    "click",
    async () => {

        if (!selectedImages.length) {

            alert(
                "من فضلك اختر صورة واحدة على الأقل."
            );

            return;

        }


        const originalText =
            setButtonLoading(
                createImagesPdf,
                "⏳ جارٍ إنشاء PDF..."
            );


        try {

            if (!window.jspdf) {

                throw new Error(
                    "jsPDF غير متاح."
                );

            }


            const {
                jsPDF
            } =
                window.jspdf;


            let pdf =
                null;


            for (
                let i = 0;
                i < selectedImages.length;
                i++
            ) {

                const file =
                    selectedImages[i];


                const imageData =
                    await convertImageToJpeg(
                        file
                    );


                const image =
                    await loadImage(
                        imageData
                    );


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


                const margin =
                    10;


                const availableWidth =
                    pageWidth -
                    margin * 2;


                const availableHeight =
                    pageHeight -
                    margin * 2;


                let finalWidth =
                    availableWidth;


                let finalHeight =
                    finalWidth /
                    ratio;


                if (
                    finalHeight >
                    availableHeight
                ) {

                    finalHeight =
                        availableHeight;


                    finalWidth =
                        finalHeight *
                        ratio;

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

            }


            if (pdf) {

                pdf.save(
                    `WebBag-Images-${createTimestamp()}.pdf`
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

            restoreButton(
                createImagesPdf,
                originalText
            );


            if (createImagesPdf) {

                createImagesPdf.disabled =
                    selectedImages.length === 0;

            }

        }

    }
);

}

/* =========================================================
CONVERT IMAGE TO JPEG
========================================================= */

function convertImageToJpeg(file) {

return new Promise(
    (resolve, reject) => {

        if (!file) {

            reject(
                new Error(
                    "لا توجد صورة."
                )
            );

            return;

        }


        const reader =
            new FileReader();


        reader.onload =
            event => {

                const image =
                    new Image();


                image.onload =
                    () => {

                        const width =
                            image.naturalWidth ||
                            image.width;


                        const height =
                            image.naturalHeight ||
                            image.height;


                        if (
                            !width ||
                            !height
                        ) {

                            reject(
                                new Error(
                                    "تعذر قراءة أبعاد الصورة."
                                )
                            );

                            return;

                        }


                        const canvas =
                            document.createElement(
                                "canvas"
                            );


                        canvas.width =
                            width;


                        canvas.height =
                            height;


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


                        context.fillStyle =
                            "#ffffff";


                        context.fillRect(
                            0,
                            0,
                            width,
                            height
                        );


                        context.drawImage(
                            image,
                            0,
                            0,
                            width,
                            height
                        );


                        resolve(
                            canvas.toDataURL(
                                "image/jpeg",
                                0.95
                            )
                        );

                    };


                image.onerror =
                    () => {

                        reject(
                            new Error(
                                "تعذر تحميل الصورة."
                            )
                        );

                    };


                image.src =
                    event.target.result;

            };


        reader.onerror =
            () => {

                reject(
                    new Error(
                        "تعذر قراءة ملف الصورة."
                    )
                );

            };


        reader.readAsDataURL(
            file
        );

    }
);

}

/* =========================================================
HANDWRITING IMAGE SELECTION
========================================================= */

if (handwritingImageInput) {

handwritingImageInput.addEventListener(
    "change",
    () => {

        const file =
            handwritingImageInput.files &&
            handwritingImageInput.files.length
                ? handwritingImageInput.files[0]
                : null;


        if (!file) {

            handwritingOriginalImage =
                null;

            handwritingEnhancedImage =
                null;


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


        if (
            !file.type ||
            !file.type.startsWith(
                "image/"
            )
        ) {

            alert(
                "من فضلك اختر ملف صورة صالح."
            );


            handwritingImageInput.value =
                "";


            return;

        }


        const reader =
            new FileReader();


        reader.onload =
            event => {

                const imageData =
                    event.target.result;


                if (!imageData) {

                    alert(
                        "تعذر تحميل الصورة."
                    );

                    return;

                }


                handwritingOriginalImage =
                    imageData;


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


        reader.onerror =
            () => {

                alert(
                    "تعذر قراءة الصورة."
                );

            };


        reader.readAsDataURL(
            file
        );

    }
);

}

/* =========================================================
HANDWRITING PREVIEW
========================================================= */

function showHandwritingPreview(
imageData
) {

if (!handwritingPreview) {
    return;
}


handwritingPreview.innerHTML =
    "";


const image =
    document.createElement(
        "img"
    );


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

/* =========================================================
ENHANCE HANDWRITING
LOCAL IMAGE PROCESSING
========================================================= */

if (enhanceHandwriting) {

enhanceHandwriting.addEventListener(
    "click",
    async () => {

        if (!handwritingOriginalImage) {

            alert(
                "من فضلك اختر صورة أولاً."
            );

            return;

        }


        const originalText =
            setButtonLoading(
                enhanceHandwriting,
                "⏳ جاري تحسين الصورة..."
            );


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


            /*
             * مهم:
             * لا يتم تنزيل أي ملف هنا.
             * التحسين فقط يجهز الصورة للخطوة التالية.
             */

            if (handwritingPreview) {

                const successMessage =
                    document.createElement(
                        "p"
                    );


                successMessage.className =
                    "pdf-placeholder";


                successMessage.textContent =
                    "✅ تم تحسين الورقة بنجاح.";

                handwritingPreview.appendChild(
                    successMessage
                );

            }


        } catch (error) {

            console.error(
                "HANDWRITING ENHANCE ERROR:",
                error
            );


            handwritingEnhancedImage =
                null;


            showHandwritingPreview(
                handwritingOriginalImage
            );


            alert(
                "تعذر تحسين الصورة. سيتم استخدام الصورة الأصلية."
            );


        } finally {

            restoreButton(
                enhanceHandwriting,
                originalText
            );

        }

    }
);

}

/* =========================================================
HANDWRITING IMAGE ENHANCEMENT
LOCAL ONLY
========================================================= */

function enhanceHandwritingImage(
imageData
) {

return new Promise(
    (resolve, reject) => {

        if (!imageData) {

            reject(
                new Error(
                    "لا توجد صورة للتحسين."
                )
            );

            return;

        }


        const image =
            new Image();


        image.onload =
            () => {

                try {

                    const width =
                        image.naturalWidth ||
                        image.width;


                    const height =
                        image.naturalHeight ||
                        image.height;


                    if (
                        !width ||
                        !height
                    ) {

                        throw new Error(
                            "تعذر معرفة أبعاد الصورة."
                        );

                    }


                    const canvas =
                        document.createElement(
                            "canvas"
                        );


                    canvas.width =
                        width;


                    canvas.height =
                        height;


                    const context =
                        canvas.getContext(
                            "2d"
                        );


                    if (!context) {

                        throw new Error(
                            "تعذر إنشاء Canvas."
                        );

                    }


                    context.drawImage(
                        image,
                        0,
                        0,
                        width,
                        height
                    );


                    const pixels =
                        context.getImageData(
                            0,
                            0,
                            width,
                            height
                        );


                    const data =
                        pixels.data;


                    /*
                     * تحسين محلي:
                     * زيادة التباين
                     * وتحسين وضوح الورقة
                     */

                    const contrast =
                        1.25;


                    const factor =
                        (
                            259 *
                            (contrast + 255)
                        ) /
                        (
                            255 *
                            (259 - contrast)
                        );


                    for (
                        let i = 0;
                        i < data.length;
                        i += 4
                    ) {

                        data[i] =
                            clampColor(
                                factor *
                                (
                                    data[i] -
                                    128
                                ) +
                                128
                            );


                        data[i + 1] =
                            clampColor(
                                factor *
                                (
                                    data[i + 1] -
                                    128
                                ) +
                                128
                            );


                        data[i + 2] =
                            clampColor(
                                factor *
                                (
                                    data[i + 2] -
                                    128
                                ) +
                                128
                            );

                    }


                    context.putImageData(
                        pixels,
                        0,
                        0
                    );


                    const result =
                        canvas.toDataURL(
                            "image/jpeg",
                            0.95
                        );


                    if (!result) {

                        throw new Error(
                            "تعذر إنشاء الصورة المحسنة."
                        );

                    }


                    resolve(
                        result
                    );


                } catch (error) {

                    reject(
                        error
                    );

                }

            };


        image.onerror =
            () => {

                reject(
                    new Error(
                        "تعذر تحميل الصورة للتحسين."
                    )
                );

            };


        image.src =
            imageData;

    }
);

}

/* =========================================================
COLOR HELPER
========================================================= */

function clampColor(value) {

return Math.max(
    0,
    Math.min(
        255,
        value
    )
);

}

/* =========================================================
HANDWRITING → PDF
========================================================= */

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
            setButtonLoading(
                createHandwritingPdf,
                "⏳ جارٍ إنشاء PDF..."
            );


        try {

            if (!window.jspdf) {

                throw new Error(
                    "jsPDF غير متاح."
                );

            }


            const {
                jsPDF
            } =
                window.jspdf;


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


            if (
                !width ||
                !height
            ) {

                throw new Error(
                    "تعذر قراءة أبعاد الصورة."
                );

            }


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


            const margin =
                10;


            const availableWidth =
                pageWidth -
                margin * 2;


            const availableHeight =
                pageHeight -
                margin * 2;


            const ratio =
                width /
                height;


            let finalWidth =
                availableWidth;


            let finalHeight =
                finalWidth /
                ratio;


            if (
                finalHeight >
                availableHeight
            ) {

                finalHeight =
                    availableHeight;


                finalWidth =
                    finalHeight *
                    ratio;

            }


            const x =
                (
                    pageWidth -
                    finalWidth
                ) / 2;


            const y =
                (
                    pageHeight -
                    finalHeight
                ) / 2;


            pdf.addImage(
                imageData,
                "JPEG",
                x,
                y,
                finalWidth,
                finalHeight
            );


            /*
             * اسم فريد لكل ملف.
             * لا تضف هذا الجزء مرة أخرى في مكان آخر.
             */

            pdf.save(
                `WebBag-Handwriting-${createTimestamp()}.pdf`
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

            restoreButton(
                createHandwritingPdf,
                originalText
            );

        }

    }
);

}

/* =========================================================
LOAD HANDWRITING IMAGE
========================================================= */

function loadHandwritingImage(
imageData
) {

return new Promise(
    (resolve, reject) => {

        const image =
            new Image();


        image.onload =
            () => {

                resolve(
                    image
                );

            };


        image.onerror =
            () => {

                reject(
                    new Error(
                        "تعذر تحميل الصورة."
                    )
                );

            };


        image.src =
            imageData;

    }
);

}

/* =========================================================
GENERIC IMAGE HELPERS
========================================================= */

function readImageFile(
file
) {

return new Promise(
    (resolve, reject) => {

        const reader =
            new FileReader();


        reader.onload =
            () => {

                resolve(
                    reader.result
                );

            };


        reader.onerror =
            reject;


        reader.readAsDataURL(
            file
        );

    }
);

}

function loadPdfImage(
dataUrl
) {

return new Promise(
    (resolve, reject) => {

        const image =
            new Image();


        image.onload =
            () => {

                resolve(
                    image
                );

            };


        image.onerror =
            reject;


        image.src =
            dataUrl;

    }
);

}

function getImageFormat(
file
) {

const type =
    (
        file?.type ||
        ""
    ).toLowerCase();


if (type.includes("png")) {

    return "PNG";

}


if (type.includes("webp")) {

    return "WEBP";

}


return "JPEG";

}

/* =========================================================
INITIAL PDF TOOL STATE
========================================================= */

if (pdfStatus) {

pdfStatus.textContent =
    "✅ أداة PDF AI جاهزة.";

}

if (summarizePdf) {

summarizePdf.disabled =
    true;

}

if (copyPdfText) {

copyPdfText.disabled =
    true;

}

if (createImagesPdf) {

createImagesPdf.disabled =
    true;

}

if (enhanceHandwriting) {

enhanceHandwriting.disabled =
    true;

}

if (createHandwritingPdf) {

createHandwritingPdf.disabled =
    true;

}

/* =========================================================
END OF WebBag PDF AI
========================================================= */
