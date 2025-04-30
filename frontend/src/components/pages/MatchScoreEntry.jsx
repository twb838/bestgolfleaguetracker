import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Box, Paper, Typography, Button, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, IconButton, Tabs, Tab, Divider, Chip, Grid
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Save as SaveIcon,
    GolfCourse as CourseIcon,
    Edit as EditIcon,
    Check as CheckIcon
} from '@mui/icons-material';
import format from 'date-fns/format';
import env from '../../config/env';

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
    const [activeTab, setActiveTab] = useState(0); // 0 = Home team, 1 = Away team

    // Player scores state
    const [homeTeamScores, setHomeTeamScores] = useState([]);
    const [awayTeamScores, setAwayTeamScores] = useState([]);
    const [course, setCourse] = useState(null);

    // Get course holes for the match
    const [holes, setHoles] = useState([]);

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

    // Update this function to directly fetch team data with players
    const fetchMatchDetails = async () => {
        setLoading(true);
        try {
            console.log(`Fetching match details for ID: ${matchId}`);
            const matchResponse = await fetch(`${env.API_BASE_URL}/matches/${matchId}`);
            if (!matchResponse.ok) {
                throw new Error(`Failed to fetch match details: ${matchResponse.status}`);
            }
            const matchData = await matchResponse.json();
            console.log('Match data received:', matchData);
            setMatch(matchData);

            // Fetch home and away teams directly to ensure we get full player data
            try {
                const homeTeamResponse = await fetch(`${env.API_BASE_URL}/teams/${matchData.home_team_id}`);
                const awayTeamResponse = await fetch(`${env.API_BASE_URL}/teams/${matchData.away_team_id}`);

                if (homeTeamResponse.ok && awayTeamResponse.ok) {
                    const homeTeamData = await homeTeamResponse.json();
                    const awayTeamData = await awayTeamResponse.json();
                    console.log('Home team data:', homeTeamData);
                    console.log('Away team data:', awayTeamData);

                    // Initialize player scores directly from fetched team data
                    initializeTeamScores(homeTeamData, awayTeamData, matchData);
                } else {
                    throw new Error("Failed to fetch team data");
                }
            } catch (teamError) {
                console.error('Error fetching team data:', teamError);
                setError(`Failed to load team data: ${teamError.message}`);
            }

            // Fetch course data
            await fetchCourseHoles(matchData.course_id);

            // Also fetch the league if we need it for other purposes
            if (!league) {
                try {
                    const leagueResponse = await fetch(`${env.API_BASE_URL}/leagues/${matchData.league_id}`);
                    if (leagueResponse.ok) {
                        const leagueData = await leagueResponse.json();
                        setLeague(leagueData);
                    }
                } catch (leagueError) {
                    console.error('Error fetching league data:', leagueError);
                    // Non-critical error, don't show to user
                }
            }
        } catch (error) {
            console.error('Error fetching match details:', error);
            setError(`Failed to load match details: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // New function to initialize teams directly from fetched data
    const initializeTeamScores = (homeTeamData, awayTeamData, matchData) => {
        // Check if teams have players array
        if (homeTeamData && homeTeamData.players && homeTeamData.players.length > 0) {
            const homeScores = homeTeamData.players.map(player => ({
                player_id: player.id,
                player_name: formatPlayerName(player),
                scores: {} // Will be populated with hole scores: { hole_id: score }
            }));
            console.log('Initialized home team scores for', homeScores.length, 'players');
            setHomeTeamScores(homeScores);
        } else {
            console.warn('No players found for home team');
            setHomeTeamScores([]);
        }

        if (awayTeamData && awayTeamData.players && awayTeamData.players.length > 0) {
            const awayScores = awayTeamData.players.map(player => ({
                player_id: player.id,
                player_name: formatPlayerName(player),
                scores: {} // Will be populated with hole scores: { hole_id: score }
            }));
            console.log('Initialized away team scores for', awayScores.length, 'players');
            setAwayTeamScores(awayScores);
        } else {
            console.warn('No players found for away team');
            setAwayTeamScores([]);
        }

        // If we have match id, fetch existing scores
        if (matchData && matchData.id) {
            fetchExistingScores(matchData.id);
        }
    };

    const fetchCourseHoles = async (courseId) => {
        try {
            const courseIdToUse = courseId || match.course_id;
            console.log(`Fetching course data for ID: ${courseIdToUse}`);

            const response = await fetch(`${env.API_BASE_URL}/courses/${courseIdToUse}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch course details: ${response.status}`);
            }

            const courseData = await response.json();
            console.log('Course data received:', courseData);
            setCourse(courseData);

            // Check which property name is used for hole number (hole_number or number)
            const firstHole = courseData.holes?.[0];
            const holeNumberProp = firstHole && 'number' in firstHole ? 'number' : 'number';

            // Sort holes by hole number
            const sortedHoles = [...(courseData.holes || [])].sort((a, b) => {
                return a[holeNumberProp] - b[holeNumberProp];
            });
            console.log('Sorted holes:', sortedHoles);
            setHoles(sortedHoles);

        } catch (error) {
            console.error('Error fetching course holes:', error);
            setError('Failed to load course details. Some features may not work correctly.');
        }
    };

    const initializePlayerScores = (matchData = match, leagueData = league) => {
        if (!matchData || !leagueData) return;

        // Find the teams in the league
        const homeTeam = leagueData.teams.find(t => t.id === matchData.home_team_id);
        const awayTeam = leagueData.teams.find(t => t.id === matchData.away_team_id);

        if (homeTeam && homeTeam.players) {
            const homeScores = homeTeam.players.map(player => ({
                player_id: player.id,
                // Format full name from first and last name if available
                player_name: formatPlayerName(player),
                scores: {} // Will be populated with hole scores: { hole_id: score }
            }));
            setHomeTeamScores(homeScores);
        }

        if (awayTeam && awayTeam.players) {
            const awayScores = awayTeam.players.map(player => ({
                player_id: player.id,
                // Format full name from first and last name if available
                player_name: formatPlayerName(player),
                scores: {} // Will be populated with hole scores: { hole_id: score }
            }));
            setAwayTeamScores(awayScores);
        }

        // TODO: If there are existing scores, fetch and populate them
        fetchExistingScores(matchData.id);
    };

    // Helper function to format player name
    const formatPlayerName = (player) => {
        // Check if first_name and last_name fields exist
        if (player.first_name && player.last_name) {
            return `${player.first_name} ${player.last_name}`;
        }
        // Otherwise, use the single name field
        return player.name || "Unknown Player";
    };

    const fetchExistingScores = async (matchId) => {
        try {
            console.log(`Fetching scores for match ${matchId}`);
            const response = await fetch(`${env.API_BASE_URL}/matches/${matchId}/scores`);
            if (!response.ok) {
                console.log(`No scores found for match ${matchId}, status: ${response.status}`);
                return;
            }

            const data = await response.json();
            console.log('Received score data:', data);

            // Handle the new response format which contains players and holes
            if (data.players) {
                // If we receive players from the API, initialize team scores with them
                const homePlayersData = data.players.home || [];
                const awayPlayersData = data.players.away || [];

                console.log(`Got ${homePlayersData.length} home players and ${awayPlayersData.length} away players from API`);

                if (homePlayersData.length > 0) {
                    const homeScores = homePlayersData.map(player => ({
                        player_id: player.id,
                        player_name: formatPlayerName(player),
                        scores: {} // Will be populated with hole scores later if they exist
                    }));
                    setHomeTeamScores(homeScores);
                }

                if (awayPlayersData.length > 0) {
                    const awayScores = awayPlayersData.map(player => ({
                        player_id: player.id,
                        player_name: formatPlayerName(player),
                        scores: {} // Will be populated with hole scores later if they exist
                    }));
                    setAwayTeamScores(awayScores);
                }
            }

            // If we have holes from the API and our current holes array is empty, use them
            if (data.holes && data.holes.length > 0 && holes.length === 0) {
                console.log(`Got ${data.holes.length} holes from API`);
                setHoles(data.holes);
            }

            // If there are actual scores, process them
            if (data.scores && data.scores.length > 0) {
                console.log(`Processing ${data.scores.length} scores from API`);

                // Get the current team scores arrays to update
                const updatedHomeScores = [...homeTeamScores];
                const updatedAwayScores = [...awayTeamScores];

                // Process each score
                data.scores.forEach(score => {
                    // Determine if this is a home team player
                    const homePlayerIndex = updatedHomeScores.findIndex(p => p.player_id === score.player_id);

                    if (homePlayerIndex >= 0) {
                        // Update home player score
                        updatedHomeScores[homePlayerIndex].scores[score.hole_id] = score.strokes;
                    } else {
                        // Try to update away player score
                        const awayPlayerIndex = updatedAwayScores.findIndex(p => p.player_id === score.player_id);
                        if (awayPlayerIndex >= 0) {
                            updatedAwayScores[awayPlayerIndex].scores[score.hole_id] = score.strokes;
                        }
                    }
                });

                // Update the state if there were existing scores
                if (updatedHomeScores.length > 0) setHomeTeamScores(updatedHomeScores);
                if (updatedAwayScores.length > 0) setAwayTeamScores(updatedAwayScores);
            }
        } catch (error) {
            console.error('Error fetching existing scores:', error);
        }
    };

    const handleScoreChange = (teamType, playerIndex, holeId, value) => {
        // Convert input to number or empty string if invalid
        let score = value === '' ? '' : parseInt(value, 10);

        // Validate score (1 to 20 strokes allowed)
        if (score !== '' && (isNaN(score) || score < 1 || score > 20)) {
            return; // Invalid score, don't update
        }

        if (teamType === 'home') {
            const newScores = [...homeTeamScores];
            newScores[playerIndex].scores = {
                ...newScores[playerIndex].scores,
                [holeId]: score
            };
            setHomeTeamScores(newScores);
        } else {
            const newScores = [...awayTeamScores];
            newScores[playerIndex].scores = {
                ...newScores[playerIndex].scores,
                [holeId]: score
            };
            setAwayTeamScores(newScores);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleBack = () => {
        if (location.state?.returnTo) {
            navigate(location.state.returnTo);
        } else {
            navigate('/leagues');
        }
    };

    const calculatePlayerTotal = (playerScores) => {
        return holes.reduce((total, hole) => {
            const score = playerScores.scores[hole.id];
            return total + (score ? score : 0);
        }, 0);
    };

    const calculatePar = () => {
        const parProp = 'par' in holes[0] ? 'par' : 'par';
        return holes.reduce((total, hole) => total + hole[parProp], 0);
    };

    const getScoreColor = (score, par) => {
        if (!score) return 'text.secondary'; // No score entered
        const diff = score - par;
        if (diff < 0) return 'success.main'; // Under par
        if (diff === 0) return 'info.main'; // Par
        if (diff === 1) return 'warning.main'; // Bogey
        return 'error.main'; // Double bogey or worse
    };

    const handleSaveScores = async () => {
        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // Combine home and away team scores into a single array
            const allScores = [];

            // Process home team scores
            homeTeamScores.forEach(player => {
                Object.entries(player.scores).forEach(([holeId, strokes]) => {
                    if (strokes !== '') { // Only send valid scores
                        allScores.push({
                            player_id: player.player_id,
                            hole_id: parseInt(holeId, 10),
                            strokes: strokes
                        });
                    }
                });
            });

            // Process away team scores
            awayTeamScores.forEach(player => {
                Object.entries(player.scores).forEach(([holeId, strokes]) => {
                    if (strokes !== '') { // Only send valid scores
                        allScores.push({
                            player_id: player.player_id,
                            hole_id: parseInt(holeId, 10),
                            strokes: strokes
                        });
                    }
                });
            });

            // Send scores to the API
            const response = await fetch(`${env.API_BASE_URL}/matches/${matchId}/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    scores: allScores,
                    is_completed: true // Mark match as completed when scores are saved
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save scores');
            }

            setSuccessMessage('Scores saved successfully!');

            // Update the match object to reflect completion
            setMatch({
                ...match,
                is_completed: true
            });

        } catch (error) {
            console.error('Error saving scores:', error);
            setError('Failed to save scores. Please try again.');
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

    // Function to render the score table for a team
    const renderScoreTable = (teamScores, teamType) => {
        if (!course || !holes.length) {
            return (
                <Alert severity="warning" sx={{ my: 2 }}>
                    Course information is not available. Unable to enter scores.
                </Alert>
            );
        }

        // Determine which property to use for hole number and par
        const holeNumberProp = 'hole_number' in holes[0] ? 'hole_number' : 'number';
        const parProp = 'par' in holes[0] ? 'par' : 'par';

        return (
            <TableContainer component={Paper} sx={{ mt: 2, overflowX: 'auto' }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>Player</TableCell>
                            {holes.map(hole => (
                                <TableCell
                                    key={hole.id}
                                    align="center"
                                    sx={{
                                        minWidth: 50,
                                        fontWeight: 'bold',
                                        bgcolor: hole[parProp] === 3 ? 'info.light' :
                                            hole[parProp] === 5 ? 'warning.light' : 'inherit'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <Typography variant="body2">{hole[holeNumberProp]}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Par {hole[parProp]}
                                        </Typography>
                                    </Box>
                                </TableCell>
                            ))}
                            <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.200' }}>Total</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {teamScores.map((playerScore, playerIndex) => {
                            const total = calculatePlayerTotal(playerScore);
                            return (
                                <TableRow key={playerScore.player_id}>
                                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                        {playerScore.player_name}
                                    </TableCell>
                                    {holes.map(hole => {
                                        const score = playerScore.scores[hole.id] || '';
                                        const parProp = 'par' in holes[0] ? 'par' : 'par';
                                        return (
                                            <TableCell
                                                key={hole.id}
                                                align="center"
                                                sx={{
                                                    color: getScoreColor(score, hole[parProp]),
                                                    backgroundColor: score !== '' ?
                                                        (score === hole[parProp] ? 'rgba(33, 150, 243, 0.1)' :
                                                            score < hole[parProp] ? 'rgba(76, 175, 80, 0.1)' :
                                                                score === hole[parProp] + 1 ? 'rgba(255, 152, 0, 0.1)' :
                                                                    'rgba(244, 67, 54, 0.1)') : 'inherit'
                                                }}
                                            >
                                                <TextField
                                                    type="number"
                                                    variant="standard"
                                                    value={score}
                                                    disabled={match.is_completed}
                                                    onChange={(e) => handleScoreChange(
                                                        teamType,
                                                        playerIndex,
                                                        hole.id,
                                                        e.target.value
                                                    )}
                                                    InputProps={{
                                                        disableUnderline: match.is_completed,
                                                        sx: {
                                                            input: {
                                                                textAlign: 'center',
                                                                width: '2rem',
                                                                fontWeight: score !== '' ? 'bold' : 'normal'
                                                            }
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                        );
                                    })}
                                    <TableCell
                                        align="center"
                                        sx={{
                                            fontWeight: 'bold',
                                            backgroundColor: 'grey.100'
                                        }}
                                    >
                                        {total || '-'}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        <TableRow sx={{ backgroundColor: 'grey.200' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Par</TableCell>
                            {holes.map(hole => (
                                <TableCell key={hole.id} align="center" sx={{ fontWeight: 'medium' }}>
                                    {hole.par}
                                </TableCell>
                            ))}
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                {calculatePar()}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

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

                <Divider sx={{ my: 2 }} />

                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{ mb: 2 }}
                >
                    <Tab label={`${match.home_team?.name || 'Home'} Team`} />
                    <Tab label={`${match.away_team?.name || 'Away'} Team`} />
                </Tabs>

                {activeTab === 0 && (
                    <>
                        <Typography variant="h6" gutterBottom>
                            {match.home_team?.name || 'Home'} Team Scores
                        </Typography>
                        {homeTeamScores.length > 0 ? (
                            renderScoreTable(homeTeamScores, 'home')
                        ) : (
                            <Alert severity="info">
                                No players found for this team.
                            </Alert>
                        )}
                    </>
                )}

                {activeTab === 1 && (
                    <>
                        <Typography variant="h6" gutterBottom>
                            {match.away_team?.name || 'Away'} Team Scores
                        </Typography>
                        {awayTeamScores.length > 0 ? (
                            renderScoreTable(awayTeamScores, 'away')
                        ) : (
                            <Alert severity="info">
                                No players found for this team.
                            </Alert>
                        )}
                    </>
                )}
            </Paper>

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
        </Box>
    );
};

export default MatchScoreEntry;