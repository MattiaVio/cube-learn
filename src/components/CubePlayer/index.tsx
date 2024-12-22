import { memo } from 'react';
import useTwistyPlayer from './useTwistyPlayer';

interface CubePlayerProps {
    cubeQuaternionString: string;
    moves: string[];
}

const CubePlayer = ({ cubeQuaternionString, moves }: CubePlayerProps) => {
    const { cubeRef, resetCubeState, resetCubeGyro } = useTwistyPlayer({ moves, cubeQuaternionString });

    return (
        <div>
            <div ref={cubeRef} style={{ width: '100%', height: '400px' }} />
            <div className="controls">
                <button onClick={resetCubeState}>Reset State</button>
                <button onClick={resetCubeGyro}>Reset Gyro</button>
            </div>
        </div>
    );
};

export default memo(CubePlayer);
