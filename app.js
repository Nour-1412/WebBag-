const { jsPDF } = window.jspdf;

const textInput = document.getElementById("textInput");
const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const previewList = document.getElementById("previewList");
const generateBtn = document.getElementById("generateBtn");
const themeToggle = document.getElementById("themeToggle");

let files = [];

new Sortable(previewList, {
  animation: 150
});

themeToggle.onclick = () => {
  document.body.classList.toggle("dark");
};

dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  addFiles([...e.dataTransfer.files]);
});

fileInput.addEventListener("change", () => {
  addFiles([...fileInput.files]);
});

function addFiles(newFiles) {
  files.push(...newFiles);
  renderFiles();
}

function renderFiles() {
  previewList.innerHTML = "";

  files.forEach((file, index) => {

    const item = document.createElement("div");
    item.className = "item";

    if (file.type.startsWith("image")) {

      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);

      item.appendChild(img);

    } else {

      const icon = document.createElement("div");
      icon.textContent = "📄 PDF";

      item.appendChild(icon);
    }

    const name = document.createElement("span");
    name.textContent = file.name;

    const remove = document.createElement("button");
    remove.textContent = "حذف";

    remove.onclick = () => {
      files.splice(index, 1);
      renderFiles();
    };

    item.append(name, remove);
    previewList.appendChild(item);
  });
}

async function compressImage(file) {

  return new Promise((resolve) => {

    const img = new Image();

    img.onload = () => {

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const maxWidth = 1200;
      const ratio = maxWidth / img.width;

      canvas.width = maxWidth;
      canvas.height = img.height * ratio;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };

    img.src = URL.createObjectURL(file);
  });
}

generateBtn.addEventListener("click", generatePDF);

async function generatePDF() {

  const pdf = new jsPDF();

  let firstPage = true;

  const text = textInput.value.trim();

  if (text) {

    const lines = pdf.splitTextToSize(text, 180);

    pdf.text(lines, 15, 20);

    firstPage = false;
  }

  for (const file of files) {

    if (file.type === "application/pdf") continue;

    const image = await compressImage(file);

    if (!firstPage) pdf.addPage();

    pdf.addImage(image, "JPEG", 10, 10, 190, 250);

    firstPage = false;
  }

  const bytes = pdf.output("arraybuffer");

  const mergedPdf = await PDFLib.PDFDocument.create();

  const createdPdf = await PDFLib.PDFDocument.load(bytes);

  const pages = await mergedPdf.copyPages(
    createdPdf,
    createdPdf.getPageIndices()
  );

  pages.forEach(page => mergedPdf.addPage(page));

  for (const file of files) {

    if (file.type !== "application/pdf") continue;

    const buffer = await file.arrayBuffer();

    const existing = await PDFLib.PDFDocument.load(buffer);

    const copied = await mergedPdf.copyPages(
      existing,
      existing.getPageIndices()
    );

    copied.forEach(page => mergedPdf.addPage(page));
  }

  const finalPdf = await mergedPdf.save();

  const blob = new Blob([finalPdf], {
    type: "application/pdf"
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = "webbag-document.pdf";

  link.click();

  URL.revokeObjectURL(url);
  }
