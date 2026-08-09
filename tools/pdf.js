/* =========================================================
   WebBag PDF AI
   PDF TOOL — COMPLETE STABLE VERSION
   ========================================================= */


/* =========================================================
   1. PDF READER ELEMENTS
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


let selectedPdfFile = null;
let extractedPdfText = "";


/* =========================================================
   2. PDF.JS LOADER
   ========================================================= */

let pdfReaderPromise = null;


function loadPdfReader() {

    if (pdfReaderPromise) {
        return pdfReaderPromise;
    }

    pdfReaderPromise =
        new Promise((resolve, reject) => {

            if (window.pdfjsLib) {

                try {

                    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

                } catch (error) {
                    console.warn(error);
                }

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


                window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


                resolve(window.pdfjsLib);

            };


            script.onerror = () => {

                reject(
                    new Error(
                        "Unable to load PDF.js."
                    )
                );

            };


            document.head.appendChild(script);

        });


    return pdfReaderPromise;
}


/* =========================================================
   3. PDF VALIDATION
   ========================================================= */

function isValidPdf(file) {

    if (!file) {
        return false;
    }


    return (
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );
}


/* =========================================================
   4. PDF ERROR DISPLAY
   ========================================================= */

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


/* =========================================================
   5. ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   6. READ PDF
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
            "⏳ جاري قراءة ملف PDF...";

    }


    if (pdfText) {

        pdfText.innerHTML = `
            <p class="pdf-placeholder">
                ⏳ جاري قراءة صفحات الملف...
            </p>
        `;

    }


    const pdfjs =
        await loadPdfReader();


    const arrayBuffer =
        await file.arrayBuffer();


    const loadingTask =
        pdfjs.getDocument({
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
                `⏳ جاري قراءة الصفحة ${pageNumber} من ${pdf.numPages}...`;

        }


        const page =
            await pdf.getPage(pageNumber);


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
                    أو أن النص غير قابل للاستخراج مباشرة.
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
        copyPdfText.disabled = false;
    }


    if (summarizePdf) {
        summarizePdf.disabled = false;
    }

}


/* =========================================================
   7. PDF FILE SELECTION
   ========================================================= */

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


                pdfFileInput.value = "";


                return;

            }


            selectedPdfFile =
                file;


            if (pdfFileName) {

                pdfFileName.textContent =
                    `📄 ${file.name}`;

            }


            if (pdfStatus) {

                pdfStatus.textContent =
                    "⏳ جاري تجهيز ملف PDF...";

            }


            if (pdfText) {

                pdfText.innerHTML = `
                    <p class="pdf-placeholder">
                        جاري قراءة الملف...
                    </p>
                `;

            }


            extractedPdfText =
                "";


            if (summarizePdf) {
                summarizePdf.disabled = true;
            }


            if (copyPdfText) {
                copyPdfText.disabled = true;
            }


            try {

                await readPdfFile(file);

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


/* =========================================================
   8. COPY PDF TEXT
   ========================================================= */

if (copyPdfText) {

    copyPdfText.addEventListener(
        "click",
        async () => {

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
   9. PDF SUMMARY
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


            const words =
                extractedPdfText
                    .replace(
                        /--- الصفحة \d+ ---/g,
                        ""
                    )
                    .split(/\s+/)
                    .filter(Boolean);


            const totalWords =
                words.length;


            const preview =
                words
                    .slice(0, 180)
                    .join(" ");


            pdfSummary.innerHTML = `

                <p>
                    <strong>تمت قراءة الملف بنجاح.</strong>
                </p>

                <p>
                    عدد الكلمات المستخرجة تقريبًا:
                    <strong>${totalWords}</strong>
                </p>

                <hr>

                <p>
                    <strong>معاينة المحتوى:</strong>
                </p>

                <p>
                    ${escapeHtml(preview)}
                    ${totalWords > 180 ? "..." : ""}
                </p>

                <p class="pdf-summary-note">
                    التلخيص الذكي الكامل يمكن ربطه لاحقًا
                    بمحرك الذكاء الاصطناعي الخاص بـ WebBag.
                </p>

            `;

        }
    );

}


/* =========================================================
   10. CLEAR PDF
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
   11. RESET PDF INTERFACE
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
   12. TEXT → PDF
   ========================================================= */

const textToPdfInput =
    document.getElementById("textToPdfInput");

const createTextPdf =
    document.getElementById("createTextPdf");


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


            createTextPdf.disabled =
                true;


            createTextPdf.textContent =
                "⏳ جارٍ إنشاء PDF...";


            let container =
                null;


            try {

                if (!window.jspdf) {

                    throw new Error(
                        "jsPDF غير محمل."
                    );

                }


                if (!window.html2canvas) {

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


                await wait(100);


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
                            "تعذر إنشاء Canvas للصفحة."
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
   13. IMAGES → PDF
   ========================================================= */

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


if (imagesToPdfInput) {

    imagesToPdfInput.addEventListener(
        "change",
        () => {

            selectedImages =
                Array.from(
                    imagesToPdfInput.files || []
                ).filter(
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


/* =========================================================
   14. CREATE IMAGES PDF
   ========================================================= */

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
                createImagesPdf.textContent;


            createImagesPdf.disabled =
                true;


            createImagesPdf.textContent =
                "⏳ جارٍ إنشاء PDF...";


            try {

                if (!window.jspdf) {

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


                    createImagesPdf.textContent =
                        `⏳ تجهيز الصورة ${i + 1} من ${selectedImages.length}...`;


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


                    if (!width || !height) {

                        throw new Error(
                            "تعذر قراءة أبعاد الصورة."
                        );

                    }


                    const ratio =
                        width / height;


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
   15. HANDWRITING IMAGE → PDF
   ========================================================= */

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


/* =========================================================
   16. HANDWRITING IMAGE SELECTION
   ========================================================= */

if (handwritingImageInput) {

    handwritingImageInput.addEventListener(
        "change",
        () => {

            const file =
                handwritingImageInput.files &&
                handwritingImageInput.files[0];


            handwritingEnhancedImage =
                null;


            if (!file) {

                handwritingOriginalImage =
                    null;


                if (handwritingPreview) {

                    handwritingPreview.textContent =
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
   17. HANDWRITING PREVIEW
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


    image.style.objectFit =
        "contain";


    handwritingPreview.appendChild(
        image
    );

}


/* =========================================================
   18. HANDWRITING ENHANCEMENT
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
                enhanceHandwriting.textContent;


            enhanceHandwriting.disabled =
                true;


            if (createHandwritingPdf) {

                createHandwritingPdf.disabled =
                    true;

            }


            enhanceHandwriting.textContent =
                "⏳ جاري تحسين الورقة...";


            try {

                await wait(50);


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


                if (createHandwritingPdf) {

                    createHandwritingPdf.disabled =
                        false;

                }


                await wait(1500);

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
                    "تعذر تحسين الصورة. سيتم الاحتفاظ بالصورة الأصلية."
                );

            } finally {

                enhanceHandwriting.disabled =
                    false;


                enhanceHandwriting.textContent =
                    originalText;


                if (createHandwritingPdf) {

                    createHandwritingPdf.disabled =
                        !handwritingOriginalImage;

                }

            }

        }
    );

}


/* =========================================================
   19. LOCAL HANDWRITING ENHANCEMENT
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


                        if (!width || !height) {

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
                         * تحسين الورقة:
                         * زيادة بسيطة للتباين
                         * مع المحافظة على الصورة
                         * وعدم استخدام API خارجي.
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
   20. COLOR CLAMP
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
   21. HANDWRITING IMAGE → PDF
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
                createHandwritingPdf.textContent;


            createHandwritingPdf.disabled =
                true;


            createHandwritingPdf.textContent =
                "⏳ جاري إنشاء PDF...";


            try {

                if (!window.jspdf) {

                    throw new Error(
                        "jsPDF غير محمل."
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


                if (!width || !height) {

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
                    width / height;


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
                    !handwritingOriginalImage;


                createHandwritingPdf.textContent =
                    originalText;

            }

        }
    );

}


/* =========================================================
   22. LOAD HANDWRITING IMAGE
   ========================================================= */

function loadHandwritingImage(
    imageData
) {

    return new Promise(
        (resolve, reject) => {

            const image =
                new Image();


            image.onload =
                () => resolve(image);


            image.onerror =
                () =>
                    reject(
                        new Error(
                            "تعذر تحميل الصورة."
                        )
                    );


            image.src =
                imageData;

        }
    );

}


/* =========================================================
   23. GENERIC IMAGE LOADER
   ========================================================= */

function loadImage(
    dataUrl
) {

    return new Promise(
        (resolve, reject) => {

            const image =
                new Image();


            image.onload =
                () => resolve(image);


            image.onerror =
                () =>
                    reject(
                        new Error(
                            "تعذر تحميل بيانات الصورة."
                        )
                    );


            image.src =
                dataUrl;

        }
    );

}


/* =========================================================
   24. IMAGE → JPEG
   ========================================================= */

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

                                    throw new Error(
                                        "تعذر إنشاء Canvas."
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
                        () =>
                            reject(
                                new Error(
                                    "تعذر تحميل الصورة."
                                )
                            );


                    image.src =
                        event.target.result;

                };


            reader.onerror =
                () =>
                    reject(
                        new Error(
                            "تعذر قراءة ملف الصورة."
                        )
                    );


            reader.readAsDataURL(
                file
            );

        }
    );

}


/* =========================================================
   25. IMAGE HELPERS
   ========================================================= */

function readImageFile(
    file
) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                () =>
                    resolve(
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


function loadPdfImage(
    dataUrl
) {

    return new Promise(
        (resolve, reject) => {

            const image =
                new Image();


            image.onload =
                () =>
                    resolve(
                        image
                    );


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

    if (!file || !file.type) {
        return "JPEG";
    }


    const type =
        file.type.toLowerCase();


    if (type.includes("png")) {
        return "PNG";
    }


    if (type.includes("webp")) {
        return "WEBP";
    }


    return "JPEG";

}


/* =========================================================
   26. WAIT HELPER
   ========================================================= */

function wait(
    milliseconds
) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
    );

}


/* =========================================================
   27. INITIAL PDF STATE
   ========================================================= */

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


/* =========================================================
   PDF TOOL READY
   ========================================================= */

console.log(
    "✅ WebBag PDF AI loaded successfully."
);
