// android/ içinde Gradle görevini çalıştırır (Windows'ta gradlew.bat, diğerlerinde ./gradlew).
// Kullanım: node scripts/gradle.mjs bundleRelease
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const cwd = fileURLToPath(new URL('../android/', import.meta.url));
const win = process.platform === 'win32';
// tam yol: bazı Windows kabukları bulunduğu klasördeki komutu aramaz
const exe = join(cwd, win ? 'gradlew.bat' : 'gradlew');
const r = spawnSync(win ? `"${exe}"` : exe, process.argv.slice(2), { cwd, stdio: 'inherit', shell: win });
process.exit(r.status ?? 1);
