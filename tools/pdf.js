/* =========================================================
   WebBag PDF AI
   pdf.js — Complete PDF Module
   متوافق مع HTML الحالي
========================================================= */

"use strict";


/* =========================================================
   1. عناصر واجهة PDF
========================================================= */

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


/* =========================================================
   2. عناصر إنشاء PDF من النص
========================================================= */

const textToPdfInput =
    document.getElementById("textToPdfInput");

const createTextPdf =
    document.getElementById("createTextPdf");


/* =========================================================
   3. عناصر إنشاء PDF من الصور
========================================================= */

const imagesToPdfInput =
    document.getElementById("imagesToPdfInput");

const imagesPreview =
    document.getElementById("imagesPreview");

const createImagesPdf =
    document.getElementById("createImagesPdf");


/* =========================================================
   4. عناصر صورة الخط اليدوي
========================================================= */

const handwritingImageInput =
    document.getElementById("handwritingImageInput");

const handwritingPreview =
    document.getElementById("handwritingPreview");

const enhanceHandwriting =
    document.getElementById("enhanceHandwriting");

const createHandwritingPdf =
    document.getElementById("createHandwritingPdf");


/* =========================================================
   5. حالة الأداة
========================================================= */

let selectedPdfFile = null;

let extractedPdfText = "";

let selectedImages = [];

let handwritingOriginalImage = null;

let handwritingEnhancedImage = null;

let pdfReaderPromise = null;


/* =========================================================
   6. أدوات مساعدة عامة
========================================================= */

function setPdfStatus(message) {

    if (pdfStatus) {
        pdfStatus.textContent = message;
    }

}


function setPdfText(message) {

    if (pdfText) {
        pdfText.textContent = message;
    }

}


function showPdfPlaceholder(message) {

    if (pdfText) {

        pdfText.innerHTML = `
            <p class="pdf-placeholder">
                ${escapeHtml(message)}
            </p>
        `;

    }

}


