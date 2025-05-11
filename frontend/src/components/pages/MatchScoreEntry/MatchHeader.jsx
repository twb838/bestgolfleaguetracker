import React from 'react';
import {
    Box, Paper, Typography, Button, Chip, Grid, Divider, Alert
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Save as SaveIcon,
    GolfCourse as CourseIcon,
    Edit as EditIcon,
    Check as CheckIcon
} from '@mui/icons-material';
import format from 'date-fns/format';

const MatchHeader = ({
    match,
    error,
    successMessage,
    saving,
    editMode,
    handleBack,
    handleSaveScores,
    toggleEditMode
}) => {
    return (
        <>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
                    Back
                </Button>

                {!match.is_completed && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveScores}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Scores'}
                    </Button>
                )}

                {match.is_completed && (
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={toggleEditMode}
                    >
                        {editMode ? 'Exit Edit Mode' : 'Edit Scores'}
                    </Button>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {successMessage}
                </Alert>
            )}

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
            </Paper>
        </>
    );
};

export default MatchHeader;