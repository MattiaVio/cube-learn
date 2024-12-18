import React, { useEffect, useRef } from 'react';
import { TwistyPlayer } from 'cubing/twisty';
import * as THREE from 'three';

const SOLVED_STATE = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

interface CubePlayerProps {
    cubeQuaternion: THREE.Quaternion;
}

export default function CubePlayer({ cubeQuaternion }: CubePlayerProps) {
    const cubeRef = useRef<HTMLDivElement>(null);
    const twistyPlayer = useRef<TwistyPlayer | null>(null);

    useEffect(() => {
        twistyPlayer.current = new TwistyPlayer({
            puzzle: '3x3x3',
            visualization: 'PG3D',
            background: 'none',
            controlPanel: 'none',
        });

        if (cubeRef.current) {
            cubeRef.current.appendChild(twistyPlayer.current);
        }
    }, []);

    return <div ref={cubeRef} style={{ width: '100%', height: '400px' }} />;
}
