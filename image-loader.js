export default function customImageLoader({ src, width, quality }) {
  // Handle Unsplash images
  if (src.includes('unsplash.com')) {
    return `${src}?w=${width}&q=${quality || 75}&fm=webp&fit=crop`
  }
  
  // Handle Cloudinary images
  if (src.includes('cloudinary.com')) {
    return src
  }
  
  // Handle Instagram CDN
  if (src.includes('cdninstagram.com')) {
    return src
  }
  
  // Handle local/relative images
  if (src.startsWith('/')) {
    return src
  }
  
  // Default: return as is
  return src
}