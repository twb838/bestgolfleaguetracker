import React from 'react';
import { Box } from '@mui/material';

const MinimalLayout = ({ children }) => {
    return (
        <Box sx={{
            width: '100%',
            minHeight: '100vh',
            bgcolor: 'background.default'
        }}>
            {children}
        </Box>
    );
};

export default MinimalLayout;