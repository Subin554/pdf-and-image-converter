// Convert Images to PDF
async function convertImagesToPdf() {
  const files = document.getElementById('imageInput').files;
  if (!files.length) {
    alert('Please select images first!');
    return;
  }

  const pdfDoc = await PDFLib.PDFDocument.create();

  for (let file of files) {
    const imageBytes = await file.arrayBuffer();
    const imageExt = file.type.split('/')[1];

    let pdfImage;
    if (imageExt === 'jpeg' || imageExt === 'jpg') {
      pdfImage = await pdfDoc.embedJpg(imageBytes);
    } else if (imageExt === 'png') {
      pdfImage = await pdfDoc.embedPng(imageBytes);
    }

    const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
    page.drawImage(pdfImage, { x: 0, y: 0, width: pdfImage.width, height: pdfImage.height });
  }

  const pdfBytes = await pdfDoc.save();
  const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
  const downloadLink = document.getElementById('downloadPdfLink');
  downloadLink.href = URL.createObjectURL(pdfBlob);
  downloadLink.style.display = 'inline-block';
}

// Convert PDF to Images
let images = [];

async function convertPdfToImages() {
  const file = document.getElementById('pdfInput').files[0];
  if (!file) {
    alert('Please select a PDF file first!');
    return;
  }

  const pdfData = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

  const imageOutput = document.getElementById('imageOutput');
  imageOutput.innerHTML = '';
  images = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;

    const img = document.createElement('img');
    img.src = canvas.toDataURL('image/png');

    const imageWrapper = document.createElement('div');
    imageWrapper.classList.add('image-wrapper');

    const downloadBtn = document.createElement('button');
    downloadBtn.classList.add('btn', 'download-btn');
    downloadBtn.innerText = 'Download';
    downloadBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = img.src;
      a.download = `page-${pageNum}.png`;
      a.click();
    };

    imageWrapper.appendChild(img);
    imageWrapper.appendChild(downloadBtn);
    imageOutput.appendChild(imageWrapper);

    images.push({ src: img.src, name: `page-${pageNum}.png` });
  }

  const downloadAllBtn = document.getElementById('downloadAllImagesBtn');
  downloadAllBtn.style.display = 'block';
}

// Download all images as a ZIP file
async function downloadAllImages() {
  const zip = new JSZip();
  const folder = zip.folder('images');

  images.forEach((image) => {
    const data = image.src.split(',')[1];
    folder.file(image.name, data, { base64: true });
  });

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'images.zip');
}
