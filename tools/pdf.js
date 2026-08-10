/* ==========================================
   WebBag PDF AI
   pdf.js
   Complete PDF Tool
   Arabic OCR + Handwriting → Digital PDF
   ========================================== */

"use strict";


/* ==========================================
   GLOBAL STATE
========================================== */

let selectedPdfFile = null;
let extractedPdfText = "";

let selectedImages = [];

let handwritingOriginalImage = null;
let handwritingEnhancedImage = null;

let handwritingImageObject = null;

let handwritingOcrText = "";

let handwritingOcrReady = false;
let handwritingOcrRunning = false;

let tesseractPromise = null;


/* ==========================================
   DOM HELPERS
========================================== */

function $(id) {
    return document.getElementById(id);
}


/* ==========================================
   PDF AI ELEMENTS
========================================== */

const pdfFileInput = $("pdfFile");
const pdfFileName = $("pdfFileName");
const pdfStatus = $("pdfStatus");
const pdfText = $("pdfText");

const pdfSummary = $("pdfSummary");
const summarizePdf = $("summarizePdf");
const copyPdfText = $("copyPdfText");
const clearPdf = $("clearPdf");


/* ==========================================
   TEXT → PDF
========================================== */

const textToPdfInput = $("textToPdfInput");
const createTextPdf = $("createTextPdf");


/* ==========================================
   IMAGES → PDF
========================================== */

const imagesToPdfInput = $("imagesToPdfInput");
const imagesPreview = $("imagesPreview");
const createImagesPdf = $("createImagesPdf");


/* ==========================================
   HANDWRITING → PDF
========================================== */

const handwritingImageInput =
    $("handwritingImageInput");

const handwritingPreview =
    $("handwritingPreview");

const enhanceHandwriting =
    $("enhanceHandwriting");

const createHandwritingPdf =
    $("createHandwritingPdf");


/* ==========================================
   PDF.JS LOADER
========================================== */

let pdfReaderPromise = null;

