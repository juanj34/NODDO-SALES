# Next.js Image Migration Guide

## Overview

Migrate from `<img>` tags to Next.js `<Image>` component for automatic optimization, lazy loading, and better performance.

## Benefits

- **Automatic optimization**: WebP/AVIF format conversion
- **Lazy loading**: Images load only when visible
- **Responsive images**: Automatic srcset generation
- **Better LCP**: Improved Largest Contentful Paint scores
- **Placeholder blur**: Smooth loading experience

---

## Files to Migrate (~20 files)

### Public Microsite (Priority: HIGH)
These are customer-facing and impact SEO/performance:

- [x] `src/app/sites/[slug]/page.tsx` - Hero image (SKIP - uses Ken Burns animation)
- [ ] `src/app/sites/[slug]/galeria/page.tsx` - Gallery images
- [ ] `src/app/sites/[slug]/galeria/[categoria]/page.tsx` - Category images
- [ ] `src/app/sites/[slug]/tipologias/page.tsx` - Tipología renders
- [ ] `src/app/sites/[slug]/explorar/page.tsx` - Fachada images
- [ ] `src/app/sites/[slug]/ubicacion/page.tsx` - Map/POI images
- [ ] `src/app/sites/[slug]/videos/page.tsx` - Video thumbnails
- [ ] `src/app/sites/[slug]/implantaciones/page.tsx` - Floor plans
- [ ] `src/app/sites/[slug]/avances/page.tsx` - Construction images
- [ ] `src/app/sites/[slug]/contacto/page.tsx` - Contact page images

### Dashboard (Priority: MEDIUM)
Internal admin panel - less critical:

- [ ] `src/app/(dashboard)/editor/[id]/galeria/page.tsx`
- [ ] `src/app/(dashboard)/editor/[id]/fachadas/page.tsx`
- [ ] `src/app/(dashboard)/editor/[id]/planos/page.tsx`
- [ ] `src/app/(dashboard)/editor/[id]/torres/page.tsx`
- [ ] `src/app/(dashboard)/editor/[id]/videos/page.tsx`
- [ ] `src/app/(dashboard)/editor/[id]/avances/page.tsx`

### Marketing (Priority: MEDIUM)
- [ ] `src/app/(marketing)/demo-confirmada/page.tsx`
- [ ] `src/app/(marketing)/layout.tsx`

### Platform Admin (Priority: LOW)
- [ ] `src/app/(platform-admin)/admin/proyectos/page.tsx`
- [ ] `src/app/(platform-admin)/admin/usuarios/page.tsx`

---

## Migration Pattern

### Before (img tag):
```tsx
<img
  src={tipologia.render_url}
  alt={tipologia.nombre}
  className="w-full h-full object-cover"
/>
```

### After (Next.js Image):
```tsx
import Image from "next/image";

<Image
  src={tipologia.render_url}
  alt={tipologia.nombre}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority={false}
  quality={90}
/>
```

---

## Common Patterns

### 1. Full-width/height (fill mode)
```tsx
<div className="relative w-full h-64">
  <Image
    src={url}
    alt="description"
    fill
    className="object-cover"
    sizes="100vw"
  />
</div>
```

### 2. Fixed dimensions
```tsx
<Image
  src={url}
  alt="description"
  width={800}
  height={600}
  className="rounded-lg"
  sizes="(max-width: 768px) 100vw, 800px"
/>
```

### 3. Priority (above the fold)
```tsx
<Image
  src={heroImage}
  alt="Hero"
  fill
  priority  // No lazy loading for hero images
  className="object-cover"
/>
```

### 4. Blur placeholder
```tsx
<Image
  src={url}
  alt="description"
  fill
  placeholder="blur"
  blurDataURL="data:image/..." // or generate with plaiceholder
  className="object-cover"
/>
```

---

## When NOT to Use Next.js Image

### ❌ Don't use Image for:

1. **Animated backgrounds with CSS animations**
   ```tsx
   // KEEP as <img> - Ken Burns animation on hero
   <img className="animate-[kenBurns_20s...]" />
   ```

2. **Images from external domains not in next.config.js**
   - Unsplash, Cloudinary, etc. require domain whitelist
   - Add to `next.config.js`:
   ```js
   images: {
     remotePatterns: [
       { protocol: 'https', hostname: 'images.unsplash.com' },
       { protocol: 'https', hostname: '*.supabase.co' },
     ],
   }
   ```

3. **SVG logos that need inline manipulation**
   ```tsx
   // KEEP as <img> or import as component
   <img src="/logo.svg" className="fill-current" />
   ```

4. **Images with custom onLoad handlers for critical timing**
   ```tsx
   // Might need <img> if onLoad timing is critical
   <img onLoad={() => window.dispatchEvent(...)} />
   ```

---

## Implementation Checklist

For each file:

1. **Import Image component**
   ```tsx
   import Image from "next/image";
   ```

2. **Wrap in relative container** (for fill mode)
   ```tsx
   <div className="relative w-full h-64">
     <Image fill ... />
   </div>
   ```

3. **Add sizes attribute** (critical for responsive)
   ```tsx
   sizes="(max-width: 768px) 100vw, 50vw"
   ```

4. **Consider priority** (for above-the-fold images)
   ```tsx
   priority={isHero || isAboveFold}
   ```

5. **Test loading behavior**
   - Check lighthouse score
   - Verify lazy loading works
   - Ensure images don't cause layout shift

---

## Next.js Image Configuration

Current `next.config.ts` likely needs:

```typescript
import type { NextConfig } from 'next';

const config: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-*.r2.dev', // Cloudflare R2
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
};

export default config;
```

---

## Testing

After migration:

1. **Lighthouse audit** - Check LCP improvement
2. **Network tab** - Verify WebP/AVIF delivery
3. **Lazy loading** - Scroll and check deferred loading
4. **Layout shift** - Ensure no CLS issues
5. **Mobile** - Test responsive srcset

---

## Priority Migration Order

1. **Galería pages** (high traffic, many images)
2. **Tipologías page** (renders are large)
3. **Explorar/Fachadas** (customer-facing)
4. **Dashboard editor pages** (internal, less critical)
5. **Admin pages** (lowest priority)

---

## Estimated Impact

- **Before**: ~500KB-2MB images, no lazy loading
- **After**: ~200KB-800KB WebP/AVIF, lazy loaded
- **LCP improvement**: 30-50% faster
- **Bundle impact**: +70KB (next/image)

---

## Resources

- [Next.js Image Docs](https://nextjs.org/docs/app/api-reference/components/image)
- [Image Optimization Guide](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Responsive Images](https://web.dev/responsive-images/)
