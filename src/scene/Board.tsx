import { Grid } from '@react-three/drei';
import { BOARD_WIDTH, BOARD_DEPTH, CELL_SIZE_METERS } from '../lib/grid';

const widthMeters = BOARD_WIDTH * CELL_SIZE_METERS;
const depthMeters = BOARD_DEPTH * CELL_SIZE_METERS;

export function Board() {
  return (
    <group>
      <mesh position={[widthMeters / 2, 0, depthMeters / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[widthMeters, depthMeters]} />
        <meshStandardMaterial color="#f2f1ec" />
      </mesh>
      <Grid
        position={[widthMeters / 2, 0.01, depthMeters / 2]}
        args={[widthMeters, depthMeters]}
        cellSize={CELL_SIZE_METERS}
        cellColor="#c9c7bd"
        sectionSize={widthMeters}
        sectionColor="#9a988e"
        fadeDistance={100}
        infiniteGrid={false}
      />
    </group>
  );
}
