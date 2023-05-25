export function Export2Word(
  title: string,
  element: HTMLElement,
  filename: string
) {
  const header =
    "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
    "xmlns:w='urn:schemas-microsoft-com:office:word' " +
    "xmlns='http://www.w3.org/TR/REC-html40'>" +
    "<head><meta charset='utf-8'><title>" +
    title +
    "</title></head><body>";
  const footer = "</body></html>";
  const sourceHTML = header + element.innerHTML + footer;

  const source =
    "data:application/vnd.ms-word;charset=utf-8," +
    encodeURIComponent(sourceHTML);

  const fileDownload = document.createElement("a");

  document.body.appendChild(fileDownload);

  fileDownload.href = source;
  fileDownload.download = filename;
  fileDownload.click();

  document.body.removeChild(fileDownload);
}
