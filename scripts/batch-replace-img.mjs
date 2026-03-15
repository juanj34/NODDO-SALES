#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, "../src");

const stats = {
  filesProcessed: 0,
  filesSkipped: 0,
  imagesReplaced: 0,
  errors: [],
};

function hasEslintDisable(content) {
  return content.includes("eslint-disable") && content.includes("no-img-element");
}

function addImageImport(content) {
  if (content.includes('import Image from "next/image"') || content.includes("import Image from 'next/image'")) {
    return content;
  }

  // Find first import to insert Image import
  const lines = content.split("\n");
  let insertIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("import ")) {
      insertIndex = i;
      break;
    }
  }

  if (insertIndex === -1) {
    // No imports found, add at top after "use client" if present
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('"use client"') || lines[i].includes("'use client'")) {
        insertIndex = i + 1;
        break;
      }
    }
  }

  if (insertIndex !== -1) {
    lines.splice(insertIndex, 0, 'import Image from "next/image";');
    return lines.join("\n");
  }

  return content;
}

function replaceImgTags(content) {
  let imgCount = 0;

  // Pattern 1: self-closing img tags
  content = content.replace(
    /<img\s+([^>\/]*?)\/>/g,
    (match, attrs) => {
      const srcMatch = attrs.match(/src=\{([^}]+)\}|src="([^"]+)"|src='([^']+)'/);
      if (!srcMatch) return match;

      const srcValue = srcMatch[1] || srcMatch[2] || srcMatch[3];
      const src = srcMatch[1] ? `{${srcValue}}` : `"${srcValue}"`;

      const altMatch = attrs.match(/alt="([^"]*)"|alt='([^']*)'/);
      const alt = altMatch ? (altMatch[1] || altMatch[2]) : "";

      const classMatch = attrs.match(/className=\{([^}]+)\}|className="([^"]+)"/);
      const className = classMatch ? (classMatch[1] ? `{${classMatch[1]}}` : `"${classMatch[2]}"`) : null;

      const styleMatch = attrs.match(/style=\{([^}]+)\}/);
      const style = styleMatch ? `{${styleMatch[1]}}` : null;

      const loadingMatch = attrs.match(/loading="([^"]+)"/);
      const loading = loadingMatch ? loadingMatch[1] : null;

      const onLoadMatch = attrs.match(/onLoad=\{([^}]+)\}/);
      const onLoad = onLoadMatch ? `{${onLoadMatch[1]}}` : null;

      // Determine if image needs fill prop based on className
      const needsFill = className && (
        className.includes("absolute") ||
        className.includes("inset-0") ||
        className.includes("w-full") && className.includes("h-full")
      );

      let replacement = `<Image src=${src} alt="${alt}"`;

      if (needsFill) {
        replacement += ` fill`;
        if (loading) replacement += ` priority`;
      } else {
        // Use default dimensions - these will be overridden by CSS
        replacement += ` width={400} height={300}`;
      }

      if (className) replacement += ` className=${className}`;
      if (style) replacement += ` style=${style}`;
      if (onLoad) replacement += ` onLoad=${onLoad}`;

      replacement += " />";

      imgCount++;
      return replacement;
    }
  );

  return { content, count: imgCount };
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  const originalContent = content;

  // Skip files with eslint-disable comments
  if (hasEslintDisable(content)) {
    console.log(`⏭️  Skipped ${path.relative(srcDir, filePath)} (has eslint-disable)`);
    stats.filesSkipped++;
    return;
  }

  // Skip if no img tags
  if (!content.includes("<img")) {
    stats.filesSkipped++;
    return;
  }

  // Add Image import
  content = addImageImport(content);

  // Replace img tags
  const result = replaceImgTags(content);
  content = result.content;

  if (content !== originalContent && result.count > 0) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`✅ ${path.relative(srcDir, filePath)} (${result.count} images)`);
    stats.filesProcessed++;
    stats.imagesReplaced += result.count;
  } else {
    stats.filesSkipped++;
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDirectory(filePath);
    } else if (file.endsWith(".tsx") || file.endsWith(".jsx")) {
      try {
        processFile(filePath);
      } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        stats.errors.push({ file: filePath, error: error.message });
      }
    }
  }
}

console.log("🚀 Starting batch <img> → <Image /> replacement...\n");

walkDirectory(srcDir);

console.log("\n" + "=".repeat(60));
console.log("📊 Summary:");
console.log(`   Files processed: ${stats.filesProcessed}`);
console.log(`   Files skipped: ${stats.filesSkipped}`);
console.log(`   Images replaced: ${stats.imagesReplaced}`);
console.log(`   Errors: ${stats.errors.length}`);
console.log("=".repeat(60));
