/* ==========================================
   WebBag PDF AI
   Complete PDF Tool

   PDF.js
   Arabic OCR (ara)
   OCR Confidence Filtering
   Arabic RTL Cleanup
   Handwriting → Digital Text
   Digital Text → Real Text PDF
   AI Local Analysis:
     - Summary
     - Headings
     - Key Points
     - Questions

   IMPORTANT:
   - Never inject "تحضير الدرس"
   - Never invent OCR text intentionally
   - Low-confidence OCR words are rejected
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
let pdfReaderPromise = null;


/* ==========================================
   OCR SETTINGS
========================================== */

const OCR_SETTINGS = {

    language: "ara",

    /*
     * الكلمات التي تقل ثقتها عن هذه النسبة
     * يتم رفضها.
     *
     * يمكن رفعها إلى 60 أو 65 إذا أردت
     * دقة أكثر ونتائج أقل.
     */
    minimumWordConfidence: 55,

    /*
     * إذا كانت الصفحة تحتوي نصًا مستخرجًا
     * أصليًا بدرجة جيدة، لا نعيد OCR.
     */
    minimumNativeTextLength: 8,

    /*
     * OCR للصفحات المصورة.
     */
    enablePdfImageOCR: true,

    /*
     * حجم الصفحة عند تحويل PDF إلى صورة.
     */
    pdfRenderScale: 2.0,

    /*
     * حجم تحسين صورة الخط.
     */
    handwritingMaxDimension: 3000
};


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
   AI ELEMENTS
========================================== */

let pdfAiResult = null;
let pdfAiArea = null;


/* ==========================================
   PDF.JS LOADER
========================================== */

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
   BUTTON STATE
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
   STATUS
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
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ==========================================
   RTL NORMALIZATION
========================================== */

function normalizeArabicRTL(text) {

    if (!text) {
        return "";
    }

    let result =
        String(text)
            .replace(/\r/g, "")
            .replace(/\u200e/g, "")
            .replace(/\u200f/g, "")
            .replace(/\u202a/g, "")
            .replace(/\u202b/g, "")
            .replace(/\u202c/g, "")
            .replace(/\u2066/g, "")
            .replace(/\u2067/g, "")
            .replace(/\u2069/g, "");

    /*
     * إزالة المسافات المتكررة.
     */

    result =
        result.replace(
            /[ \t]+/g,
            " "
        );

    /*
     * لا نحذف الأسطر المفيدة.
     */

    result =
        result.replace(
            /\n[ \t]+/g,
            "\n"
        );

    result =
        result.replace(
            /[ \t]+\n/g,
            "\n"
        );

    /*
     * علامات الترقيم.
     */

    result =
        result.replace(
            /\s+([،؛:!?؟])/g,
            "$1"
        );

    result =
        result.replace(
            /([،؛:!?؟])([^\s])/g,
            "$1 $2"
        );

    /*
     * إزالة الأسطر الفارغة المتكررة.
     */

    result =
        result.replace(
            /\n{3,}/g,
            "\n\n"
        );

    return result.trim();
}


/* ==========================================
   OCR TEXT CLEANING
========================================== */

function cleanArabicOcrText(text) {

    if (!text) {
        return "";
    }

    let result =
        normalizeArabicRTL(
            text
        );

    /*
     * توحيد أشكال بعض الحروف العربية.
     *
     * لا نغير الكلمات نفسها.
     */

    result =
        result
            .replace(/ٱ/g, "ا")
            .replace(/أ/g, "ا")
            .replace(/إ/g, "ا")
            .replace(/آ/g, "ا");

    /*
     * الأرقام العربية إلى أرقام موحدة.
     */

    const arabicDigits =
        "٠١٢٣٤٥٦٧٨٩";

    const westernDigits =
        "0123456789";

    for (
        let i = 0;
        i < arabicDigits.length;
        i++
    ) {

        result =
            result.replace(
                new RegExp(
                    arabicDigits[i],
                    "g"
                ),
                westernDigits[i]
            );
    }

    return normalizeArabicRTL(
        result
    );
}


/* ==========================================
   OCR CONFIDENCE HELPERS
========================================== */

function getWordConfidence(word) {

    if (!word) {
        return 0;
    }

    const confidence =
        Number(
            word.confidence
        );

    if (
        !Number.isFinite(confidence)
    ) {

        return 0;
    }

    return confidence;
}


