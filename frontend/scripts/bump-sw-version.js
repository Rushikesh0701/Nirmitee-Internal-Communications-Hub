#!/usr/bin/env node

/**
 * Auto-increment the service worker CACHE_VERSION on every build.
 * 
 * Reads public/sw.js, finds the CACHE_VERSION line, bumps
 * the numeric version (e.g. 'v3' → 'v4'), and writes it back.
 * 
 * Usage: node scripts/bump-sw-version.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SW_PATH = resolve(__dirname, '..', 'public', 'sw.js');

try {
    const content = readFileSync(SW_PATH, 'utf-8');

    const versionRegex = /const CACHE_VERSION = 'v(\d+)';/;
    const match = content.match(versionRegex);

    if (!match) {
        console.error('[bump-sw] Could not find CACHE_VERSION in sw.js');
        process.exit(1);
    }

    const currentVersion = parseInt(match[1], 10);
    const newVersion = currentVersion + 1;

    const updated = content.replace(
        versionRegex,
        `const CACHE_VERSION = 'v${newVersion}';`
    );

    writeFileSync(SW_PATH, updated, 'utf-8');

    console.log(`[bump-sw] ✅ CACHE_VERSION bumped: v${currentVersion} → v${newVersion}`);
} catch (error) {
    console.error('[bump-sw] Failed to bump version:', error.message);
    process.exit(1);
}
