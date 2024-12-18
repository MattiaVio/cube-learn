import { useState, useEffect, useRef } from 'react';
import { connectGanCube, GanCubeConnection, GanCubeEvent, cubeTimestampLinearFit, now } from 'gan-web-bluetooth';
import * as THREE from 'three';
import { experimentalSolve3x3x3IgnoringCenters } from 'cubing/search';
import $ from 'jquery';

interface CubeEventHandlers {
    onGyro?: (quat: THREE.Quaternion) => void;
    onMove?: () => void;
    onFacelets?: (facelets: string) => void;
    onDisconnect?: () => void;
}

export function useGanCube({ onGyro, onMove, onFacelets, onDisconnect }: CubeEventHandlers) {
    const [isConnected, setIsConnected] = useState(false);
    const [cubeDetails, setCubeDetails] = useState<{ label: string; value: string | number }>({});
    const [timerState, setTimerState] = useState<'IDLE' | 'READY' | 'RUNNING' | 'STOPPED'>('IDLE');
    const [timerValue, setTimerValue] = useState<number>(0);

    const connectionRef = useRef<GanCubeConnection | null>(null);
    const timerRef = useRef<any>(null);

    const HOME_ORIENTATION = new THREE.Quaternion().setFromEuler(
        new THREE.Euler((15 * Math.PI) / 180, (-20 * Math.PI) / 180, 0)
    );

    const handleCubeEvent = async (event: GanCubeEvent) => {
        if (event.type === 'GYRO' && onGyro) {
            const { x: qx, y: qy, z: qz, w: qw } = event.quaternion;
            const quat = new THREE.Quaternion(qx, qz, -qy, qw).normalize();
            onGyro(quat);
        } else if (event.type === 'MOVE' && onMove) {
            onMove();
        } else if (event.type === 'FACELETS' && onFacelets) {
            onFacelets(event.facelets);
        } else if (event.type === 'DISCONNECT') {
            setIsConnected(false);
            onDisconnect?.();
        } else if (event.type === 'BATTERY') {
            setCubeDetails((prev: any) => ({ ...prev, batteryLevel: event.batteryLevel + '%' }));
        } else if (event.type === 'HARDWARE') {
            setCubeDetails({
                hardwareName: event.hardwareName || '- n/a -',
                hardwareVersion: event.hardwareVersion || '- n/a -',
                softwareVersion: event.softwareVersion || '- n/a -',
                productDate: event.productDate || '- n/a -',
                gyroSupported: event.gyroSupported ? 'YES' : 'NO',
            });
        }
    };

    const startTimer = () => {
        const startTime = now();
        timerRef.current = setInterval(() => {
            setTimerValue(now() - startTime);
        }, 30);
    };

    const stopTimer = () => {
        clearInterval(timerRef.current);
        timerRef.current = null;
    };

    const connectToCube = async () => {
        try {
            const connection = await connectGanCube();
            connection.events$.subscribe(handleCubeEvent);
            connectionRef.current = connection;

            setIsConnected(true);

            // Request initial details
            await connection.sendCubeCommand({ type: 'REQUEST_HARDWARE' });
            await connection.sendCubeCommand({ type: 'REQUEST_BATTERY' });
            await connection.sendCubeCommand({ type: 'REQUEST_FACELETS' });
        } catch (error) {
            console.error('Connection failed:', error);
        }
    };

    const disconnectFromCube = () => {
        connectionRef.current?.disconnect();
        setIsConnected(false);
    };

    const resetTimerState = () => {
        setTimerState('IDLE');
        stopTimer();
        setTimerValue(0);
    };

    const startCubeTimer = () => {
        setTimerState('RUNNING');
        startTimer();
    };

    const stopCubeTimer = () => {
        setTimerState('STOPPED');
        stopTimer();
    };

    return {
        isConnected,
        cubeDetails,
        timerValue,
        timerState,
        connectToCube,
        disconnectFromCube,
        startCubeTimer,
        stopCubeTimer,
        resetTimerState,
    };
}
