import fs from 'fs';
import path from 'path';
import { DEFAULT_LEVELS } from '../src/engine/LevelRegistry';

const outputDir = path.resolve('/workspaces/Personal-Workspace/projects/arrow-flow-puzzle/unity/Assets/Resources/Levels');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

for (const level of DEFAULT_LEVELS) {
  const transformedArrows = level.arrows.map((arrow) => {
    const headRow = arrow.head ? arrow.head.row : (arrow.row ?? 0);
    const headCol = arrow.head ? arrow.head.col : (arrow.col ?? 0);
    const occupiedCells =
      arrow.occupiedCells && arrow.occupiedCells.length > 0
        ? arrow.occupiedCells.map((c) => ({ row: c.row, col: c.col }))
        : [{ row: headRow, col: headCol }];

    return {
      id: arrow.id,
      row: headRow,
      col: headCol,
      direction: arrow.direction,
      color: arrow.color || '#06b6d4',
      occupiedCells: occupiedCells,
      isFrozen: Boolean(arrow.isFrozen),
      frozenHits: arrow.frozenHits ?? (arrow.isFrozen ? 1 : 0),
      isPivot: Boolean(arrow.isPivot),
      isBomb: Boolean(arrow.isBomb),
    };
  });

  const levelJson = {
    id: level.id,
    title: level.name,
    subtitle: level.subtitle || '',
    difficulty: level.difficulty || 'medium',
    rows: level.rows,
    cols: level.cols,
    parMoves: level.parMoves,
    rewardCoins: level.rewardCoins || level.id * 25 + 50,
    rewardGems: Math.max(10, Math.floor((level.rewardCoins || 100) / 10)),
    arrows: transformedArrows,
    deflectors: (level.deflectors || []).map((d) => ({
      row: d.row,
      col: d.col,
      redirectDirection: d.redirectDirection,
    })),
  };

  const filePath = path.join(outputDir, `level_${level.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(levelJson, null, 2), 'utf-8');
  console.log(`Exported level_${level.id}.json (${level.name}) - ${levelJson.arrows.length} arrows`);
}

console.log(`Successfully exported all ${DEFAULT_LEVELS.length} levels to ${outputDir}`);
