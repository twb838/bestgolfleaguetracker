import React from 'react';
import { Paper, Grid, Typography, Box, Chip, Divider } from '@mui/material';
import { format } from 'date-fns';
import {
    GolfCourse as CourseIcon,
    Check as CheckIcon,
    Edit as EditIcon
} from '@mui/icons-material';

const MatchHeader = ({ match }) => {
    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={8}>
                    <Typography variant="h5" component="h1" gutterBottom>
                        {match.home_team?.name} vs {match.away_team?.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CourseIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body1" color="text.secondary">
                            {match.course?.name || 'Course not specified'}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {format(new Date(match.match_date), 'EEEE, MMMM d, yyyy')}
                    </Typography>
                </Grid>
                <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'center' }}>
                    <Chip
                        label={match.is_completed ? "Completed" : "In Progress"}
                        color={match.is_completed ? "success" : "primary"}
                        icon={match.is_completed ? <CheckIcon /> : <EditIcon />}
                        sx={{ mr: 1 }}
                    />
                </Grid>
            </Grid>
            <Divider />
        </Paper>
    );
};

export default MatchHeader;