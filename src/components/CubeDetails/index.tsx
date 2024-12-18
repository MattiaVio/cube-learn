import React from 'react';
import { TextField, Box } from '@mui/material';

interface CubeDetailsProps {
    details: { label: string; value: string | number }[];
}

export default function CubeDetails({ details }: CubeDetailsProps) {
    return (
        <Box display="flex" flexDirection="column" gap={2}>
            {details.map((detail, index) => (
                <TextField key={index} label={detail.label} value={detail.value} InputProps={{ readOnly: true }} />
            ))}
        </Box>
    );
}
