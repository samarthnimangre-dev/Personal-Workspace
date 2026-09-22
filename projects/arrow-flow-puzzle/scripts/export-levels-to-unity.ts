import * as fs from 'fs';
import * as path from 'path';
import { CAMPAIGN_LEVELS } from '../lib/levels';

const unityLevelsDir = path.resolve(__dirname, '../unity/Assets/Resources/Levels');

if (!fs.existsSync(unityLevelsDir)) {
  fs.mkdirSync(unityLevelsDir, { recursive: true });
}

console.log('🔄 Exporting ArrowFlow Levels from Next.js engine to Unity Resources/Levels...');

CAMPAIGN_LEVELS.forEach((level) => {
  const filePath = path.join(unityLevelsDir, `level_${level.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(level, null, 2), 'utf-8');
  console.log(`  ✓ Exported Level ${level.id} (${level.title}) -> ${filePath}`);
});

console.log('✅ All Campaign Levels successfully exported to Unity Resources folder!');
