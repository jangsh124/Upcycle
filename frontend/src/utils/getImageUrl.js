export default function getImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("/uploads")) {
    return `http://localhost:5001${path}`;
  }
  return `http://localhost:5001/uploads/${path.replace(/^uploads\//, "")}`;
}