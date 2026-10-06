import { readFile, writeFile } from 'node:fs/promises';
// Capacitor 8 CLI on Windows emits backslashes into Swift paths.
// Normalize only generated relative paths so the checkout also works on macOS.
const path = new URL('../ios/App/CapApp-SPM/Package.swift', import.meta.url);
try {
  const source = await readFile(path, 'utf8');
  await writeFile(
    path,
    source.replace(/path: "([^"\n]+)"/g, (_, p) => `path: "${p.replaceAll('\\', '/')}"`),
  );
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
