export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function validateAudioFile(file: File): string | null {
  // Check file type
  const validTypes = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a"];
  if (!validTypes.includes(file.type)) {
    return "Invalid file type. Please upload an MP3, WAV, or M4A file.";
  }
  
  // Check file size (25MB max)
  const maxSize = 25 * 1024 * 1024; // 25MB in bytes
  if (file.size > maxSize) {
    return "File size exceeds the 25MB limit.";
  }
  
  return null;
}
