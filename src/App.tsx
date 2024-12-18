import { useEffect, useState } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import CubePlayer from './components/CubePlayer';
import CubeTimer from './components/CubeTimer';
import ConnectionPanel from './components/ConnectionPanel';
import CubeDetails from './components/CubeDetails';
import { useGanCube } from './hooks/useGanCube';
import * as THREE from 'three';
import { formatTimerValue } from './utils.ts';

function App() {
    const [cubeQuaternion, setCubeQuaternion] = useState(new THREE.Quaternion());
    const {
        isConnected,
        cubeDetails,
        timerValue,
        connectToCube,
        disconnectFromCube,
        startCubeTimer,
        stopCubeTimer,
        resetTimerState,
    } = useGanCube({
        onGyro: (quat) => setCubeQuaternion(quat),
        onDisconnect: () => alert('Cube disconnected'),
    });

    useEffect(() => {
        console.log({
            isConnected,
            cubeDetails,
            timerValue,
            connectToCube,
            disconnectFromCube,
            startCubeTimer,
            stopCubeTimer,
            resetTimerState,
        });
    }, [isConnected]);

    return (
        <Container>
            <Box textAlign="center" mt={4}>
                <Typography variant="h4" mb={2}>
                    GAN Cube App with React & Material-UI
                </Typography>

                {/* Connection Panel */}
                <ConnectionPanel
                    isConnected={isConnected}
                    onConnect={connectToCube}
                    onDisconnect={disconnectFromCube}
                />

                {/* Cube Player */}
                <CubePlayer cubeQuaternion={cubeQuaternion} />

                {/* Timer */}
                <CubeTimer timerValue={formatTimerValue(timerValue)} timerColor={timerValue > 0 ? '#0f0' : '#999'} />

                {/* Cube Details */}
                <CubeDetails details={Object.entries(cubeDetails).map(([key, value]) => ({ label: key, value }))} />

                {/* Timer Control Buttons */}
                <Box mt={2}>
                    <Button variant="contained" color="primary" onClick={startCubeTimer} disabled={!isConnected}>
                        Start Timer
                    </Button>
                    <Button variant="contained" color="secondary" onClick={stopCubeTimer} disabled={!isConnected}>
                        Stop Timer
                    </Button>
                    <Button variant="outlined" onClick={resetTimerState}>
                        Reset Timer
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}

export default App;
