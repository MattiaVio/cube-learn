import { useState, useRef } from 'react';
import { connectGanCube, GanCubeConnection, GanCubeEvent } from 'gan-web-bluetooth';
import * as THREE from 'three';

interface CubeEventHandlers {
    onGyro: (quaternion: THREE.Quaternion) => void;
    onMove: (move: string) => void;
    onFacelets?: (facelets: string) => void;
    onDisconnect?: () => void;
}

export function useGanCube({ onGyro, onMove, onFacelets, onDisconnect }: CubeEventHandlers) {
    const [isConnected, setIsConnected] = useState(false);
    const [cubeDetails, setCubeDetails] = useState<any>({});
    const [lastMoves, setLastMoves] = useState<string[]>([]);
    const connectionRef = useRef<GanCubeConnection | null>(null);
    const basisRef = useRef<THREE.Quaternion | null>(null);

    const handleCubeEvent = async (event: GanCubeEvent) => {
        if (event.type === 'GYRO') {
            const { x: qx, y: qy, z: qz, w: qw } = event.quaternion;
            const quat = new THREE.Quaternion(qx, qz, -qy, qw).normalize();

            if (!basisRef.current) {
                basisRef.current = quat.clone().conjugate();
            }

            const correctedQuat = quat.premultiply(basisRef.current);
            onGyro(correctedQuat);
        } else if (event.type === 'MOVE') {
            const { move } = event;
            onMove(move);
            setLastMoves((prevMoves) => [...prevMoves.slice(-10), move]); // Keep last 10 moves
        } else if (event.type === 'FACELETS' && onFacelets) {
            if (event.facelets) {
                onFacelets(event.facelets);
            }
        } else if (event.type === 'DISCONNECT') {
            setIsConnected(false);
            onDisconnect?.();
        } else if (event.type === 'BATTERY') {
            setCubeDetails((prev) => ({ ...prev, battery: `${event.batteryLevel}%` }));
        } else if (event.type === 'HARDWARE') {
            setCubeDetails({
                hardwareName: event.hardwareName,
                hardwareVersion: event.hardwareVersion,
                softwareVersion: event.softwareVersion,
                productDate: event.productDate,
            });
        }
    };

    const connectToCube = async () => {
        try {
            const connection = await connectGanCube();
            connection.events$.subscribe(handleCubeEvent);
            connectionRef.current = connection;
            setIsConnected(true);

            await connection.sendCubeCommand({ type: 'REQUEST_HARDWARE' });
            await connection.sendCubeCommand({ type: 'REQUEST_BATTERY' });
            await connection.sendCubeCommand({ type: 'REQUEST_FACELETS' });
        } catch (error) {
            console.error('Failed to connect to cube:', error);
        }
    };

    const disconnectFromCube = () => {
        connectionRef.current?.disconnect();
        connectionRef.current = null;
        setIsConnected(false);
    };

    return {
        isConnected,
        cubeDetails,
        lastMoves,
        connectToCube,
        disconnectFromCube,
    };
}
