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
    const initializePlayerScores = async (matchData = match, leagueData = league) => {
        try {
            // Fetch match players data to get proper player lineup
            const response = await fetch(`${env.API_BASE_URL}/matches/${matchData.id}/players`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`Failed to fetch match players: ${response.status} ${response.statusText}`);
            }

            const matchPlayersData = await response.json();
            console.log('Match players data:', matchPlayersData); // Debug logging

            // Group players by team
            const homeTeamPlayers = matchPlayersData.filter(mp => mp.team_id === matchData.home_team_id)
                .map(mp => mp.player);
            console.log('Home team players:', homeTeamPlayers);  // Debug logging

            const awayTeamPlayers = matchPlayersData.filter(mp => mp.team_id === matchData.away_team_id)
                .map(mp => mp.player);

            // Create player score objects for home team
            const homeScores = homeTeamPlayers.map(player => {
                // Calculate player's pops based on handicap
                const handicap = player.handicap || 0;
                const pops = calculatePlayerPops(handicap, sortedHolesByHandicap, leagueData?.handicap_allowance || 0.8);

                return {
                    player_id: player.id,
                    player_name: formatPlayerName(player),
                    first_name: player.first_name,
                    last_name: player.last_name,
                    email: player.email,
                    handicap: handicap,
                    pops: pops,
                    is_substitute: matchPlayersData.find(mp => mp.player_id === player.id)?.is_substitute || false,
                    scores: holes.map(hole => ({
                        hole_id: hole.id,
                        value: null
                    }))
                };
            });

            // Create player score objects for away team
            const awayScores = awayTeamPlayers.map(player => {
                // Calculate player's pops based on handicap
                const handicap = player.handicap || 0;
                const pops = calculatePlayerPops(handicap, sortedHolesByHandicap, leagueData?.handicap_allowance || 0.8);

                return {
                    player_id: player.id,
                    player_name: formatPlayerName(player),
                    first_name: player.first_name,
                    last_name: player.last_name,
                    email: player.email,
                    handicap: handicap,
                    pops: pops,
                    is_substitute: matchPlayersData.find(mp => mp.player_id === player.id)?.is_substitute || false,
                    scores: holes.map(hole => ({
                        hole_id: hole.id,
                        value: null
                    }))
                };
            });

            setHomeTeamScores(homeScores);
            setAwayTeamScores(awayScores);

        } catch (error) {
            console.error('Error initializing player scores:', error);
            setError('Failed to initialize player scores. ' + error.message);
        }
    };

    // Fetch existing scores
    const fetchExistingScores = async (matchId) => {
        try {
            setLoading(true);
            const response = await fetch(`${env.API_BASE_URL}/matches/${matchId}/scores`);
            if (!response.ok) {
                throw new Error('Failed to fetch match scores');
            }

            const data = await response.json();

            // Find home and away players from match_players table
            const homeTeamPlayers = data.match_players.filter(mp => mp.team_id === match.home_team_id);
            const awayTeamPlayers = data.match_players.filter(mp => mp.team_id === match.away_team_id);

            // Create player score objects for home team
            const homeScores = homeTeamPlayers.map(matchPlayer => {
                const player = matchPlayer.player;
                const playerScores = data.scores.filter(score => score.player_id === player.id);

                // Calculate player's pops based on handicap
                const handicap = player.handicap || 0;
                const pops = calculatePlayerPops(handicap, sortedHolesByHandicap, league?.handicap_allowance || 0.8);

                return {
                    player_id: player.id,
                    player_name: formatPlayerName(player),
                    first_name: player.first_name,
                    last_name: player.last_name,
                    email: player.email,
                    handicap: handicap,
                    pops: pops,
                    is_substitute: matchPlayer.is_substitute,
                    scores: data.holes.map(hole => {
                        const existingScore = playerScores.find(s => s.hole_id === hole.id);
                        return {
                            hole_id: hole.id,
                            value: existingScore ? existingScore.strokes : null
                        };
                    })
                };
            });

            // Create player score objects for away team (similar to home team)
            const awayScores = awayTeamPlayers.map(matchPlayer => {
                // Same logic as above for home team
                const player = matchPlayer.player;
                const playerScores = data.scores.filter(score => score.player_id === player.id);

                const handicap = player.handicap || 0;
                const pops = calculatePlayerPops(handicap, sortedHolesByHandicap, league?.handicap_allowance || 0.8);

                return {
                    player_id: player.id,
                    player_name: formatPlayerName(player),
                    first_name: player.first_name,
                    last_name: player.last_name,
                    email: player.email,
                    handicap: handicap,
                    pops: pops,
                    is_substitute: matchPlayer.is_substitute,
                    scores: data.holes.map(hole => {
                        const existingScore = playerScores.find(s => s.hole_id === hole.id);
                        return {
                            hole_id: hole.id,
                            value: existingScore ? existingScore.strokes : null
                        };
                    })
                };
            });

            setHomeTeamScores(homeScores);
            setAwayTeamScores(awayScores);
            setCourse(data.course);
            setHoles(data.holes);

        } catch (error) {
            console.error('Error fetching scores:', error);
            setError('Failed to load match scores. ' + error.message);
        } finally {
            setLoading(false);
        }
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
        const { teamType, playerIndex, originalPlayer, substitute } = currentSubstitute;

        if (!substitute.player_name) {
            setError("Substitute player name is required");
            return;
        }

        // Add team_id to the substitute player
        const teamId = teamType === 'home' ? match.home_team_id : match.away_team_id;

        // Create a player object with proper team info for the substitute
        const substitutePlayer = {
            ...substitute,
            player_id: substitute.player_id || null,  // If using existing player, use their ID
            scores: originalPlayer.scores,  // Copy the original player's score structure
            pops: originalPlayer.pops,      // Copy the original player's pops
            team_id: teamId                 // Add team ID
        };

        // Update the appropriate team's scores
        if (teamType === 'home') {
            const newHomeTeamScores = [...homeTeamScores];
            newHomeTeamScores[playerIndex] = substitutePlayer;
            setHomeTeamScores(newHomeTeamScores);
        } else {
            const newAwayTeamScores = [...awayTeamScores];
            newAwayTeamScores[playerIndex] = substitutePlayer;
            setAwayTeamScores(newAwayTeamScores);
        }

        // Close the dialog
        setSubstituteDialogOpen(false);

        // Show confirmation
        setSuccessMessage(`Substituted ${substitutePlayer.player_name} for ${originalPlayer.player_name}`);
    };

    const handleSelectExistingPlayer = (selectedPlayer) => {
        if (!selectedPlayer) return;

        setCurrentSubstitute(prev => ({
            ...prev,
            substitute: {
                ...prev.substitute,
                player_id: selectedPlayer.id,
                player_name: selectedPlayer.first_name && selectedPlayer.last_name
                    ? `${selectedPlayer.first_name} ${selectedPlayer.last_name}`
                    : selectedPlayer.name || "Unknown Player",
                first_name: selectedPlayer.first_name || '',
                last_name: selectedPlayer.last_name || '',
                email: selectedPlayer.email || '',
                handicap: selectedPlayer.handicap || 0,
                is_substitute: true
            }
        }));
    };

    // Save scores
    const handleSaveScores = async () => {
        try {
            setSaving(true);
            setError(null);

            // Prepare all scores for API
            const allScores = [];

            // Collect all player data with team information
            const allPlayers = [];

            // Process home team scores
            homeTeamScores.forEach(player => {
                // Add player data with team information
                allPlayers.push({
                    player_id: player.player_id,
                    team_id: match.home_team_id,
                    is_substitute: player.is_substitute || false,
                    is_active: true
                });

                // Add scores for this player
                player.scores.forEach(score => {
                    if (score.value !== null) {
                        allScores.push({
                            player_id: player.player_id,
                            hole_id: score.hole_id,
                            strokes: score.value
                        });
                    }
                });
            });

            // Process away team scores
            awayTeamScores.forEach(player => {
                // Add player data with team information
                allPlayers.push({
                    player_id: player.player_id,
                    team_id: match.away_team_id,
                    is_substitute: player.is_substitute || false,
                    is_active: true
                });

                // Add scores for this player
                player.scores.forEach(score => {
                    if (score.value !== null) {
                        allScores.push({
                            player_id: player.player_id,
                            hole_id: score.hole_id,
                            strokes: score.value
                        });
                    }
                });
            });

            // Prepare the data to send to the API
            const dataToSave = {
                scores: allScores,
                players: allPlayers,
                is_completed: match.is_completed
            };

            // Call API to save scores
            const response = await fetch(`${env.API_BASE_URL}/matches/${match.id}/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSave),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to save scores');
            }

            setSuccessMessage('Scores saved successfully');
            setEditMode(false);

            // If we've marked the match as completed, refresh the data
            if (match.is_completed) {
                await fetchMatchDetails();
            }

        } catch (error) {
            console.error('Error saving scores:', error);
            setError('Failed to save scores: ' + error.message);
        } finally {
            setSaving(false);
        }
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