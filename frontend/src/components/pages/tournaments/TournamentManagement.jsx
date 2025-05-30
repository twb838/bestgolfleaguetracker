import React, { useState, useEffect, useCallback } from 'react';
import {
    Typography, Button, Box, Paper, CircularProgress,
    Tabs, Tab, Chip, Alert
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Event as EventIcon,
    Groups as GroupsIcon,
    GolfCourse as GolfCourseIcon,
    Leaderboard as LeaderboardIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO, addDays } from 'date-fns';
import { get } from '../../../services/api';

// Create a date formatting utility
const formatDate = (dateString, formatPattern) => {
    if (!dateString) return '';
    try {
        return format(parseISO(dateString), formatPattern);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
};

function TournamentManagement() {
    const { tournamentId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tournament, setTournament] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    const fetchTournament = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await get(`/tournaments/${tournamentId}`);
            setTournament(data);
        } catch (error) {
            console.error('Error fetching tournament:', error);
            setError(error.message || 'Failed to fetch tournament details');
        } finally {
            setLoading(false);
        }
    }, [tournamentId]);

    useEffect(() => {
        fetchTournament();
    }, [fetchTournament]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleBackClick = () => {
        navigate('/tournaments');
    };

    const handleRetry = () => {
        fetchTournament();
    };

    // Get status chip for tournament
    const getTournamentStatus = () => {
        if (!tournament) return null;

        const today = new Date();
        const startDate = parseISO(tournament.start_date);
        const endDate = parseISO(tournament.end_date);

        if (today < startDate) {
            return <Chip size="small" label="Upcoming" color="primary" />;
        } else if (today > endDate) {
            return <Chip size="small" label="Completed" color="success" />;
        } else {
            return <Chip size="small" label="In Progress" color="warning" />;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={handleBackClick}
                        sx={{ mr: 2 }}
                    >
                        Back to Tournaments
                    </Button>
                    <Typography variant="h4" component="h1">
                        Tournament Management
                    </Typography>
                </Box>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                    <Button
                        variant="contained"
                        onClick={handleRetry}
                        sx={{ mr: 2 }}
                    >
                        Retry
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={handleBackClick}
                    >
                        Back to Tournaments
                    </Button>
                </Paper>
            </Box>
        );
    }

    if (!tournament) {
        return (
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={handleBackClick}
                        sx={{ mr: 2 }}
                    >
                        Back
                    </Button>
                    <Typography variant="h4" component="h1">
                        Tournament Not Found
                    </Typography>
                </Box>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1">
                        The tournament you're looking for doesn't exist or has been deleted.
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={handleBackClick}
                        sx={{ mt: 2 }}
                    >
                        Return to Tournaments
                    </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button startIcon={<ArrowBackIcon />} onClick={handleBackClick}>
                    Back to Tournaments
                </Button>
            </Box>

            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {tournament.name}
                    </Typography>
                    {getTournamentStatus()}
                </Box>

                {tournament.description && (
                    <Typography variant="body1" color="text.secondary" paragraph>
                        {tournament.description}
                    </Typography>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, color: 'text.secondary', mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EventIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2">
                            {formatDate(tournament.start_date, 'MMMM d, yyyy')}
                            {tournament.start_date !== tournament.end_date &&
                                ` - ${formatDate(tournament.end_date, 'MMMM d, yyyy')}`}
                        </Typography>
                    </Box>
                    <Typography variant="body2">
                        Format: {tournament.format === 'stroke_play' && 'Stroke Play'}
                        {tournament.format === 'match_play' && 'Match Play'}
                        {tournament.format === 'stableford' && 'Stableford'}
                        {tournament.format === 'four_ball' && 'Four-Ball'}
                    </Typography>
                    {tournament.use_flights && (
                        <Typography variant="body2">
                            Flights: {tournament.number_of_flights}
                        </Typography>
                    )}
                </Box>
            </Box>

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    textColor="primary"
                    indicatorColor="primary"
                >
                    <Tab icon={<LeaderboardIcon />} label="Leaderboard" />
                    <Tab icon={<EventIcon />} label="Schedule" />
                    <Tab icon={<GroupsIcon />} label="Participants" />
                    <Tab icon={<GolfCourseIcon />} label="Courses" />
                </Tabs>
            </Paper>

            <Paper sx={{ p: 3 }}>
                {activeTab === 0 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Tournament Leaderboard
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                            Leaderboard will appear once the tournament starts and scores are entered.
                        </Typography>
                    </Box>
                )}

                {activeTab === 1 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Tournament Schedule
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            {Array.from({ length: tournament.number_of_days }).map((_, index) => {
                                const date = addDays(new Date(tournament.start_date), index);
                                return (
                                    <Paper key={index} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="subtitle1">
                                            Day {index + 1} - {format(date, 'EEEE, MMMM d, yyyy')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            Assign courses and tee times for this day
                                        </Typography>
                                    </Paper>
                                );
                            })}
                        </Box>
                    </Box>
                )}

                {activeTab === 2 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Tournament Participants
                        </Typography>
                        <Typography variant="body1">
                            {tournament.participants?.length || 0} participants registered
                        </Typography>
                    </Box>
                )}

                {activeTab === 3 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Tournament Courses
                        </Typography>
                        <Typography variant="body1">
                            {tournament.courses?.length || 0} courses assigned
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}

export default TournamentManagement;