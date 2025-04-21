import React from 'react';
import { Typography, Paper, Grid } from '@mui/material';

function Dashboard() {
    return (
        <div>
            <Typography variant="h4" gutterBottom>
                Golf League Dashboard
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">Active Leagues</Typography>
                        {/* Add league summary here */}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">Recent Matches</Typography>
                        {/* Add recent matches here */}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">Upcoming Schedule</Typography>
                        {/* Add upcoming schedule here */}
                    </Paper>
                </Grid>
            </Grid>
        </div>
    );
}

export default Dashboard;