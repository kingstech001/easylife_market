export default function customImageLoader({ src, width, quality }) {
  // Handle Unsplash images - add width, quality, and format parameters
  if (src.includes("unsplash.com")) {
    return `${src}?w=${width}&q=${quality || 75}&fm=webp&fit=crop`
  }

  // Handle Cloudinary images - Cloudinary handles optimization server-side
  if (src.includes("cloudinary.com")) {
    return src
  }

  // Handle Instagram CDN - return as-is
  if (src.includes("cdninstagram.com")) {
    return src
  }

  // Handle local/relative images - Next.js will optimize these
  if (src.startsWith("/")) {
    return src
  }

  // Default: return URL as-is for any other external sources
  return src
}
