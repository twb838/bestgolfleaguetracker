import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Box, Paper, Typography, Button, CircularProgress, Alert,
    Divider, Chip, Grid
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Save as SaveIcon,
    GolfCourse as CourseIcon,
    Edit as EditIcon,
    Check as CheckIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import env from '../../../config/env';

import MatchHeader from './MatchHeader';
import ScoreTable from './ScoreTable';
import MatchResultsSummary from './MatchResultsSummary';
import SubstituteDialog from './SubstituteDialog';
import { calculateMatchResults, calculatePlayerPops, prepareHolesForHandicaps } from './utils/calculateScores';

const MatchScoreEntry = () => {
    const { matchId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // Use match data from navigation state if available, otherwise null
    const [match, setMatch] = useState(location.state?.match || null);
    const [league, setLeague] = useState(location.state?.league || null);
    const [loading, setLoading] = useState(!location.state?.match);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editMode, setEditMode] = useState(false);

    // Player scores state
    const [homeTeamScores, setHomeTeamScores] = useState([]);
    const [awayTeamScores, setAwayTeamScores] = useState([]);
    const [course, setCourse] = useState(null);

    // Get course holes for the match
    const [holes, setHoles] = useState([]);

    // Keep a sorted reference of holes by handicap
    const sortedHolesByHandicap = useMemo(() => {
        return prepareHolesForHandicaps(holes);
    }, [holes]);

    // Match results state
    const [matchResults, setMatchResults] = useState(null);

    // Substitute dialog state
    const [substituteDialogOpen, setSubstituteDialogOpen] = useState(false);
    const [currentSubstitute, setCurrentSubstitute] = useState({
        teamType: null,
        playerIndex: null,
        originalPlayer: null,
        substitute: {
            player_name: '',
            first_name: '',
            last_name: '',
            email: '',
            handicap: 0,
            is_substitute: true
        }
    });
    const [availablePlayers, setAvailablePlayers] = useState([]);

    // Fetch available players for substitution
    const fetchAvailablePlayers = async () => {
        try {
            const response = await fetch(`${env.API_BASE_URL}/players`);
            if (!response.ok) {
                throw new Error('Failed to fetch players');
            }
            const players = await response.json();
            setAvailablePlayers(players);
        } catch (error) {
            console.error('Error fetching available players:', error);
            setError('Failed to load available players');
        }
    };

    useEffect(() => {
        // If we don't have match data from navigation, fetch it
        if (!match) {
            fetchMatchDetails();
        } else {
            // If we have the match data, fetch the match course holes
            fetchCourseHoles();

            // Initialize player scores if we have league and match data
            if (league && match) {
                initializePlayerScores();
            }
        }
    }, [matchId, match]);

    useEffect(() => {
        if (match && homeTeamScores.length > 0 && awayTeamScores.length > 0 && holes.length > 0) {
            calculateAndUpdateResults();
        }
    }, [homeTeamScores, awayTeamScores, holes]);

    const calculateAndUpdateResults = () => {
        const results = calculateMatchResults(match, homeTeamScores, awayTeamScores, holes);
        setMatchResults(results);
    };

    // Fetch match details
    const fetchMatchDetails = async () => {
        // Implementation remains the same as in the original file
        // ...
    };

    // Helper function to format player name
    const formatPlayerName = (player) => {
        if (player.first_name && player.last_name) {
            return `${player.first_name} ${player.last_name}`;
        }
        return player.name || "Unknown Player";
    };

    // Initialize team scores
    const initializeTeamScores = (homeTeamData, awayTeamData, matchData) => {
        // Implementation remains the same as in the original file
        // ...
    };

    // Fetch course holes
    const fetchCourseHoles = async (courseId) => {
        // Implementation remains the same as in the original file
        // ...
    };

    // Initialize player scores
    const initializePlayerScores = (matchData = match, leagueData = league) => {
        // Implementation remains the same as in the original file
        // ...
    };

    // Fetch existing scores
    const fetchExistingScores = async (matchId) => {
        // Implementation remains the same as in the original file
        // ...
    };

    // Handle score changes
    const handleScoreChange = (teamType, playerIndex, holeId, value) => {
        // Implementation remains the same as in the original file
        // ...
    };

    // Toggle edit mode
    const toggleEditMode = async () => {
        if (editMode) {
            // If leaving edit mode, save changes
            await handleSaveScores();
        } else {
            // Just entering edit mode, no need to save
            setEditMode(true);
        }
    };

    // Handle back navigation
    const handleBack = () => {
        if (location.state?.returnTo) {
            navigate(location.state.returnTo);
        } else {
            navigate('/leagues');
        }
    };

    // Handle substitute player dialog
    const handleOpenSubstituteDialog = (teamType, playerIndex) => {
        // Get the current player
        const teamScores = teamType === 'home' ? homeTeamScores : awayTeamScores;
        const currentPlayer = teamScores[playerIndex];

        setCurrentSubstitute({
            teamType,
            playerIndex,
            originalPlayer: currentPlayer,
            substitute: {
                player_name: '',
                first_name: '',
                last_name: '',
                email: '',
                handicap: 0,
                is_substitute: true
            }
        });

        // Fetch available players when opening the dialog
        fetchAvailablePlayers();
        setSubstituteDialogOpen(true);
    };

    const handleCloseSubstituteDialog = () => {
        setSubstituteDialogOpen(false);
    };

    const handleApplySubstitute = async () => {
        // Implementation remains the same as in the original file
        // ...
    };

    // Save scores
    const handleSaveScores = async () => {
        // Implementation remains the same as in the original file
        // ...
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error && !match) {
        return (
            <Box sx={{ my: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
                    Back
                </Button>
                <Paper sx={{ p: 3, mt: 2, textAlign: 'center' }}>
                    <Typography color="error">{error}</Typography>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 4 }}>
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

            <MatchHeader match={match} />

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Match Scorecard
                </Typography>

                <Grid container spacing={1}>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 1, mb: 1, bgcolor: 'rgba(33, 150, 243, 0.05)' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                {match.home_team?.name || 'Home'} Team
                            </Typography>
                            <Box>
                                {homeTeamScores.length > 0 ? (
                                    <ScoreTable
                                        teamScores={homeTeamScores}
                                        otherTeamScores={awayTeamScores}
                                        teamType="home"
                                        course={course}
                                        holes={holes}
                                        match={match}
                                        editMode={editMode}
                                        handleScoreChange={handleScoreChange}
                                        handleOpenSubstituteDialog={handleOpenSubstituteDialog}
                                    />
                                ) : (
                                    <Alert severity="info" sx={{ mt: 1 }}>
                                        No players found for home team.
                                    </Alert>
                                )}
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 1, mb: 1, bgcolor: 'rgba(244, 67, 54, 0.05)' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                {match.away_team?.name || 'Away'} Team
                            </Typography>
                            <Box>
                                {awayTeamScores.length > 0 ? (
                                    <ScoreTable
                                        teamScores={awayTeamScores}
                                        otherTeamScores={homeTeamScores}
                                        teamType="away"
                                        course={course}
                                        holes={holes}
                                        match={match}
                                        editMode={editMode}
                                        handleScoreChange={handleScoreChange}
                                        handleOpenSubstituteDialog={handleOpenSubstituteDialog}
                                    />
                                ) : (
                                    <Alert severity="info" sx={{ mt: 1 }}>
                                        No players found for away team.
                                    </Alert>
                                )}
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Paper>

            <MatchResultsSummary
                results={matchResults}
                calculateMatchResults={calculateAndUpdateResults}
            />

            {!match.is_completed && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveScores}
                        disabled={saving}
                        size="large"
                    >
                        {saving ? 'Saving...' : 'Save All Scores'}
                    </Button>
                </Box>
            )}

            <SubstituteDialog
                open={substituteDialogOpen}
                currentSubstitute={currentSubstitute}
                availablePlayers={availablePlayers}
                onClose={handleCloseSubstituteDialog}
                onApply={handleApplySubstitute}
                onSubstituteChange={(name, value) => {
                    setCurrentSubstitute(prev => ({
                        ...prev,
                        substitute: {
                            ...prev.substitute,
                            [name]: value
                        }
                    }));
                }}
                onSelectExistingPlayer={handleSelectExistingPlayer}
            />
        </Box>
    );
};

export default MatchScoreEntry;