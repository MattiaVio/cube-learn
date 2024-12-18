// components/ConnectionPanel.tsx
import React from 'react';
import { Button, Stack, Typography } from '@mui/material';

interface ConnectionPanelProps {
    onConnect: () => void;
    onDisconnect: () => void;
    isConnected: boolean;
}

export default function ConnectionPanel({ onConnect, onDisconnect, isConnected }: ConnectionPanelProps) {
    return (
        <Stack spacing={2} alignItems="center">
            <Typography variant="h5">{isConnected ? 'Connected to Cube' : 'Disconnected'}</Typography>
            <Button variant="contained" color="primary" onClick={isConnected ? onDisconnect : onConnect}>
                {isConnected ? 'Disconnect' : 'Connect'}
            </Button>
        </Stack>
    );
}
