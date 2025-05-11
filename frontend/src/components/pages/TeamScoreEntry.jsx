import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Paper, Typography, Button, Alert, CircularProgress,
    Container, TextField, Grid, Divider
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import env from '../../config/env';

const TeamScoreEntry = () => {
    const { matchId, token } = useParams();

    // State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [saving, setSaving] = useState(false);

    const [teamData, setTeamData] = useState(null);
    const [match, setMatch] = useState(null);
    const [course, setCourse] = useState(null);
    const [holes, setHoles] = useState([]);
    const [teamScores, setTeamScores] = useState([]);

    // Validate token and load initial data
    useEffect(() => {
        const validateToken = async () => {
            try {
                setLoading(true);

                // Validate token
                const validateResponse = await fetch(`${env.API_BASE_URL}/matches/validate-token/${token}`);
                if (!validateResponse.ok) {
                    const error = await validateResponse.text();
                    throw new Error(`Invalid access: ${error}`);
                }

                const validationData = await validateResponse.json();
                setTeamData(validationData);

                // Fetch match details
                const matchResponse = await fetch(`${env.API_BASE_URL}/matches/${matchId}`);
                if (!matchResponse.ok) {
                    throw new Error('Failed to load match details');
                }

                const matchData = await matchResponse.json();
                setMatch(matchData);

                // Fetch course and holes
                const courseId = matchData.course_id;
                const courseResponse = await fetch(`${env.API_BASE_URL}/courses/${courseId}`);
                if (!courseResponse.ok) {
                    throw new Error('Failed to load course details');
                }

                const courseData = await courseResponse.json();
                setCourse(courseData);
                setHoles(courseData.holes || []);

                // Fetch team's players and scores
                await loadTeamScores(matchId, validationData.team_id);

            } catch (error) {
                console.error('Error:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        validateToken();
    }, [matchId, token]);

    // Load team scores
    const loadTeamScores = async (matchId, teamId) => {
        try {
            const scoresResponse = await fetch(
                `${env.API_BASE_URL}/matches/${matchId}/scores?team_id=${teamId}`
            );

            if (!scoresResponse.ok) {
                throw new Error('Failed to load team scores');
            }

            const scoreData = await scoresResponse.json();

            // Process player scores
            const playerScores = scoreData.match_players
                .filter(mp => mp.team_id === teamId && mp.is_active)
                .map(mp => {
                    const player = mp.player;
                    const playerScores = {};

                    // Initialize scores object
                    scoreData.holes.forEach(hole => {
                        const existingScore = scoreData.scores.find(
                            s => s.player_id === player.id && s.hole_id === hole.id
                        );

                        playerScores[hole.id] = existingScore ? existingScore.strokes : '';
                    });

                    return {
                        player_id: player.id,
                        player_name: `${player.first_name} ${player.last_name}`,
                        first_name: player.first_name,
                        last_name: player.last_name,
                        handicap: player.handicap || 0,
                        scores: playerScores
                    };
                });

            setTeamScores(playerScores);

        } catch (error) {
            console.error('Error loading team scores:', error);
            setError('Failed to load team scores');
        }
    };

    // Handle score changes
    const handleScoreChange = (playerIndex, holeId, value) => {
        // Clone scores
        const newScores = [...teamScores];

        // Validate input: either empty string or number between 1-20
        const numValue = value === '' ? '' : parseInt(value, 10);
        if (numValue !== '' && (isNaN(numValue) || numValue < 1 || numValue > 20)) {
            return; // Invalid input
        }

        // Update score
        newScores[playerIndex].scores[holeId] = value;
        setTeamScores(newScores);
    };

    // Save team scores
    const handleSaveScores = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccessMessage(null);

            // Prepare scores data
            const allScores = [];

            teamScores.forEach(player => {
                Object.entries(player.scores).forEach(([holeId, value]) => {
                    if (value !== '') {
                        allScores.push({
                            player_id: player.player_id,
                            hole_id: parseInt(holeId),
                            strokes: parseInt(value)
                        });
                    }
                });
            });

            // Call API
            const response = await fetch(`${env.API_BASE_URL}/matches/${matchId}/team-scores?token=${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ scores: allScores }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to save scores');
            }

            setSuccessMessage('Your scores have been saved successfully!');

            // Make success message disappear after 5 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);

            // Refresh scores
            await loadTeamScores(matchId, teamData.team_id);

        } catch (error) {
            console.error('Error saving scores:', error);
            setError('Failed to save scores: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Render loading state
    if (loading) {
        return (
            <Container maxWidth="md" sx={{ px: { xs: 1, sm: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    // Render error state
    if (error && !teamData) {
        return (
            <Container maxWidth="md" sx={{ px: { xs: 1, sm: 2 } }}>
                <Box sx={{ my: 4 }}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ px: { xs: 1, sm: 2 } }}>
            <Box sx={{ py: 2 }}>
                {/* Simple Header */}
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h5" component="h1">
                            {teamData?.team_name} Scores
                        </Typography>

                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveScores}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </Box>

                    <Typography variant="body1">
                        Match: {match?.home_team?.name} vs {match?.away_team?.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                        Course: {course?.name}
                    </Typography>
                </Paper>

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

                {/* Scorecard */}
                <Paper sx={{ p: 2 }}>
                    {teamScores.length === 0 ? (
                        <Alert severity="info">
                            No active players found for your team.
                        </Alert>
                    ) : (
                        <Box>
                            {/* Player Names */}
                            <Paper sx={{ mb: 1, p: 1, bgcolor: 'background.paper' }}>
                                <Grid container spacing={1} alignItems="center">
                                    <Grid item xs={3} sx={{ fontWeight: 'bold' }}>
                                        <Typography variant="body2">Hole</Typography>
                                    </Grid>
                                    {teamScores.map((player) => (
                                        <Grid item xs key={player.player_id} sx={{ textAlign: 'center' }}>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    fontSize: { xs: '0.7rem', sm: '0.8rem' }
                                                }}
                                            >
                                                {player.first_name}
                                            </Typography>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>

                            {/* Holes with scores */}
                            {holes.sort((a, b) => a.number - b.number).map((hole) => (
                                <Paper
                                    key={hole.id}
                                    sx={{
                                        mb: 1,
                                        p: 1,
                                        bgcolor: 'background.paper'
                                    }}
                                >
                                    <Grid container spacing={1} alignItems="center">
                                        <Grid item xs={3}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Box
                                                    sx={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: '50%',
                                                        bgcolor: 'primary.main',
                                                        color: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        mr: 1,
                                                        fontWeight: 'bold',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    {hole.number}
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" sx={{ display: 'block' }}>
                                                        Par {hole.par}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                                        {hole.yards || '—'} yds
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>

                                        {teamScores.map((player, playerIndex) => (
                                            <Grid
                                                item
                                                xs
                                                key={`${player.player_id}-${hole.id}`}
                                                sx={{ textAlign: 'center' }}
                                            >
                                                <TextField
                                                    type="number"
                                                    variant="outlined"
                                                    inputMode="numeric"
                                                    value={player.scores[hole.id] || ''}
                                                    onChange={(e) => handleScoreChange(
                                                        playerIndex,
                                                        hole.id,
                                                        e.target.value
                                                    )}
                                                    inputProps={{
                                                        min: 1,
                                                        max: 20,
                                                        style: {
                                                            textAlign: 'center',
                                                            padding: '8px 0',
                                                            fontSize: '1rem'
                                                        }
                                                    }}
                                                    sx={{
                                                        width: '45px',
                                                        '& .MuiOutlinedInput-root': {
                                                            padding: 0
                                                        }
                                                    }}
                                                    size="small"
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Paper>
                            ))}

                            {/* Fixed Save button at bottom */}
                            <Box
                                sx={{
                                    position: 'fixed',
                                    bottom: 16,
                                    left: 0,
                                    right: 0,
                                    textAlign: 'center',
                                    zIndex: 10
                                }}
                            >
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<SaveIcon />}
                                    onClick={handleSaveScores}
                                    disabled={saving}
                                    size="large"
                                    sx={{
                                        boxShadow: 3,
                                        px: 4,
                                        py: 1
                                    }}
                                >
                                    {saving ? 'Saving...' : 'Save All Scores'}
                                </Button>
                            </Box>

                            {/* Add extra space at bottom to account for fixed button */}
                            <Box sx={{ height: 80 }} />
                        </Box>
                    )}
                </Paper>
            </Box>
        </Container>
    );
};

export default TeamScoreEntry;