function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function clampColor(value) {

    return Math.max(
        0,
        Math.min(
            255,
            value
        )
    );

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


function isValidImage(file) {

    if (!file) {
        return false;
    }

    return (
        typeof file.type === "string" &&
        file.type.startsWith("image/")
    );

}


/* =========================================================
   7. التحقق من مكتبة jsPDF
========================================================= */

function getJsPDF() {

    if (
        window.jspdf &&
        window.jspdf.jsPDF
    ) {

        return window.jspdf.jsPDF;

    }

    throw new Error(
        "مكتبة jsPDF غير محملة."
    );

}


/* =========================================================
   8. التحقق من html2canvas
========================================================= */

function getHtml2Canvas() {

    if (
        typeof window.html2canvas ===
        "function"
    ) {

        return window.html2canvas;

    }

    throw new Error(
        "مكتبة html2canvas غير محملة."
    );

}


/* =========================================================
   9. تحميل PDF.js
========================================================= */

function loadPdfReader() {

    if (pdfReaderPromise) {
        return pdfReaderPromise;
    }


    pdfReaderPromise =
        new Promise(
            (resolve, reject) => {

                if (window.pdfjsLib) {

                    configurePdfWorker();

                    resolve(
                        window.pdfjsLib
                    );

                    return;

                }


                const existingScript =
                    document.querySelector(
                        'script[data-webbag-pdfjs="true"]'
                    );


                if (existingScript) {

                    existingScript.addEventListener(
                        "load",
                        () => {

                            if (!window.pdfjsLib) {

                                reject(
                                    new Error(
                                        "تم تحميل PDF.js ولكن المكتبة غير متاحة."
                                    )
                                );

                                return;

                            }

                            configurePdfWorker();

                            resolve(
                                window.pdfjsLib
                            );

                        },
                        {
                            once: true
                        }
                    );


                    existingScript.addEventListener(
                        "error",
                        () => {

                            reject(
                                new Error(
                                    "تعذر تحميل PDF.js."
                                )
                            );

                        },
                        {
                            once: true
                        }
                    );


                    return;

                }


                const script =
                    document.createElement(
                        "script"
                    );


                script.dataset.webbagPdfjs =
                    "true";


                script.src =
                    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";


                script.async = true;


                script.onload =
                    () => {

                        if (!window.pdfjsLib) {

                            reject(
                                new Error(
                                    "PDF.js loaded but is unavailable."
                                )
                            );

                            return;

                        }

                        configurePdfWorker();

                        resolve(
                            window.pdfjsLib
                        );

                    };


                script.onerror =
                    () => {

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


/* =========================================================
   10. إعداد PDF Worker
========================================================= */

function configurePdfWorker() {

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
   11. قراءة PDF
========================================================= */

async function readPdfFile(file) {

    if (!isValidPdf(file)) {

        throw new Error(
            "الملف المختار ليس ملف PDF صالحًا."
        );

    }


    const pdfjs =
        await loadPdfReader();


    const arrayBuffer =
        await file.arrayBuffer();


    if (!arrayBuffer || !arrayBuffer.byteLength) {

        throw new Error(
            "تعذر قراءة بيانات ملف PDF."
        );

    }


    const loadingTask =
        pdfjs.getDocument({
            data: arrayBuffer
        });


    const pdf =
        await loadingTask.promise;


    if (!pdf) {

        throw new Error(
            "تعذر فتح ملف PDF."
        );

    }


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


        const items =
            Array.isArray(content.items)
                ? content.items
                : [];


        const pageText =
            items
                .map(item => {

                    if (
                        item &&
                        typeof item.str ===
                        "string"
                    ) {

                        return item.str;

                    }

                    return "";

                })
                .join(" ")
                .replace(/\s+/g, " ")
                .trim();


        fullText +=
            `\n\n--- الصفحة ${pageNumber} ---\n\n`;


        fullText +=
            pageText ||
            "[لا يوجد نص قابل للاستخراج في هذه الصفحة]";

    }


    extractedPdfText =
        fullText.trim();


    if (!extractedPdfText) {

        setPdfStatus(
            "⚠️ لم يتم العثور على نص داخل الملف."
        );

        showPdfPlaceholder(
            "يبدو أن الملف عبارة عن صور ممسوحة ضوئيًا أو لا يحتوي على نص قابل للاستخراج."
        );

        return;

    }


    if (pdfText) {

        pdfText.textContent =
            extractedPdfText;

    }


    setPdfStatus(
        `✅ تم استخراج النص من ${pdf.numPages} صفحة.`
    );


    if (copyPdfText) {
        copyPdfText.disabled = false;
    }


    if (summarizePdf) {
        summarizePdf.disabled = false;
    }

}


/* =========================================================
   12. اختيار PDF
========================================================= */

if (pdfFileInput) {

    pdfFileInput.addEventListener(
        "change",
        async function () {

            const file =
                this.files &&
                this.files.length
                    ? this.files[0]
                    : null;


            if (!file) {
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


            if (summarizePdf) {
                summarizePdf.disabled = true;
            }


            if (copyPdfText) {
                copyPdfText.disabled = true;
            }


            if (pdfSummary) {

                pdfSummary.innerHTML = `
                    <p class="pdf-placeholder">
                        سيظهر الملخص هنا بعد قراءة الملف.
                    </p>
                `;

            }


            if (!isValidPdf(file)) {

                setPdfStatus(
                    "❌ يرجى اختيار ملف PDF صالح."
                );


                showPdfPlaceholder(
                    "الملف المختار ليس ملف PDF صالحًا."
                );


                this.value = "";

                selectedPdfFile =
                    null;

                return;

            }


            setPdfStatus(
                "⏳ جارٍ تجهيز ملف PDF..."
            );


            showPdfPlaceholder(
                "جارٍ قراءة الملف..."
            );


            try {

                await readPdfFile(
                    file
                );

            } catch (error) {

                console.error(
                    "PDF READ ERROR:",
                    error
                );


                setPdfStatus(
                    "❌ حدث خطأ أثناء قراءة ملف PDF."
                );


                showPdfPlaceholder(
                    "تعذر قراءة هذا الملف. تأكد أن الملف PDF صالح وغير تالف."
                );

            }

        }
    );

}


/* =========================================================
   13. نسخ نص PDF
========================================================= */

if (copyPdfText) {

    copyPdfText.addEventListener(
        "click",
        async function () {

            if (!extractedPdfText) {
                return;
            }


            const originalText =
                copyPdfText.textContent;


            try {

                if (
                    navigator.clipboard &&
                    typeof navigator.clipboard.writeText ===
                    "function"
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

            }

        }
    );

}


/* =========================================================
   14. تلخيص PDF
========================================================= */

if (summarizePdf) {

    summarizePdf.addEventListener(
        "click",
        function () {

            if (!extractedPdfText) {
                return;
            }


            if (!pdfSummary) {
                return;
            }


            const text =
                extractedPdfText
                    .replace(
                        /--- الصفحة \d+ ---/g,
                        ""
                    )
                    .replace(
                        /\s+/g,
                        " "
                    )
                    .trim();


            if (!text) {

                pdfSummary.innerHTML = `
                    <p>
                        ⚠️ لا يوجد نص كافٍ لإنشاء ملخص.
                    </p>
                `;

                return;

            }


            /*
             * ملخص محلي بسيط وآمن.
             * لا يحتاج API.
             */

            const sentences =
                text
                    .split(
                        /(?<=[.!؟?])\s+/
                    )
                    .filter(Boolean);


            let summaryText = "";


            if (sentences.length <= 5) {

                summaryText =
                    sentences.join(" ");

            } else {

                summaryText =
                    sentences
                        .slice(0, 5)
                        .join(" ");

            }


            pdfSummary.innerHTML = `
                <p>
                    <strong>ملخص أولي:</strong>
                </p>

                <p>
                    ${escapeHtml(summaryText)}
                </p>

                <p>
                    📌 هذا ملخص محلي أولي للنص المستخرج.
                </p>
            `;

        }
    );

}


/* =========================================================
   15. مسح PDF
========================================================= */

if (clearPdf) {

    clearPdf.addEventListener(
        "click",
        function () {

            resetPdfInterface();

        }
    );

}


/* =========================================================
   16. إعادة ضبط واجهة PDF
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
   17. TEXT → PDF
========================================================= */

if (
    createTextPdf &&
    textToPdfInput
) {

    createTextPdf.addEventListener(
        "click",
        async function () {

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


            createTextPdf.disabled =
                true;


            createTextPdf.textContent =
                "⏳ جارٍ إنشاء PDF...";


            let container =
                null;


            try {

                const jsPDF =
                    getJsPDF();


                const html2canvas =
                    getHtml2Canvas();


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


                if (
                    document.fonts &&
                    document.fonts.ready
                ) {

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


                if (
                    !canvas ||
                    !canvas.width ||
                    !canvas.height
                ) {

                    throw new Error(
                        "تعذر إنشاء صورة النص."
                    );

                }


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
                        (pageHeight -
                            imageHeight) /
                        2;


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

        }
    );

}


/* =========================================================
   18. اختيار الصور
========================================================= */

if (imagesToPdfInput) {

    imagesToPdfInput.addEventListener(
        "change",
        function () {

            selectedImages =
                Array.from(
                    this.files || []
                )
                .filter(
                    file =>
                        isValidImage(file)
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


            renderImagesPreview();


            if (createImagesPdf) {

                createImagesPdf.disabled =
                    false;

            }

        }
    );

}


/* =========================================================
   19. معاينة الصور
========================================================= */

function renderImagesPreview() {

    if (!imagesPreview) {
        return;
    }


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


/* =========================================================
   20. IMAGE → PDF
========================================================= */

if (createImagesPdf) {

    createImagesPdf.addEventListener(
        "click",
        async function () {

            if (!selectedImages.length) {

                alert(
                    "من فضلك اختر صورة واحدة على الأقل."
                );

                return;

            }


            const originalText =
                createImagesPdf.textContent;


            createImagesPdf.disabled =
                true;


            createImagesPdf.textContent =
                "⏳ جارٍ إنشاء PDF...";


            try {

                const jsPDF =
                    getJsPDF();


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
                        (pageWidth -
                            finalWidth) /
                        2;


                    const y =
                        (pageHeight -
                            finalHeight) /
                        2;


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

        }
    );

}


/* =========================================================
   21. تحويل صورة إلى JPEG
========================================================= */

function convertImageToJpeg(file) {

    return new Promise(
        (resolve, reject) => {

            if (!isValidImage(file)) {

                reject(
                    new Error(
                        "الملف ليس صورة صالحة."
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
                                        "تعذر قراءة أبعاد الصورة."
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

                            } catch (error) {

                                reject(error);

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


/* =========================================================
   22. تحميل صورة من Data URL
========================================================= */

function loadImage(dataUrl) {

    return new Promise(
        (resolve, reject) => {

            if (!dataUrl) {

                reject(
                    new Error(
                        "بيانات الصورة غير موجودة."
                    )
                );

                return;

            }


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


/* =========================================================
   23. اختيار صورة الخط اليدوي
========================================================= */

if (handwritingImageInput) {

    handwritingImageInput.addEventListener(
        "change",
        function () {

            const file =
                this.files &&
                this.files.length
                    ? this.files[0]
                    : null;


            handwritingOriginalImage =
                null;


            handwritingEnhancedImage =
                null;


            if (!file) {

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


            if (!isValidImage(file)) {

                alert(
                    "من فضلك اختر ملف صورة صالح."
                );


                this.value =
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
   24. عرض صورة الخط اليدوي
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
   25. تحسين صورة الخط اليدوي
========================================================= */

if (enhanceHandwriting) {

    enhanceHandwriting.addEventListener(
        "click",
        async function () {

            if (!handwritingOriginalImage) {

                alert(
                    "من فضلك اختر صورة أولاً."
                );

                return;

            }


            const originalText =
                enhanceHandwriting.textContent;


            enhanceHandwriting.disabled =
                true;


            enhanceHandwriting.textContent =
                "⏳ جارٍ تحسين الورقة...";


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
                    "تعذر تحسين الصورة. تم الاحتفاظ بالصورة الأصلية."
                );


            } finally {

                setTimeout(
                    () => {

                        if (
                            enhanceHandwriting
                        ) {

                            enhanceHandwriting.disabled =
                                false;


                            enhanceHandwriting.textContent =
                                originalText;

                        }

                    },
                    1500
                );

            }

        }
    );

}


/* =========================================================
   26. تحسين صورة الخط اليدوي محليًا
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


                        const imagePixels =
                            context.getImageData(
                                0,
                                0,
                                width,
                                height
                            );


                        const data =
                            imagePixels.data;


                        /*
                         * تحسين آمن:
                         * - رفع التباين
                         * - تحسين السطوع قليلًا
                         * - الحفاظ على الألوان
                         */

                        const contrast =
                            1.22;


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
                            imagePixels,
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

                        reject(error);

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
   27. تحويل صورة الخط اليدوي إلى PDF
========================================================= */

if (createHandwritingPdf) {

    createHandwritingPdf.addEventListener(
        "click",
        async function () {

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

                const jsPDF =
                    getJsPDF();


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


/* =========================================================
   28. أدوات صور إضافية
========================================================= */

function readImageFile(file) {

    return new Promise(
        (resolve, reject) => {

            if (!isValidImage(file)) {

                reject(
                    new Error(
                        "الملف ليس صورة."
                    )
                );

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                () => {

                    resolve(
                        reader.result
                    );

                };


            reader.onerror =
                () => {

                    reject(
                        new Error(
                            "تعذر قراءة الصورة."
                        )
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


function loadPdfImage(dataUrl) {

    return loadImage(
        dataUrl
    );

}


function getImageFormat(file) {

    if (
        file &&
        typeof file.type ===
        "string"
    ) {

        const type =
            file.type.toLowerCase();


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


        if (
            type.includes("jpeg") ||
            type.includes("jpg")
        ) {

            return "JPEG";

        }

    }


    return "JPEG";

}


/* =========================================================
   29. حالة الجاهزية
========================================================= */

if (pdfStatus) {

    pdfStatus.textContent =
        "✅ أداة PDF AI جاهزة.";

}


/* =========================================================
   نهاية pdf.js
========================================================= */
