import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Paper, Typography, Button, Alert, CircularProgress,
    Container, TextField, Grid, Divider
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { get, post } from '../../services/api'; // Import API service

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

                // Validate token using API service
                const validationData = await get(`/matches/validate-token/${token}`);
                setTeamData(validationData);

                // Fetch match details using API service
                const matchData = await get(`/matches/${matchId}`);
                setMatch(matchData);

                // Fetch course and holes using API service
                const courseData = await get(`/courses/${matchData.course_id}`);
                setCourse(courseData);
                setHoles(courseData.holes || []);

                // Fetch team's players and scores
                await loadTeamScores(matchId, validationData.team_id);

            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        validateToken();
    }, [matchId, token]);

    // Load team scores using API service
    const loadTeamScores = async (matchId, teamId) => {
        try {
            const scoreData = await get(`/matches/${matchId}/scores?team_id=${teamId}`);

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
            setError('Failed to load team scores');
        }
    };

    // Handle score changes with auto-save and auto-focus
    const handleScoreChange = async (playerIndex, holeId, value, event) => {
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

        // If the value is valid (not empty), auto-save and move to next field
        if (value !== '') {
            // Identify current hole and player
            const currentHole = holes.find(h => h.id === holeId);
            const currentHoleIndex = holes.findIndex(h => h.id === holeId);

            // Auto-save this score
            try {
                setSaving(true);

                // Prepare just this score for saving
                const scoreToSave = {
                    player_id: newScores[playerIndex].player_id,
                    hole_id: parseInt(holeId),
                    strokes: parseInt(value)
                };

                // Call API with just this one score using API service
                await post(`/matches/${matchId}/team-scores?token=${token}`, {
                    scores: [scoreToSave]
                });

                // Show subtle success indicator
                setSuccessMessage('Score saved');
                setTimeout(() => setSuccessMessage(null), 1500);

            } catch (error) {
                setError('Failed to save score: ' + error.message);
                setTimeout(() => setError(null), 3000);
            } finally {
                setSaving(false);
            }

            // Determine the next input to focus on
            let nextElement = null;

            // If there are more players for this hole
            if (playerIndex < teamScores.length - 1) {
                // Focus on the next player's input for the same hole
                const nextPlayerIndex = playerIndex + 1;
                nextElement = document.getElementById(`score-${nextPlayerIndex}-${holeId}`);
            } else if (currentHoleIndex < holes.length - 1) {
                // If this is the last player for this hole, move to the first player of the next hole
                const nextHole = holes[currentHoleIndex + 1];
                nextElement = document.getElementById(`score-0-${nextHole.id}`);
            }

            // Focus the next element if found
            if (nextElement) {
                setTimeout(() => {
                    nextElement.focus();
                    nextElement.select(); // Select the text for easy overwriting
                }, 50);
            }
        }
    };

    // Save team scores using API service
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

            // Call API using API service
            await post(`/matches/${matchId}/team-scores?token=${token}`, {
                scores: allScores
            });

            setSuccessMessage('Your scores have been saved successfully!');

            // Make success message disappear after 5 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);

            // Refresh scores
            await loadTeamScores(matchId, teamData.team_id);

        } catch (error) {
            setError('Failed to save scores: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Render loading state
    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    // Render error state
    if (error && !teamData) {
        return (
            <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
                <Box sx={{ my: 4 }}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                {/* Add a simple header */}
                <Typography variant="h4" component="h1" gutterBottom>
                    Team Score Entry
                </Typography>

                {/* Your existing UI components */}
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
                            {match?.home_team && match?.away_team && (
                                teamData?.team_id === match?.home_team?.id ? (
                                    <>
                                        <strong>Home:</strong> {teamData?.team_name} vs <strong>Away:</strong> {match?.away_team?.name}
                                    </>
                                ) : (
                                    <>
                                        <strong>Home:</strong> {match?.home_team?.name} vs <strong>Away:</strong> {teamData?.team_name}
                                    </>
                                )
                            )}
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
                        <Box
                            sx={{
                                position: 'fixed',
                                top: 16,
                                right: 16,
                                bgcolor: 'success.main',
                                color: 'white',
                                px: 2,
                                py: 1,
                                borderRadius: 1,
                                zIndex: 1300,
                                boxShadow: 2,
                                opacity: 0.9,
                                transition: 'opacity 0.3s',
                            }}
                        >
                            <Typography variant="body2">{successMessage}</Typography>
                        </Box>
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
                                                        id={`score-${playerIndex}-${hole.id}`}
                                                        type="number"
                                                        variant="outlined"
                                                        inputMode="numeric"
                                                        value={player.scores[hole.id] || ''}
                                                        onChange={(e) => handleScoreChange(
                                                            playerIndex,
                                                            hole.id,
                                                            e.target.value,
                                                            e
                                                        )}
                                                        onKeyDown={(e) => {
                                                            // Handle tab and enter keys for navigation
                                                            if (e.key === 'Enter' || e.key === 'Tab') {
                                                                e.preventDefault();

                                                                // Simulate a change event to trigger auto-focus logic
                                                                if (player.scores[hole.id]) {
                                                                    handleScoreChange(playerIndex, hole.id, player.scores[hole.id], e);
                                                                }
                                                            }
                                                        }}
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
            </Paper>
        </Container>
    );
};

export default TeamScoreEntry;