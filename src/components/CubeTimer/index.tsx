import React from 'react';
import { Box, Typography } from '@mui/material';

interface CubeTimerProps {
    timerValue: string;
    timerColor: string;
}

export default function CubeTimer({ timerValue, timerColor }: CubeTimerProps) {
    return (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="h2" sx={{ color: timerColor, fontFamily: 'monospace' }}>
                {timerValue}
            </Typography>
        </Box>
    );
}