function isUsefulOcrWord(word) {

    if (!word) {
        return false;
    }

    const text =
        String(
            word.text ||
            ""
        ).trim();

    if (!text) {
        return false;
    }

    /*
     * رفض الكلمات ذات الثقة الضعيفة.
     */

    const confidence =
        getWordConfidence(
            word
        );

    if (
        confidence <
        OCR_SETTINGS.minimumWordConfidence
    ) {

        return false;
    }

    /*
     * رفض رموز غريبة بالكامل.
     */

    const hasArabic =
        /[\u0600-\u06FF]/u.test(
            text
        );

    const hasNumber =
        /[0-9]/.test(
            text
        );

    const hasPunctuation =
        /[،؛:!?؟.,()[\]{}\-_/]/.test(
            text
        );

    /*
     * كلمة لا تحتوي عربيًا ولا رقمًا
     * ولا علامة ترقيم مفيدة يتم رفضها.
     */

    if (
        !hasArabic &&
        !hasNumber &&
        !hasPunctuation
    ) {

        return false;
    }

    return true;
}


/* ==========================================
   FILTER OCR WORDS
========================================== */

function filterOcrWords(
    words
) {

    if (!Array.isArray(words)) {
        return [];
    }

    return words.filter(
        isUsefulOcrWord
    );
}


/* ==========================================
   BUILD TEXT FROM OCR WORDS
========================================== */

function buildTextFromOcrWords(
    words
) {

    const accepted =
        filterOcrWords(
            words
        );

    if (!accepted.length) {
        return "";
    }

    /*
     * Tesseract يعطي bounding boxes.
     * نرتب الكلمات حسب السطر ثم RTL.
     */

    const lineMap =
        new Map();

    accepted.forEach(
        word => {

            const bbox =
                word.bbox ||
                {};

            const top =
                Number(
                    bbox.y0 ||
                    bbox.y ||
                    0
                );

            const lineKey =
                Math.round(
                    top / 12
                );

            if (!lineMap.has(lineKey)) {

                lineMap.set(
                    lineKey,
                    []
                );
            }

            lineMap
                .get(lineKey)
                .push(word);
        }
    );

    const sortedLines =
        Array.from(
            lineMap.entries()
        )
        .sort(
            (a, b) =>
                a[0] -
                b[0]
        );

    const lines =
        [];

    sortedLines.forEach(
        ([, lineWords]) => {

            lineWords.sort(
                (a, b) => {

                    const ax =
                        Number(
                            a.bbox?.x0 ||
                            0
                        );

                    const bx =
                        Number(
                            b.bbox?.x0 ||
                            0
                        );

                    /*
                     * العربية RTL:
                     * نقرأ من اليمين إلى اليسار.
                     */

                    return bx - ax;
                }
            );

            const line =
                lineWords
                    .map(
                        word =>
                            String(
                                word.text ||
                                ""
                            ).trim()
                    )
                    .filter(Boolean)
                    .join(" ");

            if (line) {
                lines.push(line);
            }
        }
    );

    return cleanArabicOcrText(
        lines.join("\n")
    );
}


