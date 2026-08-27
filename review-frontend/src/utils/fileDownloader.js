/**
 * Universal safe file downloader:
 * Fetches original files as blobs and initiates real browser downloads directly to disk.
 */
export const downloadFile = async (fileUrl, customFileName = null) => {
  if (!fileUrl) return;

  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

  // Extract or generate filename
  let fileName = customFileName;
  if (!fileName) {
    const pathPart = fileUrl.split('?')[0];
    fileName = pathPart.substring(pathPart.lastIndexOf('/') + 1) || 'download';
  }

  // Use backend proxy endpoint which sends Content-Disposition: attachment header
  const proxyUrl = `${API_BASE}api/tasks/download_file.php?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(fileName)}`;

  // Create temporary hidden anchor to trigger native save
  const link = document.createElement('a');
  link.href = proxyUrl;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
