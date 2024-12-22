import React, { useState, useMemo } from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import CubePlayer from './components/CubePlayer';
import CubeTimer from './components/CubeTimer';
import CubeDetails from './components/CubeDetails';
import { useGanCube } from './hooks/useGanCube';
import * as THREE from 'three';

function App() {
    const [quaternionValues, setQuaternionValues] = useState({ w: 1, x: 0, y: 0, z: 0 });
    const [moves, setMoves] = useState<string[]>([]);

    const cubeQuaternionString = useMemo(() => {
        return JSON.stringify(quaternionValues);
    }, [quaternionValues]);

    const { isConnected, cubeDetails, lastMoves, connectToCube, disconnectFromCube } = useGanCube({
        onGyro: (quaternion) =>
            setQuaternionValues({
                w: quaternion.w.toFixed(3),
                x: quaternion.x.toFixed(3),
                y: quaternion.y.toFixed(3),
                z: quaternion.z.toFixed(3),
            }),
        onMove: (move) => setMoves((prev) => [...prev, move]),
        onDisconnect: () => alert('Cube disconnected'),
    });

    return (
        <Container>
            <Box textAlign="center" mt={4}>
                <Typography variant="h4" mb={2}>
                    GAN Cube App
                </Typography>

                {/* Connection Buttons */}
                <Button
                    variant="contained"
                    color="primary"
                    onClick={connectToCube}
                    disabled={isConnected}
                    style={{ marginRight: '10px' }}
                >
                    Connect
                </Button>
                <Button variant="contained" color="secondary" onClick={disconnectFromCube} disabled={!isConnected}>
                    Disconnect
                </Button>

                {/* Cube Display */}
                <CubePlayer cubeQuaternionString={cubeQuaternionString} moves={moves} />

                {/* Moves List */}
                <Box mt={2}>
                    <Typography variant="h6">Last Moves:</Typography>
                    <ul>
                        {lastMoves.map((move, index) => (
                            <li key={index}>{move}</li>
                        ))}
                    </ul>
                </Box>

                {/* Cube Details */}
                <CubeDetails
                    details={Object.entries(cubeDetails).map(([key, value]) => ({
                        label: key,
                        value,
                    }))}
                />
            </Box>
        </Container>
    );
}

export default App;