/* ==========================================
   PREPARE IMAGE FOR OCR
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

    const maxDimension =
        OCR_SETTINGS.handwritingMaxDimension;

    const scale =
        Math.min(
            2,
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

    const pixels =
        context.getImageData(
            0,
            0,
            targetWidth,
            targetHeight
        );

    const data =
        pixels.data;

    /*
     * تحسين تباين معتدل.
     */

    for (
        let i = 0;
        i < data.length;
        i += 4
    ) {

        const r =
            data[i];

        const g =
            data[i + 1];

        const b =
            data[i + 2];

        const gray =
            (
                0.299 * r +
                0.587 * g +
                0.114 * b
            );

        /*
         * تنظيف الخلفية الفاتحة
         * دون threshold قاسٍ.
         */

        let value =
            gray;

        if (
            value >
            180
        ) {

            value =
                255;
        }

        /*
         * Contrast.
         */

        value =
            (
                value -
                128
            ) *
            1.18 +
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
   GENERIC OCR
========================================== */

async function recognizeArabicImage(
    imageData,
    statusCallback = null
) {

    const Tesseract =
        await loadTesseract();

    const ocrImage =
        await prepareImageForOCR(
            imageData
        );

    const worker =
        await Tesseract.createWorker(
            OCR_SETTINGS.language,
            1,
            {
                langPath:
                    "https://tessdata.projectnaptha.com/4.0.0",

                logger:
                    message => {

                        if (
                            typeof statusCallback ===
                            "function"
                        ) {

                            statusCallback(
                                message
                            );
                        }
                    }
            }
        );

    try {

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

        const data =
            result &&
            result.data
                ? result.data
                : null;

        if (!data) {

            return {
                text: "",
                words: [],
                acceptedWords: [],
                averageConfidence: 0
            };
        }

        const words =
            Array.isArray(
                data.words
            )
                ? data.words
                : [];

        const acceptedWords =
            filterOcrWords(
                words
            );

        const text =
            buildTextFromOcrWords(
                acceptedWords
            );

        const confidences =
            acceptedWords
                .map(
                    getWordConfidence
                )
                .filter(
                    Number.isFinite
                );

        const averageConfidence =
            confidences.length
                ? (
                    confidences.reduce(
                        (a, b) =>
                            a + b,
                        0
                    ) /
                    confidences.length
                )
                : 0;

        return {

            text,

            words,

            acceptedWords,

            averageConfidence
        };

    } finally {

        await worker.terminate();
    }
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
   EXTRACT NATIVE PDF TEXT
========================================== */

async function extractNativePdfPageText(
    page
) {

    const content =
        await page.getTextContent();

    const items =
        Array.isArray(
            content.items
        )
            ? content.items
            : [];

    const text =
        items
            .map(
                item =>
                    String(
                        item.str ||
                        ""
                    )
            )
            .join(" ")
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    return text;
}


/* ==========================================
   RENDER PDF PAGE FOR OCR
========================================== */

async function renderPdfPageForOCR(
    page
) {

    const viewport =
        page.getViewport({
            scale:
                OCR_SETTINGS.pdfRenderScale
        });

    const canvas =
        document.createElement(
            "canvas"
        );

    canvas.width =
        Math.ceil(
            viewport.width
        );

    canvas.height =
        Math.ceil(
            viewport.height
        );

    const context =
        canvas.getContext(
            "2d"
        );

    if (!context) {

        throw new Error(
            "Unable to create PDF OCR canvas."
        );
    }

    context.fillStyle =
        "#ffffff";

    context.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    await page.render({
        canvasContext:
            context,

        viewport
    }).promise;

    return canvas.toDataURL(
        "image/png"
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

    const pages =
        [];

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

        let pageText =
            await extractNativePdfPageText(
                page
            );

        /*
         * إذا لم يوجد نص أصلي،
         * نحول الصفحة إلى صورة ونجري OCR عربي.
         */

        if (
            OCR_SETTINGS.enablePdfImageOCR &&
            pageText.length <
                OCR_SETTINGS.minimumNativeTextLength
        ) {

            try {

                setPdfStatus(
                    `⏳ الصفحة ${pageNumber} صورة — جارٍ تشغيل OCR العربي...`
                );

                const image =
                    await renderPdfPageForOCR(
                        page
                    );

                const ocrResult =
                    await recognizeArabicImage(
                        image,
                        message => {

                            if (
                                message &&
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

                                    setPdfStatus(
                                        `⏳ OCR الصفحة ${pageNumber}: ${message.status} — ${progress}%`
                                    );

                                } else {

                                    setPdfStatus(
                                        `⏳ OCR الصفحة ${pageNumber}: ${message.status}`
                                    );
                                }
                            }
                        }
                    );

                /*
                 * لا نستخدم OCR إذا لم تكن هناك
                 * كلمات موثوقة.
                 */

                if (
                    ocrResult &&
                    ocrResult.text
                ) {

                    pageText =
                        ocrResult.text;
                }

            } catch (ocrError) {

                console.warn(
                    `OCR failed on page ${pageNumber}:`,
                    ocrError
                );

                /*
                 * لا نخترع نصًا.
                 */

                pageText =
                    "";
            }
        }

        pages.push(
            pageText
        );
    }

    const pageBlocks =
        pages.map(
            (text, index) => {

                const clean =
                    cleanArabicOcrText(
                        text
                    );

                if (!clean) {
                    return "";
                }

                return (
                    `--- الصفحة ${index + 1} ---\n\n` +
                    clean
                );
            }
        )
        .filter(Boolean);

    extractedPdfText =
        pageBlocks.join(
            "\n\n"
        );

    if (!extractedPdfText) {

        setPdfStatus(
            "⚠️ لم يتم العثور على نص موثوق في الملف."
        );

        if (pdfText) {

            pdfText.innerHTML = `
                <p class="pdf-placeholder">
                    لم يتم العثور على نص موثوق.
                    إذا كانت الورقة بخط يد عربي،
                    استخدم قسم «الخط اليدوي → نص رقمي».
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

    renderPdfAiArea(
        extractedPdfText
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
   SENTENCE SPLITTER
========================================== */

function splitArabicSentences(
    text
) {

    if (!text) {
        return [];
    }

    return cleanArabicOcrText(
        text
    )
    .split(
        /(?<=[.!؟؛])\s+|\n+/u
    )
    .map(
        item =>
            item.trim()
    )
    .filter(
        item =>
            item.length > 5
    );
}


/* ==========================================
   LOCAL SUMMARY
========================================== */

function createLocalPdfSummary(
    text
) {

    if (!text) {
        return "";
    }

    const cleanText =
        cleanArabicOcrText(
            text
        )
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
        splitArabicSentences(
            cleanText
        );

    /*
     * نختار الجمل الأكثر معلوماتية
     * بدل إضافة نص من خارج المصدر.
     */

    const scored =
        sentences.map(
            sentence => {

                const words =
                    sentence
                        .split(/\s+/)
                        .filter(Boolean);

                let score =
                    words.length;

                if (
                    /هو|هي|يعني|يعرف|تعريف|يتكون|يحدث|أهمية|أسباب|نتائج|أنواع|خطوات|مثال/u
                        .test(sentence)
                ) {

                    score += 8;
                }

                return {
                    sentence,
                    score
                };
            }
        );

    scored.sort(
        (a, b) =>
            b.score -
            a.score
    );

    return scored
        .slice(
            0,
            8
        )
        .map(
            item =>
                item.sentence
        )
        .join(" ");
}


/* ==========================================
   EXTRACT HEADINGS
========================================== */

function extractArabicHeadings(
    text
) {

    const lines =
        cleanArabicOcrText(
            text
        )
        .split("\n")
        .map(
            line =>
                line
                    .replace(
                        /--- الصفحة \d+ ---/g,
                        ""
                    )
                    .trim()
        )
        .filter(Boolean);

    const headings =
        [];

    lines.forEach(
        line => {

            const words =
                line
                    .split(/\s+/)
                    .filter(Boolean);

            /*
             * عنوان محتمل:
             * قصير + ليس جملة طويلة.
             */

            if (
                words.length >= 1 &&
                words.length <= 8 &&
                line.length <= 80
            ) {

                if (
                    !/[.!؟]$/.test(
                        line
                    )
                ) {

                    headings.push(
                        line
                    );
                }
            }
        }
    );

    return Array.from(
        new Set(
            headings
        )
    ).slice(
        0,
        12
    );
}


/* ==========================================
   EXTRACT KEY POINTS
========================================== */

function extractKeyPoints(
    text
) {

    const sentences =
        splitArabicSentences(
            text
        );

    const points =
        [];

    sentences.forEach(
        sentence => {

            if (
                sentence.length < 15
            ) {
                return;
            }

            if (
                /تعريف|أهمية|سبب|أسباب|نتيجة|نتائج|أنواع|خطوات|يتكون|يحدث|يستخدم|يعتمد/u
                    .test(sentence)
            ) {

                points.push(
                    sentence
                );
            }
        }
    );

    /*
     * إذا لم توجد كلمات دلالية،
     * نستخدم أول الجمل الطويلة فقط.
     */

    if (!points.length) {

        sentences
            .filter(
                sentence =>
                    sentence.length > 40
            )
            .slice(
                0,
                8
            )
            .forEach(
                sentence =>
                    points.push(
                        sentence
                    )
            );
    }

    return Array.from(
        new Set(points)
    ).slice(
        0,
        12
    );
}


/* ==========================================
   EXTRACT QUESTIONS
========================================== */

function extractQuestions(
    text
) {

    const sentences =
        splitArabicSentences(
            text
        );

    const questions =
        [];

    sentences.forEach(
        sentence => {

            if (
                /؟$/.test(sentence)
            ) {

                questions.push(
                    sentence
                );

                return;
            }

            /*
             * لا نخترع سؤالًا.
             *
             * نحول الجمل التعليمية إلى
             * أسئلة فقط عندما يكون التحويل
             * واضحًا من محتوى المصدر.
             */

            if (
                /ما هو|ما هي|كيف|لماذا|اذكر|وضح|عرف|عدد/u
                    .test(sentence)
            ) {

                questions.push(
                    sentence
                );
            }
        }
    );

    return Array.from(
        new Set(
            questions
        )
    ).slice(
        0,
        10
    );
}


/* ==========================================
   AI LOCAL ANALYSIS
========================================== */

function analyzePdfContent(
    text
) {

    const clean =
        cleanArabicOcrText(
            text
        );

    return {

        summary:
            createLocalPdfSummary(
                clean
            ),

        headings:
            extractArabicHeadings(
                clean
            ),

        keyPoints:
            extractKeyPoints(
                clean
            ),

        questions:
            extractQuestions(
                clean
            )
    };
}


/* ==========================================
   RENDER AI AREA
========================================== */

function renderPdfAiArea(
    text
) {

    if (!pdfText) {
        return;
    }

    if (!pdfAiArea) {

        pdfAiArea =
            document.createElement(
                "div"
            );

        pdfAiArea.className =
            "webbag-pdf-ai-area";

        pdfAiArea.style.marginTop =
            "20px";

        pdfAiArea.style.padding =
            "18px";

        pdfAiArea.style.borderRadius =
            "18px";

        pdfAiArea.style.background =
            "rgba(255,255,255,0.06)";

        pdfAiArea.style.border =
            "1px solid rgba(255,255,255,0.15)";

        pdfAiArea.dir =
            "rtl";

        pdfText.parentNode
            .appendChild(
                pdfAiArea
            );
    }

    pdfAiResult =
        analyzePdfContent(
            text
        );

    const result =
        pdfAiResult;

    pdfAiArea.innerHTML = `
        <h3>🤖 التحليل الذكي للمحتوى</h3>

        <section>
            <h4>📝 الملخص</h4>
            <p>
                ${escapeHtml(
                    result.summary ||
                    "لم يتم العثور على ملخص موثوق."
                )}
            </p>
        </section>

        <section>
            <h4>🏷️ العناوين المحتملة</h4>
            ${
                result.headings.length
                    ? `<ul>${
                        result.headings
                            .map(
                                item =>
                                    `<li>${escapeHtml(item)}</li>`
                            )
                            .join("")
                    }</ul>`
                    : "<p>لم يتم العثور على عناوين واضحة.</p>"
            }
        </section>

        <section>
            <h4>📌 النقاط الأساسية</h4>
            ${
                result.keyPoints.length
                    ? `<ul>${
                        result.keyPoints
                            .map(
                                item =>
                                    `<li>${escapeHtml(item)}</li>`
                            )
                            .join("")
                    }</ul>`
                    : "<p>لم يتم العثور على نقاط واضحة.</p>"
            }
        </section>

        <section>
            <h4>❓ الأسئلة المستخرجة</h4>
            ${
                result.questions.length
                    ? `<ol>${
                        result.questions
                            .map(
                                item =>
                                    `<li>${escapeHtml(item)}</li>`
                            )
                            .join("")
                    }</ol>`
                    : "<p>لا توجد أسئلة واضحة في المحتوى.</p>"
            }
        </section>
    `;
}


/* ==========================================
   PDF SUMMARY BUTTON
========================================== */

if (summarizePdf) {

    summarizePdf.addEventListener(
        "click",
        async () => {

            if (!extractedPdfText) {
                return;
            }

            const originalText =
                setButtonLoading(
                    summarizePdf,
                    "⏳ جارٍ التحليل..."
                );

            try {

                const result =
                    analyzePdfContent(
                        extractedPdfText
                    );

                pdfAiResult =
                    result;

                if (pdfSummary) {

                    pdfSummary.textContent =
                        result.summary ||
                        "لم يتم العثور على ملخص.";
                }

                renderPdfAiArea(
                    extractedPdfText
                );

                setPdfStatus(
                    "✅ تم إنشاء التحليل الذكي."
                );

            } catch (error) {

                console.error(
                    "PDF AI ERROR:",
                    error
                );

                if (pdfSummary) {

                    pdfSummary.innerHTML = `
                        <p class="pdf-placeholder">
                            ❌ تعذر تحليل المحتوى.
                        </p>
                    `;
                }

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

    pdfAiResult =
        null;

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

    if (pdfAiArea) {

        pdfAiArea.remove();

        pdfAiArea =
            null;
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
   TEXT → REAL PDF TEXT
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

            try {

                await createRealArabicTextPdf(
                    text,
                    "WebBag-Text"
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

                restoreButton(
                    createTextPdf,
                    originalText
                );
            }
        }
    );
}


/* ==========================================
   CREATE REAL ARABIC TEXT PDF
========================================== */

async function createRealArabicTextPdf(
    text,
    filePrefix
) {

    if (!window.jspdf) {

        throw new Error(
            "jsPDF is not loaded."
        );
    }

    const {
        jsPDF
    } =
        window.jspdf;

    const clean =
        cleanArabicOcrText(
            text
        );

    if (!clean) {

        throw new Error(
            "Empty text."
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

    /*
     * محاولة استخدام دعم RTL الموجود
     * في jsPDF.
     */

    if (
        typeof pdf.setR2L ===
        "function"
    ) {

        pdf.setR2L(
            true
        );
    }

    pdf.setFont(
        "helvetica",
        "normal"
    );

    pdf.setFontSize(
        14
    );

    const pageWidth =
        pdf.internal.pageSize.getWidth();

    const pageHeight =
        pdf.internal.pageSize.getHeight();

    const margin =
        15;

    const maxWidth =
        pageWidth -
        margin * 2;

    const lines =
        clean.split("\n");

    let y =
        margin + 8;

    const lineHeight =
        7;

    for (
        const rawLine of lines
    ) {

        const line =
            rawLine.trim();

        if (!line) {

            y +=
                lineHeight;

            continue;
        }

        const wrapped =
            pdf.splitTextToSize(
                line,
                maxWidth
            );

        for (
            const piece of wrapped
        ) {

            if (
                y >
                pageHeight -
                margin
            ) {

                pdf.addPage();

                if (
                    typeof pdf.setR2L ===
                    "function"
                ) {

                    pdf.setR2L(
                        true
                    );
                }

                y =
                    margin + 8;
            }

            /*
             * لا يوجد عنوان تلقائي.
             *
             * نضع النص المستخرج فقط.
             */

            if (
                typeof pdf.text ===
                "function"
            ) {

                pdf.text(
                    piece,
                    pageWidth -
                        margin,
                    y,
                    {
                        align:
                            "right",
                        maxWidth
                    }
                );
            }

            y +=
                lineHeight;
        }
    }

    pdf.save(
        createUniqueFileName(
            filePrefix
        )
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

                    showHandwritingPreview(
                        imageData
                    );

                    ensureHandwritingOcrInterface();

                    if (enhanceHandwriting) {

                        enhanceHandwriting.disabled =
                            false;
                    }

                    if (createHandwritingPdf) {

                        createHandwritingPdf.disabled =
                            true;
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

    /*
     * إعادة إضافة واجهة OCR
     * بعد كل تحديث للصورة.
     */

    if (handwritingOcrArea) {

        handwritingPreview.appendChild(
            handwritingOcrArea
        );
    }
}


/* ==========================================
   HANDWRITING OCR UI
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

        if (
            !handwritingPreview.contains(
                handwritingOcrArea
            )
        ) {

            handwritingPreview.appendChild(
                handwritingOcrArea
            );
        }

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

    /*
     * لا يوجد أي عنوان داخل PDF.
     * هذا مجرد عنوان لواجهة التطبيق.
     */


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
        "سيظهر هنا النص المستخرج. الكلمات ضعيفة الثقة يتم رفضها تلقائيًا...";

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

            handwritingOcrPdfButton.disabled =
                !handwritingOcrReady;
        }
    );
}


/* ==========================================
   HANDWRITING OCR
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

    handwritingOcrRunning =
        true;

    const originalText =
        setButtonLoading(
            handwritingOcrButton,
            "⏳ جارٍ التعرف..."
        );

    handwritingOcrReady =
        false;

    handwritingOcrPdfButton.disabled =
        true;

    try {

        if (handwritingOcrStatus) {

            handwritingOcrStatus.textContent =
                "⏳ جارٍ تشغيل OCR العربي ara...";
        }

        const result =
            await recognizeArabicImage(
                sourceImage,
                message => {

                    if (
                        handwritingOcrStatus &&
                        message &&
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

                        handwritingOcrStatus.textContent =
                            progress !== null
                                ? `⏳ ${message.status} — ${progress}%`
                                : `⏳ ${message.status}`;
                    }
                }
            );

        const text =
            cleanArabicOcrText(
                result.text
            );

        handwritingOcrText =
            text;

        handwritingOcrReady =
            Boolean(
                text.trim()
            );

        handwritingOcrTextarea.value =
            text;

        if (!text) {

            handwritingOcrStatus.textContent =
                "⚠️ لم يتم العثور على نص موثوق. الكلمات منخفضة الثقة تم رفضها.";

            return;
        }

        handwritingOcrStatus.textContent =
            `✅ تم استخراج النص العربي. متوسط الثقة: ${Math.round(
                result.averageConfidence
            )}%.`;

        handwritingOcrPdfButton.disabled =
            false;

    } catch (error) {

        console.error(
            "ARABIC OCR ERROR:",
            error
        );

        handwritingOcrReady =
            false;

        handwritingOcrPdfButton.disabled =
            true;

        handwritingOcrStatus.textContent =
            "❌ تعذر تشغيل OCR العربي. تحقق من اتصال الإنترنت ثم حاول مرة أخرى.";

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
   HANDWRITING SETTINGS
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

                const pixels =
                    context.getImageData(
                        0,
                        0,
                        width,
                        height
                    );

                const data =
                    pixels.data;

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

                        const reduction =
                            yellow *
                            0.35 *
                            intensity;

                        r -=
                            reduction;

                        g -=
                            reduction;
                    }

                    const gray =
                        (
                            0.299 * r +
                            0.587 * g +
                            0.114 * b
                        );

                    if (
                        handwritingSettings.grayscale
                    ) {

                        r =
                            gray;

                        g =
                            gray;

                        b =
                            gray;
                    }

                    r +=
                        brightness;

                    g +=
                        brightness;

                    b +=
                        brightness;

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

                    if (
                        handwritingSettings.denoise
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
                            ) <
                            threshold
                        ) {

                            r =
                                average;
                        }

                        if (
                            Math.abs(
                                g -
                                average
                            ) <
                            threshold
                        ) {

                            g =
                                average;
                        }

                        if (
                            Math.abs(
                                b -
                                average
                            ) <
                            threshold
                        ) {

                            b =
                                average;
                        }
                    }

                    data[i] =
                        clampColor(
                            r
                        );

                    data[i + 1] =
                        clampColor(
                            g
                        );

                    data[i + 2] =
                        clampColor(
                            b
                        );
                }

                context.putImageData(
                    pixels,
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
        }
    );
}


/* ==========================================
   ENHANCE BUTTON
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

                handwritingEnhancedImage =
                    await enhanceHandwritingImage(
                        handwritingOriginalImage
                    );

                showHandwritingPreview(
                    handwritingEnhancedImage
                );

                ensureHandwritingOcrInterface();

                handwritingOcrTextarea.value =
                    "";

                handwritingOcrText =
                    "";

                handwritingOcrReady =
                    false;

                handwritingOcrPdfButton.disabled =
                    true;

                handwritingOcrStatus.textContent =
                    "✅ تم تحسين الصورة. اضغط «استخراج النص العربي».";

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

                handwritingOcrStatus.textContent =
                    "⚠️ تعذر التحسين. يمكنك استخدام الصورة الأصلية.";

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
   CREATE HANDWRITING DIGITAL PDF
========================================== */

if (createHandwritingPdf) {

    createHandwritingPdf.addEventListener(
        "click",
        async () => {

            ensureHandwritingOcrInterface();

            let text =
                handwritingOcrTextarea
                    ? handwritingOcrTextarea.value.trim()
                    : handwritingOcrText.trim();

            /*
             * لا ننشئ PDF إذا لم توجد نتيجة OCR.
             * ولا نضع الصورة كبديل صامت.
             */

            if (!text) {

                await runHandwritingOCR();

                text =
                    handwritingOcrTextarea
                        ? handwritingOcrTextarea.value.trim()
                        : handwritingOcrText.trim();
            }

            if (!text) {

                alert(
                    "لم يتم استخراج نص موثوق من الصورة."
                );

                return;
            }

            handwritingOcrText =
                cleanArabicOcrText(
                    text
                );

            const originalText =
                setButtonLoading(
                    createHandwritingPdf,
                    "⏳ جاري إنشاء PDF نصي..."
                );

            try {

                await createRealArabicTextPdf(
                    handwritingOcrText,
                    "WebBag-Handwriting-Digital"
                );

                handwritingOcrStatus.textContent =
                    "✅ تم إنشاء PDF نصي رقمي من النص المستخرج.";

            } catch (error) {

                console.error(
                    "DIGITAL HANDWRITING PDF ERROR:",
                    error
                );

                alert(
                    "حدث خطأ أثناء إنشاء PDF الرقمي."
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


/* ==========================================
   CREATE OCR TEXT PDF
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
        cleanArabicOcrText(
            text
        );

    const originalText =
        setButtonLoading(
            handwritingOcrPdfButton,
            "⏳ جاري إنشاء PDF..."
        );

    try {

        await createRealArabicTextPdf(
            handwritingOcrText,
            "WebBag-Handwriting-Digital"
        );

        handwritingOcrStatus.textContent =
            "✅ تم إنشاء PDF من النص الرقمي المصحح.";

    } catch (error) {

        console.error(
            "HANDWRITING TEXT PDF ERROR:",
            error
        );

        alert(
            "تعذر إنشاء PDF من النص الرقمي."
        );

    } finally {

        restoreButton(
            handwritingOcrPdfButton,
            originalText
        );
    }
}


/* ==========================================
   OPTIONAL MANUAL CONTROLS
========================================== */

function setHandwritingBrightness(value) {

    handwritingSettings.brightness =
        Number(value) || 0;
}


function setHandwritingContrast(value) {

    handwritingSettings.contrast =
        Number(value) || 1;
}


function setHandwritingIntensity(value) {

    handwritingSettings.intensity =
        clamp(
            Number(value) || 0,
            0,
            1
        );
}


function setHandwritingGrayscale(value) {

    handwritingSettings.grayscale =
        Boolean(value);
}


function setHandwritingRemoveYellow(value) {

    handwritingSettings.removeYellow =
        Boolean(value);
}


function setHandwritingDenoise(value) {

    handwritingSettings.denoise =
        Boolean(value);
}


function setHandwritingSharpen(value) {

    handwritingSettings.sharpen =
        Boolean(value);
}


/* ==========================================
   REAPPLY ENHANCEMENT
========================================== */

async function reapplyHandwritingEnhancement() {

    if (!handwritingOriginalImage) {
        return;
    }

    try {

        handwritingEnhancedImage =
            await enhanceHandwritingImage(
                handwritingOriginalImage
            );

        showHandwritingPreview(
            handwritingEnhancedImage
        );

        ensureHandwritingOcrInterface();

        handwritingOcrText =
            "";

        handwritingOcrTextarea.value =
            "";

        handwritingOcrReady =
            false;

        handwritingOcrPdfButton.disabled =
            true;

        handwritingOcrStatus.textContent =
            "تم تحديث الصورة. شغّل OCR مرة أخرى.";

    } catch (error) {

        console.error(
            "REAPPLY HANDWRITING ERROR:",
            error
        );
    }
}


/* ==========================================
   RESTORE ORIGINAL
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

    handwritingOcrTextarea.value =
        "";

    handwritingOcrPdfButton.disabled =
        true;

    handwritingOcrStatus.textContent =
        "↩️ تم إرجاع الصورة الأصلية.";

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
}


/* ==========================================
   OPTIONAL RESET BUTTON
========================================== */

const resetHandwriting =
    $("resetHandwriting");

if (resetHandwriting) {

    resetHandwriting.addEventListener(
        "click",
        () => {

            resetHandwritingInterface();

        }
    );
}


/* ==========================================
   OPTIONAL CONTROLS
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
   OPTIONAL PDF HELPERS
========================================== */

function loadPdfImage(dataUrl) {

    return loadImage(
        dataUrl
    );
}


function getImageFormat(file) {

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
   GLOBAL RESET BUTTON
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
   INITIAL STATE
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
            true;
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

    recognizeArabicImage,

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

    analyzePdfContent,

    runHandwritingOCR,

    createHandwritingTextPdf,

    prepareImageForOCR,

    cleanArabicOcrText,

    normalizeArabicRTL,

    buildTextFromOcrWords,

    filterOcrWords,

    isUsefulOcrWord,

    isValidPdf,

    isValidImage
};


/* ==========================================
   END OF WebBag PDF AI
========================================== */
