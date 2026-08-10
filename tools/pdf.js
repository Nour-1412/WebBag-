/* ==========================================
   WebBag PDF AI
   PDF Tool — Complete Version
   ========================================== */

"use strict";


/* ==========================================
   PDF FILE READER
========================================== */

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


let selectedPdfFile = null;

let extractedPdfText = "";

let pdfReaderPromise = null;


/* ==========================================
   UTILITIES
========================================== */

function getTimestamp() {

    return new Date()
        .toISOString()
        .replace(/[:.]/g, "-");

}


function setButtonLoading(
    button,
    text
) {

    if (!button) {
        return;
    }

    button.disabled = true;

    button.dataset.originalText =
        button.textContent;

    button.textContent = text;

}


function restoreButton(
    button
) {

    if (!button) {
        return;
    }

    button.disabled = false;

    if (button.dataset.originalText) {

        button.textContent =
            button.dataset.originalText;

        delete button.dataset.originalText;

    }

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


function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ==========================================
   PDF.JS LOADER
========================================== */

function loadPdfReader() {

    if (pdfReaderPromise) {

        return pdfReaderPromise;

    }


    pdfReaderPromise =
        new Promise(
            (resolve, reject) => {

                if (window.pdfjsLib) {

                    configurePdfJs();

                    resolve(
                        window.pdfjsLib
                    );

                    return;

                }


                const script =
                    document.createElement(
                        "script"
                    );


                script.src =
                    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";


                script.async = true;


                script.onload = () => {

                    if (!window.pdfjsLib) {

                        reject(
                            new Error(
                                "PDF.js غير متاح."
                            )
                        );

                        return;

                    }


                    configurePdfJs();


                    resolve(
                        window.pdfjsLib
                    );

                };


                script.onerror = () => {

                    reject(
                        new Error(
                            "تعذر تحميل PDF.js."
                        )
                    );

                };


                document.head.appendChild(
                    script
                );

            }
        );


    return pdfReaderPromise;

}


function configurePdfJs() {

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


/* ==========================================
   READ PDF FILE
========================================== */

async function readPdfFile(file) {

    if (!isValidPdf(file)) {

        throw new Error(
            "الملف المختار ليس ملف PDF صالحًا."
        );

    }


    await loadPdfReader();


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
                .map(item => item.str)
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
                    أو لا يحتوي على نص قابل للقراءة مباشرة.
                </p>
            `;

        }


        if (summarizePdf) {
            summarizePdf.disabled = true;
        }


        if (copyPdfText) {
            copyPdfText.disabled = true;
        }


        return;

    }


    if (pdfStatus) {

        pdfStatus.textContent =
            `✅ تم استخراج النص من ${pdf.numPages} صفحة.`;

    }


    if (pdfText) {

        pdfText.textContent =
            extractedPdfText;

    }


    if (copyPdfText) {

        copyPdfText.disabled =
            false;

    }


    if (summarizePdf) {

        summarizePdf.disabled =
            false;

    }

}


/* ==========================================
   PDF FILE INPUT
========================================== */

if (pdfFileInput) {

    pdfFileInput.addEventListener(
        "change",
        async () => {

            const file =
                pdfFileInput.files &&
                pdfFileInput.files.length
                    ? pdfFileInput.files[0]
                    : null;


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


            selectedPdfFile =
                file;


            extractedPdfText =
                "";


            if (pdfFileName) {

                pdfFileName.textContent =
                    `📄 ${file.name}`;

            }


            if (pdfStatus) {

                pdfStatus.textContent =
                    "⏳ جارٍ تجهيز ملف PDF...";

            }


            if (pdfText) {

                pdfText.innerHTML = `
                    <p class="pdf-placeholder">
                        جارٍ قراءة الملف...
                    </p>
                `;

            }


            if (pdfSummary) {

                pdfSummary.innerHTML = `
                    <p class="pdf-placeholder">
                        سيتم إنشاء الملخص بعد قراءة الملف.
                    </p>
                `;

            }


            if (summarizePdf) {

                summarizePdf.disabled =
                    true;

            }


            if (copyPdfText) {

                copyPdfText.disabled =
                    true;

            }


            try {

                await readPdfFile(
                    file
                );

            } catch (error) {

                console.error(
                    "PDF READ ERROR:",
                    error
                );


                showPdfError(
                    "حدث خطأ أثناء قراءة ملف PDF."
                );

            }

        }
    );

}


/* ==========================================
   COPY PDF TEXT
========================================== */

if (copyPdfText) {

    copyPdfText.addEventListener(
        "click",
        async () => {

            if (!extractedPdfText) {

                return;

            }


            const originalText =
                copyPdfText.textContent;


            copyPdfText.disabled =
                true;


            copyPdfText.textContent =
                "⏳ جارٍ النسخ...";


            try {

                if (
                    navigator.clipboard &&
                    navigator.clipboard.writeText
                ) {

                    await navigator.clipboard.writeText(
                        extractedPdfText
                    );

                } else {

                    const textarea =
                        document.createElement(
                            "textarea"
                        );


                    textarea.value =
                        extractedPdfText;


                    textarea.style.position =
                        "fixed";

                    textarea.style.opacity =
                        "0";


                    document.body.appendChild(
                        textarea
                    );


                    textarea.select();


                    document.execCommand(
                        "copy"
                    );


                    textarea.remove();

                }


                copyPdfText.textContent =
                    "✅ تم نسخ النص";


                setTimeout(
                    () => {

                        copyPdfText.textContent =
                            originalText;

                        copyPdfText.disabled =
                            false;

                    },
                    1800
                );


            } catch (error) {

                console.error(
                    "COPY PDF TEXT ERROR:",
                    error
                );


                copyPdfText.textContent =
                    "❌ تعذر النسخ";


                setTimeout(
                    () => {

                        copyPdfText.textContent =
                            originalText;

                        copyPdfText.disabled =
                            false;

                    },
                    1800
                );

            }

        }
    );

}


/* ==========================================
   LOCAL PDF SUMMARY
========================================== */

function createLocalSummary(
    text
) {

    if (!text) {

        return "";

    }


    const cleaned =
        text
            .replace(/--- الصفحة \d+ ---/gi, " ")
            .replace(/\s+/g, " ")
            .trim();


    if (!cleaned) {

        return "";

    }


    const sentences =
        cleaned
            .split(
                /(?<=[.!؟?。])\s+/
            )
            .map(
                sentence =>
                    sentence.trim()
            )
            .filter(
                sentence =>
                    sentence.length > 20
            );


    if (!sentences.length) {

        return cleaned
            .split(/\s+/)
            .slice(0, 120)
            .join(" ");

    }


    const maxSentences =
        Math.min(
            8,
            sentences.length
        );


    return sentences
        .slice(
            0,
            maxSentences
        )
        .join(" ");

}


/* ==========================================
   SUMMARIZE PDF
========================================== */

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
                "⏳ جارٍ إنشاء الملخص...";


            try {

                const summary =
                    createLocalSummary(
                        extractedPdfText
                    );


                if (!summary) {

                    throw new Error(
                        "تعذر إنشاء الملخص."
                    );

                }


                pdfSummary.innerHTML = `
                    <div class="pdf-local-summary">
                        <p>
                            ${escapeHtml(summary)}
                        </p>
                    </div>
                `;


                summarizePdf.textContent =
                    "✅ تم إنشاء الملخص";


                setTimeout(
                    () => {

                        summarizePdf.textContent =
                            originalText;

                        summarizePdf.disabled =
                            false;

                    },
                    1800
                );


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


                summarizePdf.textContent =
                    originalText;


                summarizePdf.disabled =
                    false;

            }

        }
    );

}


/* ==========================================
   CLEAR PDF
========================================== */

if (clearPdf) {

    clearPdf.addEventListener(
        "click",
        () => {

            resetPdfInterface();

        }
    );

}


/* ==========================================
   RESET PDF INTERFACE
========================================== */

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

        summarizePdf.disabled =
            true;

    }


    if (copyPdfText) {

        copyPdfText.disabled =
            true;

    }

}


/* ==========================================
   SHOW PDF ERROR
========================================== */

function showPdfError(
    message
) {

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


/* ==========================================
   TEXT → PDF
========================================== */

const textToPdfInput =
    document.getElementById(
        "textToPdfInput"
    );


const createTextPdf =
    document.getElementById(
        "createTextPdf"
    );


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
                createTextPdf.textContent;


            setButtonLoading(
                createTextPdf,
                "⏳ جارٍ إنشاء PDF..."
            );


            let container =
                null;


            try {

                if (
                    !window.jspdf ||
                    !window.jspdf.jsPDF
                ) {

                    throw new Error(
                        "jsPDF غير محمل."
                    );

                }


                if (
                    typeof window.html2canvas !==
                    "function"
                ) {

                    throw new Error(
                        "html2canvas غير محمل."
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
                    await window.html2canvas(
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
                        orientation:
                            "p",
                        unit:
                            "mm",
                        format:
                            "a4"
                    });


                const pageWidth =
                    pdf.internal.pageSize
                        .getWidth();


                const pageHeight =
                    pdf.internal.pageSize
                        .getHeight();


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


                let imageWidth =
                    usableWidth;


                let imageHeight =
                    imageWidth /
                    imageRatio;


                if (
                    imageHeight <=
                    usableHeight
                ) {

                    const y =
                        (
                            pageHeight -
                            imageHeight
                        ) / 2;


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


                        if (
                            pageNumber > 0
                        ) {

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


                pdf.save(
                    `WebBag-Text-${getTimestamp()}.pdf`
                );


            } catch (error) {

                console.error(
                    "TEXT PDF ERROR:",
                    error
                );


                alert(
                    "حدث خطأ أثناء إنشاء ملف PDF من النص."
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

        }
    );

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


let selectedImages =
    [];


/* ==========================================
   SELECT IMAGES
========================================== */

if (imagesToPdfInput) {

    imagesToPdfInput.addEventListener(
        "change",
        () => {

            selectedImages =
                Array.from(
                    imagesToPdfInput.files ||
                    []
                )
                .filter(
                    file =>
                        file.type.startsWith(
                            "image/"
                        )
                );


            if (
                !selectedImages.length
            ) {

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
                                    event.target
                                        .result;

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


/* ==========================================
   CREATE IMAGES PDF
========================================== */

if (createImagesPdf) {

    createImagesPdf.addEventListener(
        "click",
        async () => {

            if (
                !selectedImages.length
            ) {

                alert(
                    "من فضلك اختر صورة واحدة على الأقل."
                );

                return;

            }


            const originalText =
                createImagesPdf.textContent;


            setButtonLoading(
                createImagesPdf,
                "⏳ جارٍ إنشاء PDF..."
            );


            try {

                if (
                    !window.jspdf ||
                    !window.jspdf.jsPDF
                ) {

                    throw new Error(
                        "jsPDF غير محمل."
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
                        imageWidth >=
                        imageHeight
                            ? "landscape"
                            : "portrait";


                    if (!pdf) {

                        pdf =
                            new jsPDF({
                                orientation,
                                unit:
                                    "mm",
                                format:
                                    "a4"
                            });

                    } else {

                        pdf.addPage(
                            "a4",
                            orientation
                        );

                    }


                    const pageWidth =
                        pdf.internal.pageSize
                            .getWidth();


                    const pageHeight =
                        pdf.internal.pageSize
                            .getHeight();


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

                }


                if (pdf) {

                    pdf.save(
                        `WebBag-Images-${getTimestamp()}.pdf`
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
                    selectedImages.length ===
                    0;


                createImagesPdf.textContent =
                    originalText;

            }

        }
    );

}


/* ==========================================
   CONVERT IMAGE TO JPEG
========================================== */

function convertImageToJpeg(
    file
) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                event => {

                    const image =
                        new Image();


                    image.onload =
                        () => {

                            try {

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


/* ==========================================
   LOAD IMAGE
========================================== */

function loadImage(
    dataUrl
) {

    return new Promise(
        (resolve, reject) => {

            const image =
                new Image();


            image.onload =
                () => {

                    resolve(image);

                };


            image.onerror =
                () => {

                    reject(
                        new Error(
                            "تعذر تحميل بيانات الصورة."
                        )
                    );

                };


            image.src =
                dataUrl;

        }
    );

}


/* ==========================================
   HANDWRITING IMAGE → PDF
========================================== */

const handwritingImageInput =
    document.getElementById(
        "handwritingImageInput"
    );


const handwritingPreview =
    document.getElementById(
        "handwritingPreview"
    );


const enhanceHandwriting =
    document.getElementById(
        "enhanceHandwriting"
    );


const createHandwritingPdf =
    document.getElementById(
        "createHandwritingPdf"
    );


let handwritingOriginalImage =
    null;


let handwritingEnhancedImage =
    null;


/* ==========================================
   SELECT HANDWRITING IMAGE
========================================== */

if (handwritingImageInput) {

    handwritingImageInput.addEventListener(
        "change",
        event => {

            const file =
                event.target.files &&
                event.target.files.length
                    ? event.target.files[0]
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

                    enhanceHandwriting.disabled =
                        true;

                }


                if (createHandwritingPdf) {

                    createHandwritingPdf.disabled =
                        true;

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


                event.target.value =
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


/* ==========================================
   SHOW HANDWRITING PREVIEW
========================================== */

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


/* ==========================================
   ENHANCE HANDWRITING
========================================== */

if (enhanceHandwriting) {

    enhanceHandwriting.addEventListener(
        "click",
        async () => {

            if (
                !handwritingOriginalImage
            ) {

                alert(
                    "من فضلك اختر صورة أولاً."
                );

                return;

            }


            const originalText =
                enhanceHandwriting.textContent;


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


                enhanceHandwriting.textContent =
                    "✅ تم تحسين الورقة";


                setTimeout(
                    () => {

                        enhanceHandwriting.textContent =
                            originalText;

                        enhanceHandwriting.disabled =
                            false;

                    },
                    1800
                );


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


                enhanceHandwriting.textContent =
                    originalText;


                enhanceHandwriting.disabled =
                    false;

            }

        }
    );

}


/* ==========================================
   LOCAL HANDWRITING ENHANCEMENT
========================================== */

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


                        const imageDataObject =
                            context.getImageData(
                                0,
                                0,
                                width,
                                height
                            );


                        const data =
                            imageDataObject.data;


                        /*
                         * تحسين محلي:
                         * رفع التباين مع الحفاظ
                         * على طبيعة الصورة.
                         */

                        const contrast =
                            1.25;


                        const factor =
                            (
                                259 *
                                (
                                    contrast +
                                    255
                                )
                            ) /
                            (
                                255 *
                                (
                                    259 -
                                    contrast
                                )
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
                            imageDataObject,
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


/* ==========================================
   COLOR HELPER
========================================== */

function clampColor(
    value
) {

    return Math.max(
        0,
        Math.min(
            255,
            value
        )
    );

}


/* ==========================================
   CREATE HANDWRITING PDF
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


            setButtonLoading(
                createHandwritingPdf,
                "⏳ جارٍ إنشاء PDF..."
            );


            try {

                if (
                    !window.jspdf ||
                    !window.jspdf.jsPDF
                ) {

                    throw new Error(
                        "jsPDF غير محمل."
                    );

                }


                const {
                    jsPDF
                } =
                    window.jspdf;


                const image =
                    await loadImage(
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
                        unit:
                            "mm",
                        format:
                            "a4"
                    });


                const pageWidth =
                    pdf.internal.pageSize
                        .getWidth();


                const pageHeight =
                    pdf.internal.pageSize
                        .getHeight();


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
                 * اسم مختلف في كل مرة
                 * لمنع مشكلة تنزيل الملف مرة أخرى.
                 */

                pdf.save(
                    `WebBag-Handwriting-${getTimestamp()}.pdf`
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
   GENERIC IMAGE READER
========================================== */

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
                error => {

                    reject(
                        error
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


/* ==========================================
   PDF IMAGE LOADER
========================================== */

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
                error => {

                    reject(
                        error
                    );

                };


            image.src =
                dataUrl;

        }
    );

}


/* ==========================================
   IMAGE FORMAT
========================================== */

function getImageFormat(
    file
) {

    if (!file) {

        return "JPEG";

    }


    const type =
        (
            file.type ||
            ""
        ).toLowerCase();


    if (
        type.includes("png")
    ) {

        return "PNG";

    }


    if (
        type.includes("webp")
    ) {

        return "WEBP";

    }


    return "JPEG";

}


/* ==========================================
   INITIAL STATE
========================================== */

resetPdfInterface();


if (pdfStatus) {

    pdfStatus.textContent =
        "✅ أداة PDF AI جاهزة.";

}


/* ==========================================
   END OF PDF.JS
========================================== */