function loadPdfReader() {

    if (pdfReaderPromise) {
        return pdfReaderPromise;
    }

    pdfReaderPromise = new Promise(
        (resolve, reject) => {

            if (window.pdfjsLib) {

                configurePdfReader();

                resolve(window.pdfjsLib);

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
                            "PDF.js loaded but unavailable."
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
        }
    );

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


/* ==========================================
   TESSERACT.JS LOADER
========================================== */

function loadTesseract() {

    if (tesseractPromise) {
        return tesseractPromise;
    }

    tesseractPromise = new Promise(
        (resolve, reject) => {

            if (
                window.Tesseract &&
                typeof window.Tesseract.createWorker ===
                    "function"
            ) {

                resolve(
                    window.Tesseract
                );

                return;
            }

            const script =
                document.createElement(
                    "script"
                );

            script.src =
                "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";

            script.async = true;

            script.onload = () => {

                if (
                    !window.Tesseract ||
                    typeof window.Tesseract.createWorker !==
                        "function"
                ) {

                    reject(
                        new Error(
                            "Tesseract.js loaded but unavailable."
                        )
                    );

                    return;
                }

                resolve(
                    window.Tesseract
                );
            };

            script.onerror = () => {

                reject(
                    new Error(
                        "Unable to load Tesseract.js."
                    )
                );
            };

            document.head.appendChild(
                script
            );
        }
    );

    return tesseractPromise;
}


/* ==========================================
   PDF VALIDATION
========================================== */

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


/* ==========================================
   IMAGE VALIDATION
========================================== */

function isValidImage(file) {

    if (!file) {
        return false;
    }

    return (
        file.type &&
        file.type.startsWith("image/")
    );
}


/* ==========================================
   UNIQUE FILE NAME
========================================== */

function createUniqueFileName(
    prefix,
    extension = "pdf"
) {

    const now =
        new Date();

    const timestamp =
        now.toISOString()
            .replace(
                /[:.]/g,
                "-"
            );

    const random =
        Math.random()
            .toString(36)
            .slice(2, 8);

    return (
        `${prefix}-${timestamp}-${random}.${extension}`
    );
}


/* ==========================================
   BUTTON PROCESSING STATE
========================================== */

function setButtonLoading(
    button,
    loadingText
) {

    if (!button) {
        return null;
    }

    const originalText =
        button.textContent;

    button.disabled = true;

    button.dataset.originalText =
        originalText;

    button.textContent =
        loadingText;

    return originalText;
}


function restoreButton(
    button,
    originalText
) {

    if (!button) {
        return;
    }

    button.disabled = false;

    if (
        typeof originalText === "string"
    ) {

        button.textContent =
            originalText;

    } else if (
        button.dataset.originalText
    ) {

        button.textContent =
            button.dataset.originalText;
    }
}


/* ==========================================
   STATUS HELPERS
========================================== */

function setPdfStatus(message) {

    if (pdfStatus) {
        pdfStatus.textContent =
            message;
    }
}


function showPdfError(message) {

    setPdfStatus(
        `❌ ${message}`
    );

    if (pdfText) {

        pdfText.innerHTML = `
            <p class="pdf-placeholder">
                ${escapeHtml(message)}
            </p>
        `;
    }
}


/* ==========================================
   ESCAPE HTML
========================================== */

function escapeHtml(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* ==========================================
   PDF FILE SELECTION
========================================== */

if (pdfFileInput) {

    pdfFileInput.addEventListener(
        "change",
        async () => {

            const file =
                pdfFileInput.files &&
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

            selectedPdfFile =
                file;

            extractedPdfText =
                "";

            if (pdfFileName) {

                pdfFileName.textContent =
                    `📄 ${file.name}`;
            }

            setPdfStatus(
                "⏳ جارٍ تجهيز ملف PDF..."
            );

            if (pdfText) {

                pdfText.innerHTML = `
                    <p class="pdf-placeholder">
                        ⏳ جارٍ قراءة الملف...
                    </p>
                `;
            }

            if (pdfSummary) {

                pdfSummary.innerHTML = `
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
   READ PDF
========================================== */

async function readPdfFile(file) {

    if (!isValidPdf(file)) {

        throw new Error(
            "Invalid PDF file."
        );
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

        setPdfStatus(
            `⏳ جارٍ قراءة الصفحة ${pageNumber} من ${pdf.numPages}...`
        );

        const page =
            await pdf.getPage(
                pageNumber
            );

        const content =
            await page.getTextContent();

        const pageText =
            content.items
                .map(
                    item =>
                        item.str || ""
                )
                .join(" ")
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();

        fullText +=
            `\n\n--- الصفحة ${pageNumber} ---\n\n`;

        fullText +=
            pageText;
    }

    extractedPdfText =
        fullText.trim();

    if (!extractedPdfText) {

        setPdfStatus(
            "⚠️ لم يتم العثور على نص قابل للاستخراج."
        );

        if (pdfText) {

            pdfText.innerHTML = `
                <p class="pdf-placeholder">
                    يبدو أن الملف عبارة عن صور ممسوحة ضوئيًا
                    أو لا يحتوي على نص قابل للقراءة مباشرة.
                </p>
            `;
        }

        return;
    }

    setPdfStatus(
        `✅ تم استخراج النص من ${pdf.numPages} صفحة.`
    );

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

    if (pdfSummary) {

        pdfSummary.innerHTML = `
            <p class="pdf-placeholder">
                اضغط على «تلخيص الملف» لإنشاء ملخص مبدئي.
            </p>
        `;
    }
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

                        if (copyPdfText) {

                            copyPdfText.textContent =
                                originalText;

                            copyPdfText.disabled =
                                false;
                        }

                    },
                    1800
                );

            } catch (error) {

                console.error(
                    "COPY PDF TEXT ERROR:",
                    error
                );

                setPdfStatus(
                    "❌ تعذر نسخ النص."
                );

                copyPdfText.textContent =
                    originalText;

                copyPdfText.disabled =
                    false;
            }
        }
    );
}


/* ==========================================
   LOCAL PDF SUMMARY
========================================== */

function createLocalPdfSummary(text) {

    if (!text) {
        return "";
    }

    const cleanText =
        text
            .replace(
                /--- الصفحة \d+ ---/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    if (!cleanText) {
        return "";
    }

    const sentences =
        cleanText
            .split(
                /(?<=[.!؟])/u
            )
            .map(
                sentence =>
                    sentence.trim()
            )
            .filter(Boolean);

    const maxSentences =
        8;

    const selected =
        sentences.slice(
            0,
            maxSentences
        );

    if (!selected.length) {

        return cleanText
            .slice(
                0,
                1800
            );
    }

    return selected.join(
        " "
    );
}


/* ==========================================
   PDF SUMMARY
========================================== */

if (summarizePdf) {

    summarizePdf.addEventListener(
        "click",
        async () => {

            if (!extractedPdfText) {
                return;
            }

            if (!pdfSummary) {
                return;
            }

            const originalText =
                setButtonLoading(
                    summarizePdf,
                    "⏳ جارٍ تلخيص الملف..."
                );

            try {

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            250
                        )
                );

                const summary =
                    createLocalPdfSummary(
                        extractedPdfText
                    );

                if (!summary) {

                    throw new Error(
                        "تعذر إنشاء الملخص."
                    );
                }

                pdfSummary.textContent =
                    summary;

                setPdfStatus(
                    "✅ تم إنشاء ملخص مبدئي للملف."
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

            } finally {

                restoreButton(
                    summarizePdf,
                    originalText
                );
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
   TEXT → PDF
========================================== */

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
                        "jsPDF is not loaded."
                    );
                }

                if (!window.html2canvas) {

                    throw new Error(
                        "html2canvas is not loaded."
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
                        orientation:
                            "portrait",
                        unit:
                            "mm",
                        format:
                            "a4"
                    });

                await addCanvasToPdf(
                    pdf,
                    canvas,
                    10
                );

                pdf.save(
                    createUniqueFileName(
                        "WebBag-Text"
                    )
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


/* ==========================================
   IMAGES → PDF
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
                    isValidImage
                );

            renderImagesPreview();

            if (createImagesPdf) {

                createImagesPdf.disabled =
                    selectedImages.length === 0;
            }
        }
    );
}


/* ==========================================
   RENDER IMAGES PREVIEW
========================================== */

function renderImagesPreview() {

    if (!imagesPreview) {
        return;
    }

    imagesPreview.innerHTML =
        "";

    if (!selectedImages.length) {

        imagesPreview.textContent =
            "لم يتم اختيار صور";

        return;
    }

    selectedImages.forEach(
        (file, index) => {

            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                "image-preview-wrapper";

            const image =
                document.createElement(
                    "img"
                );

            image.className =
                "image-preview-item";

            image.alt =
                file.name;

            image.title =
                `${index + 1}. ${file.name}`;

            const reader =
                new FileReader();

            reader.onload =
                event => {

                    image.src =
                        event.target.result;
                };

            reader.readAsDataURL(
                file
            );

            wrapper.appendChild(
                image
            );

            imagesPreview.appendChild(
                wrapper
            );
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
                        "jsPDF is not loaded."
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
                        finalHeight,
                        undefined,
                        "FAST"
                    );
                }

                if (pdf) {

                    pdf.save(
                        createUniqueFileName(
                            "WebBag-Images"
                        )
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
            }
        }
    );
}


/* ==========================================
   IMAGE → JPEG
========================================== */

function convertImageToJpeg(file) {

    return new Promise(
        (resolve, reject) => {

            if (!isValidImage(file)) {

                reject(
                    new Error(
                        "Invalid image file."
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
                                        "Invalid image dimensions."
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
                                        "Unable to create canvas."
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
                                    "Unable to load image."
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
                            "Unable to read image file."
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
   HANDWRITING IMAGE SELECTION
========================================== */

if (handwritingImageInput) {

    handwritingImageInput.addEventListener(
        "change",
        () => {

            const file =
                handwritingImageInput.files &&
                handwritingImageInput.files[0];

            handwritingOriginalImage =
                null;

            handwritingEnhancedImage =
                null;

            handwritingImageObject =
                null;

            handwritingOcrText =
                "";

            handwritingOcrReady =
                false;

            if (!file) {

                resetHandwritingInterface();

                return;
            }

            if (!isValidImage(file)) {

                alert(
                    "من فضلك اختر ملف صورة صالح."
                );

                handwritingImageInput.value =
                    "";

                resetHandwritingInterface();

                return;
            }

            readImageFile(
                file
            )
            .then(
                imageData => {

                    handwritingOriginalImage =
                        imageData;

                    handwritingEnhancedImage =
                        null;

                    showHandwritingPreview(
                        handwritingOriginalImage
                    );

                    ensureHandwritingOcrInterface();

                    if (enhanceHandwriting) {

                        enhanceHandwriting.disabled =
                            false;
                    }

                    if (createHandwritingPdf) {

                        createHandwritingPdf.disabled =
                            false;
                    }
                }
            )
            .catch(
                error => {

                    console.error(
                        "HANDWRITING READ ERROR:",
                        error
                    );

                    alert(
                        "تعذر قراءة الصورة."
                    );

                    resetHandwritingInterface();
                }
            );
        }
    );
}


/* ==========================================
   HANDWRITING PREVIEW
========================================== */

function showHandwritingPreview(
    imageData
) {

    if (!handwritingPreview) {
        return;
    }

    const existingOcr =
        handwritingPreview.querySelector(
            ".webbag-ocr-area"
        );

    handwritingPreview.innerHTML =
        "";

    if (!imageData) {

        handwritingPreview.textContent =
            "لم يتم اختيار صورة";

        return;
    }

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

    image.style.objectFit =
        "contain";

    handwritingPreview.appendChild(
        image
    );

    if (existingOcr) {

        handwritingPreview.appendChild(
            existingOcr
        );
    }
}


/* ==========================================
   HANDWRITING OCR UI
   Created automatically.
========================================== */

let handwritingOcrArea = null;
let handwritingOcrTextarea = null;
let handwritingOcrStatus = null;
let handwritingOcrButton = null;
let handwritingOcrPdfButton = null;
let handwritingRestoreButton = null;


function ensureHandwritingOcrInterface() {

    if (!handwritingPreview) {
        return;
    }

    if (handwritingOcrArea) {
        return;
    }

    handwritingOcrArea =
        document.createElement(
            "div"
        );

    handwritingOcrArea.className =
        "webbag-ocr-area";

    handwritingOcrArea.style.marginTop =
        "20px";

    handwritingOcrArea.style.padding =
        "18px";

    handwritingOcrArea.style.borderRadius =
        "18px";

    handwritingOcrArea.style.background =
        "rgba(255,255,255,0.08)";

    handwritingOcrArea.style.border =
        "1px solid rgba(255,255,255,0.15)";

    handwritingOcrArea.dir =
        "rtl";


    const title =
        document.createElement(
            "h3"
        );

    title.textContent =
        "📝 النص الرقمي المستخرج";

    title.style.margin =
        "0 0 10px";


    handwritingOcrStatus =
        document.createElement(
            "div"
        );

    handwritingOcrStatus.textContent =
        "لم يتم تشغيل OCR بعد.";

    handwritingOcrStatus.style.marginBottom =
        "10px";


    handwritingOcrTextarea =
        document.createElement(
            "textarea"
        );

    handwritingOcrTextarea.dir =
        "rtl";

    handwritingOcrTextarea.lang =
        "ar";

    handwritingOcrTextarea.placeholder =
        "سيظهر هنا النص المستخرج من الخط اليدوي، ويمكنك تصحيحه قبل إنشاء PDF...";

    handwritingOcrTextarea.style.width =
        "100%";

    handwritingOcrTextarea.style.minHeight =
        "220px";

    handwritingOcrTextarea.style.boxSizing =
        "border-box";

    handwritingOcrTextarea.style.padding =
        "14px";

    handwritingOcrTextarea.style.borderRadius =
        "14px";

    handwritingOcrTextarea.style.border =
        "1px solid rgba(255,255,255,0.2)";

    handwritingOcrTextarea.style.background =
        "rgba(0,0,0,0.15)";

    handwritingOcrTextarea.style.color =
        "inherit";

    handwritingOcrTextarea.style.fontFamily =
        "Cairo, Arial, sans-serif";

    handwritingOcrTextarea.style.fontSize =
        "18px";

    handwritingOcrTextarea.style.lineHeight =
        "1.9";

    handwritingOcrTextarea.style.resize =
        "vertical";


    handwritingOcrButton =
        document.createElement(
            "button"
        );

    handwritingOcrButton.type =
        "button";

    handwritingOcrButton.className =
        "send-btn";

    handwritingOcrButton.textContent =
        "🔎 استخراج النص العربي";


    handwritingRestoreButton =
        document.createElement(
            "button"
        );

    handwritingRestoreButton.type =
        "button";

    handwritingRestoreButton.className =
        "send-btn";

    handwritingRestoreButton.textContent =
        "↩️ استخدام الصورة الأصلية";


    handwritingOcrPdfButton =
        document.createElement(
            "button"
        );

    handwritingOcrPdfButton.type =
        "button";

    handwritingOcrPdfButton.className =
        "send-btn";

    handwritingOcrPdfButton.textContent =
        "📄 إنشاء PDF من النص الرقمي";

    handwritingOcrPdfButton.disabled =
        true;


    const actions =
        document.createElement(
            "div"
        );

    actions.style.display =
        "flex";

    actions.style.flexWrap =
        "wrap";

    actions.style.gap =
        "10px";

    actions.style.marginTop =
        "12px";


    actions.appendChild(
        handwritingOcrButton
    );

    actions.appendChild(
        handwritingRestoreButton
    );

    actions.appendChild(
        handwritingOcrPdfButton
    );


    handwritingOcrArea.appendChild(
        title
    );

    handwritingOcrArea.appendChild(
        handwritingOcrStatus
    );

    handwritingOcrArea.appendChild(
        handwritingOcrTextarea
    );

    handwritingOcrArea.appendChild(
        actions
    );

    handwritingPreview.appendChild(
        handwritingOcrArea
    );


    handwritingOcrButton.addEventListener(
        "click",
        runHandwritingOCR
    );


    handwritingOcrPdfButton.addEventListener(
        "click",
        createHandwritingTextPdf
    );


    handwritingRestoreButton.addEventListener(
        "click",
        () => {

            restoreOriginalHandwriting();

            if (
                handwritingOcrStatus
            ) {

                handwritingOcrStatus.textContent =
                    "↩️ تم إرجاع الصورة الأصلية.";
            }
        }
    );


    handwritingOcrTextarea.addEventListener(
        "input",
        () => {

            handwritingOcrText =
                handwritingOcrTextarea.value;

            handwritingOcrReady =
                Boolean(
                    handwritingOcrText.trim()
                );

            if (
                handwritingOcrPdfButton
            ) {

                handwritingOcrPdfButton.disabled =
                    !handwritingOcrReady;
            }
        }
    );
}


/* ==========================================
   HANDWRITING OCR IMAGE PREPROCESSOR
========================================== */

async function prepareImageForOCR(
    imageData
) {

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
            "Invalid OCR image dimensions."
        );
    }

    /*
     * OCR يستفيد غالبًا من صورة أكبر.
     * نرفع الدقة إلى حد معقول دون
     * استهلاك ذاكرة مبالغ فيها.
     */

    const maxDimension =
        2600;

    const scale =
        Math.min(
            1.7,
            maxDimension /
                Math.max(
                    width,
                    height
                )
        );

    const targetWidth =
        Math.max(
            1,
            Math.round(
                width *
                scale
            )
        );

    const targetHeight =
        Math.max(
            1,
            Math.round(
                height *
                scale
            )
        );

    const canvas =
        document.createElement(
            "canvas"
        );

    canvas.width =
        targetWidth;

    canvas.height =
        targetHeight;

    const context =
        canvas.getContext(
            "2d",
            {
                willReadFrequently:
                    true
            }
        );

    if (!context) {

        throw new Error(
            "Unable to create OCR canvas."
        );
    }

    context.fillStyle =
        "#ffffff";

    context.fillRect(
        0,
        0,
        targetWidth,
        targetHeight
    );

    context.drawImage(
        image,
        0,
        0,
        targetWidth,
        targetHeight
    );

    /*
     * معالجة إضافية خفيفة للـOCR.
     * لا نستخدم threshold قاسي جدًا حتى
     * لا تختفي أجزاء الخط العربي.
     */

    const pixels =
        context.getImageData(
            0,
            0,
            targetWidth,
            targetHeight
        );

    const data =
        pixels.data;

    for (
        let i = 0;
        i < data.length;
        i += 4
    ) {

        let r =
            data[i];

        let g =
            data[i + 1];

        let b =
            data[i + 2];

        const gray =
            (
                0.299 * r +
                0.587 * g +
                0.114 * b
            );

        /*
         * تقليل الاصفرار والخلفية
         */

        const minChannel =
            Math.min(
                r,
                g,
                b
            );

        const maxChannel =
            Math.max(
                r,
                g,
                b
            );

        const saturation =
            maxChannel -
            minChannel;

        let value =
            gray;

        if (
            gray > 165 &&
            saturation < 75
        ) {

            value =
                255;
        }

        /*
         * رفع التباين بشكل خفيف.
         */

        value =
            (
                value -
                128
            ) *
            1.12 +
            128;

        value =
            clampColor(
                value
            );

        data[i] =
            value;

        data[i + 1] =
            value;

        data[i + 2] =
            value;
    }

    context.putImageData(
        pixels,
        0,
        0
    );

    return canvas.toDataURL(
        "image/png"
    );
}


/* ==========================================
   OCR TEXT CLEANING
========================================== */

function cleanArabicOcrText(
    text
) {

    if (!text) {
        return "";
    }

    let result =
        String(text)
            .replace(
                /\r/g,
                ""
            )
            .replace(
                /[ \t]+/g,
                " "
            )
            .replace(
                /\n{3,}/g,
                "\n\n"
            )
            .trim();

    /*
     * إزالة مسافات غير مرغوبة قبل علامات الترقيم.
     */

    result =
        result.replace(
            /\s+([،؛:!?؟])/g,
            "$1"
        );

    /*
     * توحيد بعض أشكال الأرقام العربية.
     */

    result =
        result.replace(
            /٠/g,
            "0"
        )
        .replace(
            /١/g,
            "1"
        )
        .replace(
            /٢/g,
            "2"
        )
        .replace(
            /٣/g,
            "3"
        )
        .replace(
            /٤/g,
            "4"
        )
        .replace(
            /٥/g,
            "5"
        )
        .replace(
            /٦/g,
            "6"
        )
        .replace(
            /٧/g,
            "7"
        )
        .replace(
            /٨/g,
            "8"
        )
        .replace(
            /٩/g,
            "9"
        );

    return result;
}


/* ==========================================
   RUN ARABIC OCR
========================================== */

async function runHandwritingOCR() {

    if (handwritingOcrRunning) {
        return;
    }

    const sourceImage =
        handwritingEnhancedImage ||
        handwritingOriginalImage;

    if (!sourceImage) {

        alert(
            "من فضلك اختر صورة أولاً."
        );

        return;
    }

    ensureHandwritingOcrInterface();

    if (!handwritingOcrButton) {
        return;
    }

    handwritingOcrRunning =
        true;

    const originalText =
        setButtonLoading(
            handwritingOcrButton,
            "⏳ جارٍ التعرف على الخط..."
        );

    if (handwritingOcrStatus) {

        handwritingOcrStatus.textContent =
            "⏳ جارٍ تحميل محرك OCR العربي...";
    }

    if (handwritingOcrPdfButton) {

        handwritingOcrPdfButton.disabled =
            true;
    }

    try {

        const Tesseract =
            await loadTesseract();

        if (handwritingOcrStatus) {

            handwritingOcrStatus.textContent =
                "⏳ جارٍ تجهيز الصورة للقراءة...";
        }

        const ocrImage =
            await prepareImageForOCR(
                sourceImage
            );

        if (handwritingOcrStatus) {

            handwritingOcrStatus.textContent =
                "⏳ جارٍ قراءة النص العربي...";
        }

        /*
         * worker باللغة العربية.
         *
         * langPath يحتوي ملفات اللغات
         * الرسمية لـTesseract.
         */

        const worker =
            await Tesseract.createWorker(
                "ara",
                1,
                {
                    langPath:
                        "https://tessdata.projectnaptha.com/4.0.0",
                    logger:
                        message => {

                            if (
                                !handwritingOcrStatus ||
                                !message
                            ) {
                                return;
                            }

                            if (
                                message.status
                            ) {

                                const progress =
                                    typeof message.progress ===
                                        "number"
                                        ? Math.round(
                                            message.progress *
                                            100
                                        )
                                        : null;

                                if (
                                    progress !== null
                                ) {

                                    handwritingOcrStatus.textContent =
                                        `⏳ ${message.status} — ${progress}%`;

                                } else {

                                    handwritingOcrStatus.textContent =
                                        `⏳ ${message.status}`;
                                }
                            }
                        }
                }
            );

        try {

            /*
             * PSM 6 مناسب نسبيًا لصفحة نصية.
             */

            await worker.setParameters({
                tessedit_pageseg_mode:
                    "6",
                preserve_interword_spaces:
                    "1"
            });

            const result =
                await worker.recognize(
                    ocrImage
                );

            let text =
                "";

            if (
                result &&
                result.data
            ) {

                text =
                    result.data.text ||
                    "";
            }

            text =
                cleanArabicOcrText(
                    text
                );

            handwritingOcrText =
                text;

            handwritingOcrReady =
                Boolean(
                    text.trim()
                );

            if (handwritingOcrTextarea) {

                handwritingOcrTextarea.value =
                    text;
            }

            if (!text) {

                if (handwritingOcrStatus) {

                    handwritingOcrStatus.textContent =
                        "⚠️ لم يتمكن OCR من استخراج نص واضح. جرّب صورة أوضح أو اضغط تحسين الورقة أولًا.";
                }

                handwritingOcrReady =
                    false;

                return;
            }

            if (handwritingOcrStatus) {

                handwritingOcrStatus.textContent =
                    "✅ تم استخراج النص العربي. يمكنك مراجعته وتعديله قبل إنشاء PDF.";
            }

            if (handwritingOcrPdfButton) {

                handwritingOcrPdfButton.disabled =
                    false;
            }

        } finally {

            await worker.terminate();
        }

    } catch (error) {

        console.error(
            "ARABIC OCR ERROR:",
            error
        );

        handwritingOcrReady =
            false;

        if (handwritingOcrPdfButton) {

            handwritingOcrPdfButton.disabled =
                true;
        }

        if (handwritingOcrStatus) {

            handwritingOcrStatus.textContent =
                "❌ تعذر تشغيل OCR العربي. تحقق من اتصال الإنترنت ثم حاول مرة أخرى.";
        }

    } finally {

        handwritingOcrRunning =
            false;

        restoreButton(
            handwritingOcrButton,
            originalText
        );
    }
}


/* ==========================================
   HANDWRITING PREVIEW + OCR
========================================== */

function updateHandwritingOcrAfterEnhancement() {

    ensureHandwritingOcrInterface();

    handwritingOcrText =
        "";

    handwritingOcrReady =
        false;

    if (handwritingOcrTextarea) {

        handwritingOcrTextarea.value =
            "";
    }

    if (handwritingOcrPdfButton) {

        handwritingOcrPdfButton.disabled =
            true;
    }

    if (handwritingOcrStatus) {

        handwritingOcrStatus.textContent =
            "الصورة جاهزة. اضغط «استخراج النص العربي».";
    }
}


/* ==========================================
   HANDWRITING ENHANCEMENT SETTINGS
========================================== */

const handwritingSettings = {

    brightness: 0,

    contrast: 1.25,

    grayscale: false,

    removeYellow: true,

    denoise: true,

    sharpen: true,

    intensity: 1
};


/* ==========================================
   CLAMP
========================================== */

function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
}


/* ==========================================
   CLAMP COLOR
========================================== */

function clampColor(
    value
) {

    return clamp(
        value,
        0,
        255
    );
}


/* ==========================================
   ENHANCE HANDWRITING
========================================== */

function enhanceHandwritingImage(
    imageData
) {

    return new Promise(
        async (resolve, reject) => {

            try {

                if (!imageData) {

                    throw new Error(
                        "لا توجد صورة للتحسين."
                    );
                }

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
                        "2d",
                        {
                            willReadFrequently:
                                true
                        }
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

                const intensity =
                    clamp(
                        handwritingSettings.intensity,
                        0,
                        1
                    );

                const contrast =
                    1 +
                    (
                        (
                            handwritingSettings.contrast -
                            1
                        ) *
                        intensity
                    );

                const brightness =
                    handwritingSettings.brightness *
                    intensity;

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

                    let r =
                        data[i];

                    let g =
                        data[i + 1];

                    let b =
                        data[i + 2];

                    /*
                     * إزالة الاصفرار
                     */

                    if (
                        handwritingSettings.removeYellow
                    ) {

                        const yellow =
                            Math.max(
                                0,
                                (
                                    r +
                                    g
                                ) / 2 -
                                b
                            );

                        const yellowReduction =
                            yellow *
                            0.35 *
                            intensity;

                        r -=
                            yellowReduction;

                        g -=
                            yellowReduction;
                    }

                    /*
                     * Grayscale
                     */

                    if (
                        handwritingSettings.grayscale
                    ) {

                        const gray =
                            (
                                0.299 * r +
                                0.587 * g +
                                0.114 * b
                            );

                        r =
                            gray;

                        g =
                            gray;

                        b =
                            gray;
                    }

                    /*
                     * Brightness
                     */

                    r +=
                        brightness;

                    g +=
                        brightness;

                    b +=
                        brightness;

                    /*
                     * Contrast
                     */

                    r =
                        factor *
                        (
                            r -
                            128
                        ) +
                        128;

                    g =
                        factor *
                        (
                            g -
                            128
                        ) +
                        128;

                    b =
                        factor *
                        (
                            b -
                            128
                        ) +
                        128;

                    /*
                     * Denoise
                     */

                    if (
                        handwritingSettings.denoise &&
                        intensity > 0
                    ) {

                        const average =
                            (
                                r +
                                g +
                                b
                            ) / 3;

                        const threshold =
                            18 *
                            intensity;

                        if (
                            Math.abs(
                                r -
                                average
                            ) < threshold
                        ) {

                            r =
                                average;
                        }

                        if (
                            Math.abs(
                                g -
                                average
                            ) < threshold
                        ) {

                            g =
                                average;
                        }

                        if (
                            Math.abs(
                                b -
                                average
                            ) < threshold
                        ) {

                            b =
                                average;
                        }
                    }

                    /*
                     * Sharpen / writing clarity
                     */

                    if (
                        handwritingSettings.sharpen
                    ) {

                        const gray =
                            (
                                0.299 * r +
                                0.587 * g +
                                0.114 * b
                            );

                        const sharpenAmount =
                            0.08 *
                            intensity;

                        r =
                            r +
                            (
                                gray -
                                r
                            ) *
                            sharpenAmount;

                        g =
                            g +
                            (
                                gray -
                                g
                            ) *
                            sharpenAmount;

                        b =
                            b +
                            (
                                gray -
                                b
                            ) *
                            sharpenAmount;
                    }

                    data[i] =
                        clampColor(r);

                    data[i + 1] =
                        clampColor(g);

                    data[i + 2] =
                        clampColor(b);
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
        }
    );
}


/* ==========================================
   IMPROVE HANDWRITING BUTTON
========================================== */

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

                ensureHandwritingOcrInterface();

                updateHandwritingOcrAfterEnhancement();

                enhanceHandwriting.dataset.enhanced =
                    "true";

                if (createHandwritingPdf) {

                    /*
                     * الزر القديم لا ينشئ PDF من الصورة
                     * بعد الآن؛ بل يصبح زرًا مساعدًا.
                     * إنشاء PDF الحقيقي يتم من النص الرقمي
                     * بعد OCR.
                     */

                    createHandwritingPdf.disabled =
                        false;
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

                ensureHandwritingOcrInterface();

                if (handwritingOcrStatus) {

                    handwritingOcrStatus.textContent =
                        "⚠️ تعذر التحسين، ويمكنك استخدام الصورة الأصلية واستخراج النص منها.";
                }

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


/* ==========================================
   CREATE HANDWRITING PDF
   IMPORTANT:
   This now creates a DIGITAL PDF from OCR text.
========================================== */

if (createHandwritingPdf) {

    createHandwritingPdf.addEventListener(
        "click",
        async () => {

            /*
             * إذا كان هناك نص OCR جاهز:
             * نستخدمه.
             *
             * إذا لم يوجد، نشغّل OCR أولًا.
             */

            ensureHandwritingOcrInterface();

            if (
                !handwritingOcrText.trim()
            ) {

                await runHandwritingOCR();
            }

            const text =
                handwritingOcrTextarea
                    ? handwritingOcrTextarea.value.trim()
                    : handwritingOcrText.trim();

            if (!text) {

                alert(
                    "لم يتم استخراج نص من الصورة. اضغط «استخراج النص العربي» أو استخدم صورة أوضح."
                );

                return;
            }

            handwritingOcrText =
                text;

            const originalText =
                setButtonLoading(
                    createHandwritingPdf,
                    "⏳ جاري إنشاء PDF رقمي..."
                );

            let container =
                null;

            try {

                if (!window.jspdf) {

                    throw new Error(
                        "jsPDF is not loaded."
                    );
                }

                if (!window.html2canvas) {

                    throw new Error(
                        "html2canvas is not loaded."
                    );
                }

                const {
                    jsPDF
                } =
                    window.jspdf;

                /*
                 * إنشاء صفحة HTML مؤقتة بالنص
                 * العربي.
                 *
                 * النتيجة ليست الصورة الأصلية.
                 * بل كتابة رقمية باستخدام Cairo.
                 */

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
                    "65px";

                container.style.background =
                    "#ffffff";

                container.style.color =
                    "#111111";

                container.style.fontFamily =
                    "Cairo, Arial, sans-serif";

                container.style.fontSize =
                    "21px";

                container.style.fontWeight =
                    "500";

                container.style.lineHeight =
                    "2.1";

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

                /*
                 * عنوان المستند.
                 */

                const title =
                    document.createElement(
                        "div"
                    );

                title.textContent =
                    "تحضير الدرس";

                title.style.fontFamily =
                    "Cairo, Arial, sans-serif";

                title.style.fontSize =
                    "28px";

                title.style.fontWeight =
                    "800";

                title.style.textAlign =
                    "center";

                title.style.marginBottom =
                    "30px";

                title.style.color =
                    "#111111";


                /*
                 * النص المستخرج.
                 */

                const textElement =
                    document.createElement(
                        "div"
                    );

                textElement.textContent =
                    text;

                textElement.style.fontFamily =
                    "Cairo, Arial, sans-serif";

                textElement.style.fontSize =
                    "21px";

                textElement.style.fontWeight =
                    "500";

                textElement.style.lineHeight =
                    "2.1";

                textElement.style.direction =
                    "rtl";

                textElement.style.textAlign =
                    "right";

                textElement.style.whiteSpace =
                    "pre-wrap";

                textElement.style.wordBreak =
                    "normal";

                textElement.style.overflowWrap =
                    "break-word";


                container.appendChild(
                    title
                );

                container.appendChild(
                    textElement
                );

                document.body.appendChild(
                    container
                );

                if (document.fonts) {

                    await document.fonts.ready;
                }

                /*
                 * تحويل النص الرقمي إلى صفحات PDF.
                 *
                 * html2canvas هنا يجعل النص
                 * مطبوعًا بصريًا داخل الـPDF
                 * بدل وضع صورة الورقة الأصلية.
                 */

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

                if (!canvas.width) {

                    throw new Error(
                        "تعذر إنشاء صفحات PDF."
                    );
                }

                const pdf =
                    new jsPDF({
                        orientation:
                            "portrait",
                        unit:
                            "mm",
                        format:
                            "a4"
                    });

                await addCanvasToPdf(
                    pdf,
                    canvas,
                    10
                );

                /*
                 * اسم فريد لمنع مشكلة
                 * إعادة تنزيل نفس الملف.
                 */

                pdf.save(
                    createUniqueFileName(
                        "WebBag-Handwriting-Digital"
                    )
                );

                if (handwritingOcrStatus) {

                    handwritingOcrStatus.textContent =
                        "✅ تم إنشاء PDF رقمي من النص العربي المستخرج.";
                }

            } catch (error) {

                console.error(
                    "DIGITAL HANDWRITING PDF ERROR:",
                    error
                );

                alert(
                    "حدث خطأ أثناء إنشاء PDF الرقمي."
                );

            } finally {

                if (container) {
                    container.remove();
                }

                restoreButton(
                    createHandwritingPdf,
                    originalText
                );
            }
        }
    );
}


/* ==========================================
   CREATE HANDWRITING TEXT PDF DIRECTLY
========================================== */

async function createHandwritingTextPdf() {

    if (!handwritingOcrTextarea) {
        return;
    }

    const text =
        handwritingOcrTextarea.value.trim();

    if (!text) {

        alert(
            "لا يوجد نص لإنشاء PDF."
        );

        return;
    }

    handwritingOcrText =
        text;

    const originalText =
        handwritingOcrPdfButton
            ? setButtonLoading(
                handwritingOcrPdfButton,
                "⏳ جاري إنشاء PDF..."
            )
            : null;

    let container =
        null;

    try {

        if (!window.jspdf) {

            throw new Error(
                "jsPDF is not loaded."
            );
        }

        if (!window.html2canvas) {

            throw new Error(
                "html2canvas is not loaded."
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

        container.style.padding =
            "65px";

        container.style.boxSizing =
            "border-box";

        container.style.background =
            "#ffffff";

        container.style.color =
            "#111111";

        container.style.fontFamily =
            "Cairo, Arial, sans-serif";

        container.style.fontSize =
            "21px";

        container.style.fontWeight =
            "500";

        container.style.lineHeight =
            "2.1";

        container.style.direction =
            "rtl";

        container.style.textAlign =
            "right";

        container.style.whiteSpace =
            "pre-wrap";

        container.style.overflowWrap =
            "break-word";

        const title =
            document.createElement(
                "div"
            );

        title.textContent =
            "تحضير الدرس";

        title.style.fontFamily =
            "Cairo, Arial, sans-serif";

        title.style.fontSize =
            "28px";

        title.style.fontWeight =
            "800";

        title.style.textAlign =
            "center";

        title.style.marginBottom =
            "30px";

        const body =
            document.createElement(
                "div"
            );

        body.textContent =
            text;

        body.style.fontFamily =
            "Cairo, Arial, sans-serif";

        body.style.fontSize =
            "21px";

        body.style.fontWeight =
            "500";

        body.style.lineHeight =
            "2.1";

        body.style.direction =
            "rtl";

        body.style.textAlign =
            "right";

        body.style.whiteSpace =
            "pre-wrap";

        container.appendChild(
            title
        );

        container.appendChild(
            body
        );

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

        const pdf =
            new jsPDF({
                orientation:
                    "portrait",
                unit:
                    "mm",
                format:
                    "a4"
            });

        await addCanvasToPdf(
            pdf,
            canvas,
            10
        );

        pdf.save(
            createUniqueFileName(
                "WebBag-Handwriting-Digital"
            )
        );

        if (handwritingOcrStatus) {

            handwritingOcrStatus.textContent =
                "✅ تم إنشاء PDF رقمي من النص المصحح.";
        }

    } catch (error) {

        console.error(
            "HANDWRITING TEXT PDF ERROR:",
            error
        );

        alert(
            "تعذر إنشاء PDF من النص الرقمي."
        );

    } finally {

        if (container) {
            container.remove();
        }

        if (handwritingOcrPdfButton) {

            restoreButton(
                handwritingOcrPdfButton,
                originalText
            );
        }
    }
}


/* ==========================================
   ADD LARGE CANVAS TO A4 PDF
========================================== */

async function addCanvasToPdf(
    pdf,
    canvas,
    margin = 10
) {

    if (!pdf || !canvas) {

        throw new Error(
            "Invalid PDF or canvas."
        );
    }

    const pageWidth =
        pdf.internal.pageSize.getWidth();

    const pageHeight =
        pdf.internal.pageSize.getHeight();

    const usableWidth =
        pageWidth -
        margin * 2;

    const usableHeight =
        pageHeight -
        margin * 2;

    const canvasRatio =
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
                "Unable to create page canvas."
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
                "image/jpeg",
                0.95
            );

        const imageWidth =
            usableWidth;

        const imageHeight =
            Math.min(
                usableHeight,
                imageWidth /
                    canvasRatio *
                    (
                        currentHeight /
                        (
                            canvas.width /
                            canvasRatio
                        )
                    )
            );

        /*
         * أبسط وأدق حساب للنسبة
         * لكل صفحة مقصوصة من الـcanvas.
         */

        const actualImageHeight =
            imageWidth *
            currentHeight /
            canvas.width;

        const finalHeight =
            Math.min(
                usableHeight,
                actualImageHeight
            );

        const x =
            (
                pageWidth -
                imageWidth
            ) / 2;

        const y =
            (
                pageHeight -
                finalHeight
            ) / 2;

        pdf.addImage(
            pageImage,
            "JPEG",
            x,
            y,
            imageWidth,
            finalHeight,
            undefined,
            "FAST"
        );

        sourceY +=
            currentHeight;

        pageNumber++;
    }
}


/* ==========================================
   IMAGE LOADER
========================================== */

function loadImage(
    dataUrl
) {

    return new Promise(
        (resolve, reject) => {

            const image =
                new Image();

            image.onload =
                () => resolve(
                    image
                );

            image.onerror =
                () => reject(
                    new Error(
                        "تعذر تحميل الصورة."
                    )
                );

            image.src =
                dataUrl;
        }
    );
}


/* ==========================================
   READ IMAGE FILE
========================================== */

function readImageFile(
    file
) {

    return new Promise(
        (resolve, reject) => {

            if (!isValidImage(file)) {

                reject(
                    new Error(
                        "Invalid image file."
                    )
                );

                return;
            }

            const reader =
                new FileReader();

            reader.onload =
                () => resolve(
                    reader.result
                );

            reader.onerror =
                () => reject(
                    new Error(
                        "Unable to read image."
                    )
                );

            reader.readAsDataURL(
                file
            );
        }
    );
}


/* ==========================================
   MANUAL IMAGE ENHANCEMENT API
========================================== */

function setHandwritingBrightness(
    value
) {

    handwritingSettings.brightness =
        Number(value) || 0;
}


function setHandwritingContrast(
    value
) {

    handwritingSettings.contrast =
        Number(value) || 1;
}


function setHandwritingIntensity(
    value
) {

    handwritingSettings.intensity =
        clamp(
            Number(value) || 0,
            0,
            1
        );
}


function setHandwritingGrayscale(
    value
) {

    handwritingSettings.grayscale =
        Boolean(value);
}


function setHandwritingRemoveYellow(
    value
) {

    handwritingSettings.removeYellow =
        Boolean(value);
}


function setHandwritingDenoise(
    value
) {

    handwritingSettings.denoise =
        Boolean(value);
}


function setHandwritingSharpen(
    value
) {

    handwritingSettings.sharpen =
        Boolean(value);
}


/* ==========================================
   RE-APPLY CURRENT ENHANCEMENT
========================================== */

async function reapplyHandwritingEnhancement() {

    if (!handwritingOriginalImage) {
        return;
    }

    try {

        const result =
            await enhanceHandwritingImage(
                handwritingOriginalImage
            );

        handwritingEnhancedImage =
            result;

        showHandwritingPreview(
            result
        );

        ensureHandwritingOcrInterface();

        updateHandwritingOcrAfterEnhancement();

    } catch (error) {

        console.error(
            "REAPPLY HANDWRITING ERROR:",
            error
        );
    }
}


/* ==========================================
   RESET HANDWRITING TO ORIGINAL
========================================== */

function restoreOriginalHandwriting() {

    if (!handwritingOriginalImage) {
        return;
    }

    handwritingEnhancedImage =
        null;

    showHandwritingPreview(
        handwritingOriginalImage
    );

    ensureHandwritingOcrInterface();

    handwritingOcrText =
        "";

    handwritingOcrReady =
        false;

    if (handwritingOcrTextarea) {

        handwritingOcrTextarea.value =
            "";
    }

    if (handwritingOcrPdfButton) {

        handwritingOcrPdfButton.disabled =
            true;
    }

    if (handwritingOcrStatus) {

        handwritingOcrStatus.textContent =
            "↩️ تم إرجاع الصورة الأصلية. يمكنك استخراج النص مرة أخرى.";
    }

    if (enhanceHandwriting) {

        enhanceHandwriting.dataset.enhanced =
            "false";
    }
}


/* ==========================================
   RESET HANDWRITING
========================================== */

function resetHandwritingInterface() {

    handwritingOriginalImage =
        null;

    handwritingEnhancedImage =
        null;

    handwritingImageObject =
        null;

    handwritingOcrText =
        "";

    handwritingOcrReady =
        false;

    handwritingOcrRunning =
        false;

    handwritingOcrArea =
        null;

    handwritingOcrTextarea =
        null;

    handwritingOcrStatus =
        null;

    handwritingOcrButton =
        null;

    handwritingOcrPdfButton =
        null;

    handwritingRestoreButton =
        null;

    if (handwritingImageInput) {

        handwritingImageInput.value =
            "";
    }

    if (handwritingPreview) {

        handwritingPreview.innerHTML = `
            لم يتم اختيار صورة
        `;
    }

    if (enhanceHandwriting) {

        enhanceHandwriting.disabled =
            true;
    }

    if (createHandwritingPdf) {

        createHandwritingPdf.disabled =
            true;
    }
}


/* ==========================================
   OPTIONAL HANDWRITING RESET BUTTON
========================================== */

const resetHandwriting =
    $("resetHandwriting");

if (resetHandwriting) {

    resetHandwriting.addEventListener(
        "click",
        () => {

            restoreOriginalHandwriting();

        }
    );
}


/* ==========================================
   OPTIONAL MANUAL CONTROLS
========================================== */

const handwritingBrightness =
    $("handwritingBrightness");

const handwritingContrast =
    $("handwritingContrast");

const handwritingIntensity =
    $("handwritingIntensity");

const handwritingGrayscale =
    $("handwritingGrayscale");

const handwritingRemoveYellow =
    $("handwritingRemoveYellow");

const handwritingDenoise =
    $("handwritingDenoise");

const handwritingSharpen =
    $("handwritingSharpen");


if (handwritingBrightness) {

    handwritingBrightness.addEventListener(
        "input",
        () => {

            setHandwritingBrightness(
                handwritingBrightness.value
            );

            reapplyHandwritingEnhancement();

        }
    );
}


if (handwritingContrast) {

    handwritingContrast.addEventListener(
        "input",
        () => {

            setHandwritingContrast(
                handwritingContrast.value
            );

            reapplyHandwritingEnhancement();

        }
    );
}


if (handwritingIntensity) {

    handwritingIntensity.addEventListener(
        "input",
        () => {

            setHandwritingIntensity(
                handwritingIntensity.value
            );

            reapplyHandwritingEnhancement();

        }
    );
}


if (handwritingGrayscale) {

    handwritingGrayscale.addEventListener(
        "change",
        () => {

            setHandwritingGrayscale(
                handwritingGrayscale.checked
            );

            reapplyHandwritingEnhancement();

        }
    );
}


if (handwritingRemoveYellow) {

    handwritingRemoveYellow.addEventListener(
        "change",
        () => {

            setHandwritingRemoveYellow(
                handwritingRemoveYellow.checked
            );

            reapplyHandwritingEnhancement();

        }
    );
}


if (handwritingDenoise) {

    handwritingDenoise.addEventListener(
        "change",
        () => {

            setHandwritingDenoise(
                handwritingDenoise.checked
            );

            reapplyHandwritingEnhancement();

        }
    );
}


if (handwritingSharpen) {

    handwritingSharpen.addEventListener(
        "change",
        () => {

            setHandwritingSharpen(
                handwritingSharpen.checked
            );

            reapplyHandwritingEnhancement();

        }
    );
}


/* ==========================================
   OPTIONAL PDF IMAGE HELPERS
========================================== */

function loadPdfImage(
    dataUrl
) {

    return loadImage(
        dataUrl
    );
}


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
   GLOBAL RESET
========================================== */

function resetPdfTools() {

    resetPdfInterface();

    selectedImages =
        [];

    if (imagesToPdfInput) {

        imagesToPdfInput.value =
            "";
    }

    renderImagesPreview();

    resetHandwritingInterface();
}


/* ==========================================
   OPTIONAL GLOBAL RESET BUTTON
========================================== */

const resetPdfToolsButton =
    $("resetPdfTools");

if (resetPdfToolsButton) {

    resetPdfToolsButton.addEventListener(
        "click",
        () => {

            resetPdfTools();

        }
    );
}


/* ==========================================
   INITIAL UI STATE
========================================== */

function initializePdfTool() {

    if (pdfStatus) {

        pdfStatus.textContent =
            "✅ أداة PDF AI جاهزة.";
    }

    if (summarizePdf) {

        summarizePdf.disabled =
            !extractedPdfText;
    }

    if (copyPdfText) {

        copyPdfText.disabled =
            !extractedPdfText;
    }

    if (createImagesPdf) {

        createImagesPdf.disabled =
            selectedImages.length === 0;
    }

    if (enhanceHandwriting) {

        enhanceHandwriting.disabled =
            !handwritingOriginalImage;
    }

    if (createHandwritingPdf) {

        createHandwritingPdf.disabled =
            !handwritingOriginalImage;
    }
}


/* ==========================================
   START
========================================== */

initializePdfTool();


/* ==========================================
   PUBLIC API
========================================== */

window.WebBagPDF = {

    readPdfFile,

    resetPdfInterface,

    resetPdfTools,

    enhanceHandwritingImage,

    restoreOriginalHandwriting,

    reapplyHandwritingEnhancement,

    setHandwritingBrightness,

    setHandwritingContrast,

    setHandwritingIntensity,

    setHandwritingGrayscale,

    setHandwritingRemoveYellow,

    setHandwritingDenoise,

    setHandwritingSharpen,

    createLocalPdfSummary,

    runHandwritingOCR,

    createHandwritingTextPdf,

    prepareImageForOCR,

    cleanArabicOcrText,

    isValidPdf,

    isValidImage
};


/* ==========================================
   END OF WebBag PDF AI
========================================== */
