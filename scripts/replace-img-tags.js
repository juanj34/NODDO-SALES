#!/usr/bin/env node

/**
 * Batch replace <img> tags with Next.js <Image /> component
 * Skips files with eslint-disable comments for @next/next/no-img-element
 */

const fs = require("fs");
const path = require("path");
const { glob } = require("glob");

const srcDir = path.join(__dirname, "../src");

// Files to process (from grep results, excluding already processed and eslint-disabled)
const filesToProcess = [
  "components/site/VistaModal.tsx",
  "components/dashboard/HotspotEditor.tsx",
  "components/dashboard/FileUploader.tsx",
  "components/dashboard/FacadeHotspotEditor.tsx",
  "components/dashboard/AmenidadesEditor.tsx",
  "components/dashboard/PlanoHotspotEditor.tsx",
  "components/dashboard/UploadModal.tsx",
  "components/dashboard/projects/ProjectTableRow.tsx",
  "components/dashboard/home/EnhancedProjectCard.tsx",
  "components/site/SiteNav.tsx",
  "components/admin/GlobalSearch.tsx",
  "components/marketing/illustrations/HeroMockup.tsx",
  "app/(marketing)/recursos/page.tsx",
  "app/(marketing)/nosotros/page.tsx",
  "app/(marketing)/layout.tsx",
  "app/(marketing)/demo-confirmada/page.tsx",
  "app/(marketing)/casos-de-estudio/page.tsx",
  "app/(dashboard)/editor/[id]/vistas/page.tsx",
  "app/(dashboard)/editor/[id]/fachadas/page.tsx",
  "app/(dashboard)/editor/[id]/planos/page.tsx",
  "app/(dashboard)/editor/[id]/torres/page.tsx",
  "app/(dashboard)/editor/[id]/videos/page.tsx",
  "app/(dashboard)/editor/[id]/galeria/page.tsx",
  "app/(dashboard)/editor/[id]/avances/page.tsx",
  "app/(dashboard)/equipo/page.tsx",
  "app/(platform-admin)/admin/usuarios/page.tsx",
  "app/(platform-admin)/admin/moderacion/page.tsx",
  "app/(platform-admin)/admin/proyectos/page.tsx",
  "app/sites/[slug]/explorar/page.tsx",
  "app/sites/[slug]/videos/page.tsx",
  "app/sites/[slug]/ubicacion/page.tsx",
  "app/sites/[slug]/implantaciones/page.tsx",
  "app/sites/[slug]/galeria/page.tsx",
  "app/sites/[slug]/galeria/[categoria]/page.tsx",
  "app/sites/[slug]/contacto/page.tsx",
  "app/sites/[slug]/avances/page.tsx",
];

function processFile(filePath) {
  const fullPath = path.join(srcDir, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping ${filePath} (not found)`);
    return { processed: false, reason: "not found" };
  }

  let content = fs.readFileSync(fullPath, "utf-8");
  const originalContent = content;

  // Check if file has eslint-disable for no-img-element
  if (content.includes("@next/next/no-img-element")) {
    console.log(`⚠️  Skipping ${filePath} (has eslint-disable)`);
    return { processed: false, reason: "eslint-disabled" };
  }

  // Check if file has <img tags
  if (!content.includes("<img")) {
    console.log(`⚠️  Skipping ${filePath} (no <img> tags found)`);
    return { processed: false, reason: "no img tags" };
  }

  // Add Image import if not present
  if (!content.includes('import Image from "next/image"')) {
    // Find the first import statement
    const firstImportMatch = content.match(/^import\s+/m);
    if (firstImportMatch) {
      const insertPos = firstImportMatch.index;
      content =
        content.slice(0, insertPos) +
        'import Image from "next/image";\n' +
        content.slice(insertPos);
    }
  }

  let imgCount = 0;

  // Replace <img> tags with <Image />
  // This is a simplified replacement - handles most common cases
  content = content.replace(
    /<img\s+([^>]*)\s*\/?>|<img\s+([^>]*)>.*?<\/img>/gs,
    (match, attrs1, attrs2) => {
      imgCount++;
      const attrs = attrs1 || attrs2 || "";

      // Extract src
      const srcMatch = attrs.match(/src=["']([^"']+)["']/);
      if (!srcMatch) return match; // Skip if no src

      // Extract alt
      const altMatch = attrs.match(/alt=["']([^"']*)["']/);
      const alt = altMatch ? altMatch[1] : "";

      // Extract className
      const classMatch = attrs.match(/className=["']([^"']*)["']|className={([^}]+)}/);
      const className = classMatch ? (classMatch[1] || classMatch[2]) : "";

      // Extract style
      const styleMatch = attrs.match(/style={([^}]+)}/);
      const style = styleMatch ? styleMatch[1] : "";

      // Check if it needs fill prop (absolute positioning or explicit 100% sizing)
      const needsFill =
        className.includes("absolute") ||
        className.includes("inset-0") ||
        (style && (style.includes("position:") || style.includes("100%")));

      // Determine width/height
      let dimensions = "";
      if (needsFill) {
        dimensions = "fill";
      } else {
        // Try to infer from style or className
        const widthMatch = attrs.match(/width=["']?(\d+)["']?/);
        const heightMatch = attrs.match(/height=["']?(\d+)["']?/);

        if (widthMatch && heightMatch) {
          dimensions = `width={${widthMatch[1]}} height={${heightMatch[1]}}`;
        } else if (className.includes("w-") && className.includes("h-")) {
          // Default reasonable size for unknown dimensions
          dimensions = "width={400} height={300}";
        } else {
          dimensions = "width={200} height={200}";
        }
      }

      // Build <Image /> tag
      let imageTag = `<Image src=${srcMatch[0].slice(4)}`;
      imageTag += ` alt="${alt}"`;
      if (dimensions === "fill") {
        imageTag += " fill";
      } else {
        imageTag += ` ${dimensions}`;
      }
      if (className) {
        if (classMatch[2]) {
          imageTag += ` className={${className}}`;
        } else {
          imageTag += ` className="${className}"`;
        }
      }
      if (style) {
        imageTag += ` style={${style}}`;
      }
      imageTag += " />";

      return imageTag;
    }
  );

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, "utf-8");
    console.log(`✅ Processed ${filePath} (${imgCount} images replaced)`);
    return { processed: true, count: imgCount };
  }

  return { processed: false, reason: "no changes" };
}

async function main() {
  console.log("🔄 Starting batch <img> → <Image /> replacement...\n");

  const results = {
    processed: 0,
    skipped: 0,
    images: 0,
    errors: [],
  };

  for (const file of filesToProcess) {
    try {
      const result = processFile(file);
      if (result.processed) {
        results.processed++;
        results.images += result.count || 0;
      } else {
        results.skipped++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
      results.errors.push({ file, error: error.message });
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 Summary:");
  console.log(`   Files processed: ${results.processed}`);
  console.log(`   Files skipped: ${results.skipped}`);
  console.log(`   Total images replaced: ${results.images}`);
  console.log(`   Errors: ${results.errors.length}`);
  console.log("=".repeat(60));
}

main().catch(console.error);
