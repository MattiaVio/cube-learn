import { useEffect, useRef, useCallback } from 'react';
import { TwistyPlayer } from 'cubing/twisty';
import * as THREE from 'three';

interface UseTwistyPlayerProps {
    moves: string[];
    cubeQuaternionString: string;
}

const useTwistyPlayer = ({ moves, cubeQuaternionString }: UseTwistyPlayerProps) => {
    const cubeRef = useRef<HTMLDivElement>(null);
    const twistyPlayerRef = useRef<TwistyPlayer | null>(null);
    const twistySceneRef = useRef<THREE.Scene | null>(null);
    const twistyVantageRef = useRef<any>(null);
    const basisRef = useRef<THREE.Quaternion | null>(null);
    const previousQuatRef = useRef<THREE.Quaternion | null>(null);
    const HOME_ORIENTATION = new THREE.Quaternion().setFromEuler(
        new THREE.Euler((15 * Math.PI) / 180, (-20 * Math.PI) / 180, 0)
    );

    useEffect(() => {
        const initializeTwistyPlayer = async () => {
            twistyPlayerRef.current = new TwistyPlayer({
                puzzle: '3x3x3',
                visualization: 'PG3D',
                background: 'none',
                controlPanel: 'none',
                alg: moves.join(' '),
                experimentalSetupAnchor: 'start',
                hintFacelets: 'none',
                experimentalDragInput: 'auto',
            });

            if (cubeRef.current && twistyPlayerRef.current) {
                console.log(11111);
                cubeRef.current.appendChild(twistyPlayerRef.current);
            }

            // Add a delay to ensure TwistyPlayer is fully initialized
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const vantageList = await twistyPlayerRef.current.experimentalCurrentVantages();
            console.log('Vantage List:', vantageList);
            const vantageArray = Array.from(vantageList || []);

            if (vantageArray.length > 0) {
                console.log(2222);
                twistyVantageRef.current = vantageArray[0];
                twistySceneRef.current = await twistyVantageRef.current.scene.scene();
                console.log('Twisty Scene:', twistySceneRef.current);
            }
        };

        initializeTwistyPlayer().catch(console.error);

        return () => {
            const currentCubeRef = cubeRef.current;
            const currentTwistyPlayerRef = twistyPlayerRef.current;

            if (currentCubeRef && currentTwistyPlayerRef) {
                console.log(33333);
                currentCubeRef.removeChild(currentTwistyPlayerRef);
                twistyPlayerRef.current = null;
            }
        };
    }, [moves]);

    useEffect(() => {
        const { w, x, y, z } = JSON.parse(cubeQuaternionString);
        const quat = new THREE.Quaternion(x, y, z, w).normalize();

        if (!basisRef.current) {
            basisRef.current = quat.clone().conjugate();
        }

        const correctedQuat = quat.premultiply(basisRef.current).premultiply(HOME_ORIENTATION);

        if (twistySceneRef.current && (!previousQuatRef.current || !correctedQuat.equals(previousQuatRef.current))) {
            console.log('Setting quaternion:', correctedQuat);
            twistySceneRef.current.quaternion.copy(correctedQuat);
            twistyVantageRef.current?.render();
            previousQuatRef.current = correctedQuat.clone();
        }
    }, [cubeQuaternionString, HOME_ORIENTATION]);

    const resetCubeState = useCallback(() => {
        if (twistyPlayerRef.current) {
            twistyPlayerRef.current.alg = '';
            twistyPlayerRef.current.experimentalSetupAnchor = 'start';
        }
    }, []);

    const resetCubeGyro = useCallback(() => {
        basisRef.current = null;
        previousQuatRef.current = null;
    }, []);

    return { cubeRef, resetCubeState, resetCubeGyro };
};

export default useTwistyPlayer;
