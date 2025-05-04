import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Box, Paper, Typography, Button, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, IconButton, Tabs, Tab, Divider, Chip, Grid, TableFooter
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
    const [editMode, setEditMode] = useState(false); // New state for edit mode

    // Player scores state
    const [homeTeamScores, setHomeTeamScores] = useState([]);
    const [awayTeamScores, setAwayTeamScores] = useState([]);
    const [course, setCourse] = useState(null);

    // Get course holes for the match
    const [holes, setHoles] = useState([]);

    // Match results state
    const [matchResults, setMatchResults] = useState(null);

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
            calculateMatchResults();
        }
    }, [homeTeamScores, awayTeamScores, holes]);

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
                handicap: player.handicap !== undefined ? player.handicap : null,
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
                handicap: player.handicap !== undefined ? player.handicap : null,
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

    // Update the fetchExistingScores function

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

            // Always check and process player data
            if (data.players) {
                // Initialize team scores with player data from API
                const homePlayersData = data.players.home || [];
                const awayPlayersData = data.players.away || [];

                console.log(`Got ${homePlayersData.length} home players and ${awayPlayersData.length} away players from API`);

                if (homePlayersData.length > 0) {
                    const homeScores = homePlayersData.map(player => ({
                        player_id: player.id,
                        player_name: formatPlayerName(player),
                        handicap: player.handicap,
                        scores: {} // Will be populated with hole scores later
                    }));
                    setHomeTeamScores(homeScores);
                }

                if (awayPlayersData.length > 0) {
                    const awayScores = awayPlayersData.map(player => ({
                        player_id: player.id,
                        player_name: formatPlayerName(player),
                        handicap: player.handicap,
                        scores: {} // Will be populated with hole scores later
                    }));
                    setAwayTeamScores(awayScores);
                }
            }

            // Process existing scores if any
            if (data.scores && data.scores.length > 0) {
                // Group scores by player
                const scoresByPlayer = data.scores.reduce((acc, score) => {
                    if (!acc[score.player_id]) {
                        acc[score.player_id] = {};
                    }
                    acc[score.player_id][score.hole_id] = score.strokes;
                    return acc;
                }, {});

                console.log('Scores by player:', scoresByPlayer);

                // Update home team scores with existing scores
                setHomeTeamScores(prev => prev.map(player => ({
                    ...player,
                    scores: scoresByPlayer[player.player_id] || {}
                })));

                // Update away team scores with existing scores
                setAwayTeamScores(prev => prev.map(player => ({
                    ...player,
                    scores: scoresByPlayer[player.player_id] || {}
                })));
            }

            // Process hole data if provided
            if (data.holes && data.holes.length > 0) {
                setHoles(data.holes);
            }

        } catch (error) {
            console.error('Error fetching existing scores:', error);
            setError('Failed to load existing scores. Please try again.');
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

    // Helper function to find the next input field to focus
    const getNextInputField = (teamType, currentPlayerIndex, currentHoleId) => {
        // Find the current hole's index in the holes array
        const currentHoleIndex = holes.findIndex(h => h.id === currentHoleId);

        // Get the appropriate team scores array
        const teamScores = teamType === 'home' ? homeTeamScores : awayTeamScores;

        // If this is the last hole for the current player
        if (currentHoleIndex === holes.length - 1) {
            // Move to the next player's first hole
            if (currentPlayerIndex < teamScores.length - 1) {
                // Next player in same team
                return document.querySelector(
                    `[data-player-index="${currentPlayerIndex + 1}"][data-team-type="${teamType}"][data-hole-index="0"] input`
                );
            } else if (teamType === 'home' && activeTab === 0 && awayTeamScores.length > 0) {
                // Move to first player in away team (and switch tab)
                setTimeout(() => {
                    setActiveTab(1); // Switch to away team tab
                    setTimeout(() => {
                        const firstAwayInput = document.querySelector(
                            `[data-player-index="0"][data-team-type="away"][data-hole-index="0"] input`
                        );
                        if (firstAwayInput) firstAwayInput.focus();
                    }, 100); // Small delay to allow tab switch
                }, 10);
                return null;
            }
            // If we're at the last player's last hole, don't auto-tab
            return null;
        }

        // Otherwise, move to the next hole for the current player
        return document.querySelector(
            `[data-player-index="${currentPlayerIndex}"][data-team-type="${teamType}"][data-hole-index="${currentHoleIndex + 1}"] input`
        );
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

    const calculateMatchResults = () => {
        // Initialize results structure
        const results = {
            match_id: match.id,
            date: match.match_date,
            home_team: {
                id: match.home_team_id,
                name: match.home_team?.name || 'Home Team',
                total_points: 0,
                total_score: 0,
                total_points_by_hole: [],
                players: []
            },
            away_team: {
                id: match.away_team_id,
                name: match.away_team?.name || 'Away Team',
                total_points: 0,
                total_score: 0,
                total_points_by_hole: [],
                players: []
            }
        };

        // Calculate player scores and determine individual points
        const pairings = Math.min(homeTeamScores.length, awayTeamScores.length);

        // Setup the player structure in the results
        for (let i = 0; i < pairings; i++) {
            const homePlayer = homeTeamScores[i];
            const awayPlayer = awayTeamScores[i];

            results.home_team.players.push({
                player_id: homePlayer.player_id,
                player_name: homePlayer.player_name,
                handicap: homePlayer.handicap,
                score: 0,
                points: 0,
                points_by_hole: Array(holes.length).fill(null),
                opponent_id: awayPlayer.player_id,
                opponent_name: awayPlayer.player_name,
            });

            results.away_team.players.push({
                player_id: awayPlayer.player_id,
                player_name: awayPlayer.player_name,
                handicap: awayPlayer.handicap,
                score: 0,
                points: 0,
                points_by_hole: Array(holes.length).fill(null),
                opponent_id: homePlayer.player_id,
                opponent_name: homePlayer.player_name,
            });
        }

        // Calculate points hole by hole
        holes.forEach((hole, holeIndex) => {
            // Track all scores for this hole with player info
            const allPlayersForHole = [];

            // Setup arrays to track team scores for this hole
            let homeTeamHoleTotal = 0;
            let awayTeamHoleTotal = 0;
            let homeTeamPlayersWithScores = 0;
            let awayTeamPlayersWithScores = 0;

            // Collect all player scores for this hole
            for (let i = 0; i < pairings; i++) {
                const homePlayer = homeTeamScores[i];
                const awayPlayer = awayTeamScores[i];

                const homeScore = homePlayer.scores[hole.id];
                const awayScore = awayPlayer.scores[hole.id];

                // Add home player score if available
                if (homeScore !== undefined && homeScore !== '') {
                    const numHomeScore = Number(homeScore);
                    allPlayersForHole.push({
                        team: 'home',
                        playerIndex: i,
                        score: numHomeScore
                    });

                    // Add to player's total score
                    results.home_team.players[i].score += numHomeScore;

                    // Add to team total for this hole
                    homeTeamHoleTotal += numHomeScore;
                    homeTeamPlayersWithScores++;
                }

                // Add away player score if available
                if (awayScore !== undefined && awayScore !== '') {
                    const numAwayScore = Number(awayScore);
                    allPlayersForHole.push({
                        team: 'away',
                        playerIndex: i,
                        score: numAwayScore
                    });

                    // Add to player's total score
                    results.away_team.players[i].score += numAwayScore;

                    // Add to team total for this hole
                    awayTeamHoleTotal += numAwayScore;
                    awayTeamPlayersWithScores++;
                }
            }

            // Find the lowest score(s) for this hole
            if (allPlayersForHole.length > 0) {
                // Sort by score (lowest first)
                allPlayersForHole.sort((a, b) => a.score - b.score);

                // Get the lowest score
                const lowestScore = allPlayersForHole[0].score;

                // Check if there are any ties for lowest score
                const lowestScorePlayers = allPlayersForHole.filter(p => p.score === lowestScore);

                // Award point only if there's a single player with the lowest score (no ties)
                if (lowestScorePlayers.length === 1) {
                    const winner = lowestScorePlayers[0];

                    // Award the point to the correct player
                    if (winner.team === 'home') {
                        results.home_team.players[winner.playerIndex].points += 1;
                        results.home_team.players[winner.playerIndex].points_by_hole[holeIndex] = 1;
                        results.home_team.total_points += 1;
                    } else {
                        results.away_team.players[winner.playerIndex].points += 1;
                        results.away_team.players[winner.playerIndex].points_by_hole[holeIndex] = 1;
                        results.away_team.total_points += 1;
                    }
                }

                // Mark all other players as having 0 points for this hole if they submitted a score
                for (let i = 0; i < pairings; i++) {
                    // Only update players who have a score for this hole
                    const homeHasScore = homeTeamScores[i].scores[hole.id] !== undefined &&
                        homeTeamScores[i].scores[hole.id] !== '';
                    const awayHasScore = awayTeamScores[i].scores[hole.id] !== undefined &&
                        awayTeamScores[i].scores[hole.id] !== '';

                    if (homeHasScore && results.home_team.players[i].points_by_hole[holeIndex] !== 1) {
                        results.home_team.players[i].points_by_hole[holeIndex] = 0;
                    }

                    if (awayHasScore && results.away_team.players[i].points_by_hole[holeIndex] !== 1) {
                        results.away_team.players[i].points_by_hole[holeIndex] = 0;
                    }
                }
            }

            // Calculate and award team point for this hole
            const allHomePlayersHaveScores = homeTeamPlayersWithScores === homeTeamScores.length && homeTeamPlayersWithScores > 0;
            const allAwayPlayersHaveScores = awayTeamPlayersWithScores === awayTeamScores.length && awayTeamPlayersWithScores > 0;

            if (allHomePlayersHaveScores && allAwayPlayersHaveScores) {
                // Add to team total scores
                results.home_team.total_score += homeTeamHoleTotal;
                results.away_team.total_score += awayTeamHoleTotal;

                // Determine team point for this hole
                if (homeTeamHoleTotal < awayTeamHoleTotal) {
                    // Home team wins hole
                    results.home_team.total_points += 1;
                    results.home_team.total_points_by_hole[holeIndex] = 1;
                    results.away_team.total_points_by_hole[holeIndex] = 0;
                } else if (awayTeamHoleTotal < homeTeamHoleTotal) {
                    // Away team wins hole
                    results.away_team.total_points += 1;
                    results.away_team.total_points_by_hole[holeIndex] = 1;
                    results.home_team.total_points_by_hole[holeIndex] = 0;
                } else {
                    // Tie - no points
                    results.home_team.total_points_by_hole[holeIndex] = 0;
                    results.away_team.total_points_by_hole[holeIndex] = 0;
                }
            } else {
                // Mark hole as not fully played for team points
                results.home_team.total_points_by_hole[holeIndex] = null;
                results.away_team.total_points_by_hole[holeIndex] = null;
            }
        });

        // Set results in state
        setMatchResults(results);
    };

    const toggleEditMode = async () => {
        if (editMode) {
            // If leaving edit mode, save changes
            await handleSaveScores();
        } else {
            // Just entering edit mode, no need to save
            setEditMode(true);
        }
    };

    const handleSaveScores = async () => {
        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // Make sure match results are calculated before saving
            calculateMatchResults();

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

            const isUpdate = match.is_completed && editMode;

            // Send scores and match results to the API
            const response = await fetch(`${env.API_BASE_URL}/matches/${matchId}/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    scores: allScores,
                    match_results: matchResults,
                    is_completed: true,
                    is_update: isUpdate // Add flag to indicate this is an update to existing scores
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save scores');
            }

            setSuccessMessage(isUpdate ? 'Scores updated successfully!' : 'Scores saved successfully!');

            // Exit edit mode if we were in it
            if (editMode) {
                setEditMode(false);
            }

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

    const MatchResultsSummary = ({ results }) => {
        if (!results) return null;

        return (
            <Paper sx={{ p: 3, mt: 3, bgcolor: 'background.paper' }}>
                <Typography variant="h6" gutterBottom>Match Results</Typography>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {results.home_team.name}
                        </Typography>
                        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                            {results.home_team.total_points}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Team Total: {results.home_team.total_score}
                            {results.home_team.team_point ? ' (+1 point)' : ''}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {results.away_team.name}
                        </Typography>
                        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                            {results.away_team.total_points}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Team Total: {results.away_team.total_score}
                            {results.away_team.team_point ? ' (+1 point)' : ''}
                        </Typography>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Individual Results
                </Typography>

                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell
                                    sx={{
                                        fontWeight: 'bold',
                                        borderRight: '1px solid rgba(224, 224, 224, 1)',
                                        bgcolor: 'rgba(33, 150, 243, 0.1)'
                                    }}
                                >
                                    Home Player
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{
                                        fontWeight: 'bold',
                                        borderRight: '1px solid rgba(224, 224, 224, 1)',
                                        bgcolor: 'rgba(33, 150, 243, 0.1)'
                                    }}
                                >
                                    Score
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{
                                        fontWeight: 'bold',
                                        borderRight: '2px solid rgba(0, 0, 0, 0.2)', // Stronger border here
                                        bgcolor: 'rgba(33, 150, 243, 0.1)'
                                    }}
                                >
                                    Points
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{
                                        fontWeight: 'bold',
                                        bgcolor: 'rgba(244, 67, 54, 0.1)'
                                    }}
                                >
                                    Points
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{
                                        fontWeight: 'bold',
                                        bgcolor: 'rgba(244, 67, 54, 0.1)'
                                    }}
                                >
                                    Score
                                </TableCell>
                                <TableCell
                                    sx={{
                                        fontWeight: 'bold',
                                        bgcolor: 'rgba(244, 67, 54, 0.1)'
                                    }}
                                >
                                    Away Player
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {results.home_team.players.map((homePlayer, index) => {
                                const awayPlayer = results.away_team.players[index];

                                return (
                                    <TableRow key={`pairing-${index}`}>
                                        <TableCell>
                                            {homePlayer.player_name}
                                            {homePlayer.handicap !== undefined && homePlayer.handicap !== null && (
                                                <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                                    Handicap: {homePlayer.handicap}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">{homePlayer.score || '-'}</TableCell>
                                        <TableCell align="center" sx={{
                                            fontWeight: 'bold',
                                            color: homePlayer.points > 0 ? 'success.main' : 'text.secondary'
                                        }}>
                                            {homePlayer.points}
                                        </TableCell>
                                        <TableCell align="center" sx={{
                                            fontWeight: 'bold',
                                            color: awayPlayer.points > 0 ? 'success.main' : 'text.secondary'
                                        }}>
                                            {awayPlayer.points}
                                        </TableCell>
                                        <TableCell align="center">{awayPlayer.score || '-'}</TableCell>
                                        <TableCell>
                                            {awayPlayer.player_name}
                                            {awayPlayer.handicap !== undefined && awayPlayer.handicap !== null && (
                                                <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                                    Handicap: {awayPlayer.handicap}
                                                </Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>Team Total</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                    {results.home_team.total_score}
                                </TableCell>
                                <TableCell align="center" sx={{
                                    fontWeight: 'bold',
                                    color: results.home_team.total_points_by_hole.filter(p => p === 1).length > 0 ? 'success.main' : 'text.secondary'
                                }}>
                                    {results.home_team.total_points_by_hole.filter(p => p === 1).length}
                                </TableCell>
                                <TableCell align="center" sx={{
                                    fontWeight: 'bold',
                                    color: results.away_team.total_points_by_hole.filter(p => p === 1).length > 0 ? 'success.main' : 'text.secondary'
                                }}>
                                    {results.away_team.total_points_by_hole.filter(p => p === 1).length}
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                    {results.away_team.total_score}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Team Total</TableCell>
                            </TableRow>
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Total Points</TableCell>
                                <TableCell align="center" sx={{
                                    fontWeight: 'bold',
                                    color: 'primary.main',
                                    fontSize: '1.1rem'
                                }}>
                                    {results.home_team.total_points}
                                </TableCell>
                                <TableCell align="center" sx={{
                                    fontWeight: 'bold',
                                    color: 'primary.main',
                                    fontSize: '1.1rem'
                                }}>
                                    {results.away_team.total_points}
                                </TableCell>
                                <TableCell colSpan={2} sx={{ textAlign: 'right', fontWeight: 'bold' }}>Total Points</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </TableContainer>

                <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Scoring System
                    </Typography>
                    <Typography variant="body2">
                        • 1 point awarded for each player with the lowest individual score (no points for ties)
                    </Typography>
                    <Typography variant="body2">
                        • 1 additional point awarded to the team with the lowest combined total (no points for ties)
                    </Typography>
                </Box>
            </Paper>
        );
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
                <Alert severity="warning" sx={{ my: 1 }}>
                    Course information is not available.
                </Alert>
            );
        }

        // Determine which property to use for hole number and par
        const holeNumberProp = 'hole_number' in holes[0] ? 'hole_number' : 'number';
        const parProp = 'par' in holes[0] ? 'par' : 'par';
        const yardsProp = 'yards' in holes[0] ? 'yards' : 'yards';
        const handicapProp = 'handicap' in holes[0] ? 'handicap' : 'handicap';

        // Create a vertical layout for mobile-friendly score entry
        return (
            <Box>
                {/* Player names in horizontal list at top */}
                <Paper sx={{ mb: 1, p: 0.5, bgcolor: 'background.paper' }}>
                    <Grid container spacing={0.5} alignItems="center">
                        <Grid item xs={3} sx={{ fontWeight: 'bold', pl: 1 }}>
                            Hole
                        </Grid>
                        {teamScores.map((player, index) => (
                            <Grid item xs key={player.player_id} sx={{ textAlign: 'center' }}>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 'bold',
                                        fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                    }}
                                >
                                    {player.player_name.split(' ')[0]}
                                    {player.handicap !== undefined && player.handicap !== null && (
                                        <Box component="span" sx={{
                                            ml: 0.5,
                                            fontSize: '0.65rem',
                                            color: 'text.secondary',
                                            display: 'inline-block'
                                        }}>
                                            ({player.handicap})
                                        </Box>
                                    )}
                                </Typography>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>

                {/* Holes as rows with player scores as columns */}
                {holes.map((hole) => (
                    <Paper
                        key={hole.id}
                        sx={{
                            mb: 0.5,
                            p: 0.5,
                            bgcolor: hole[parProp] === 3 ? 'rgba(33, 150, 243, 0.05)' :
                                hole[parProp] === 5 ? 'rgba(255, 152, 0, 0.05)' :
                                    'background.paper'
                        }}
                    >
                        <Grid container spacing={0.5} alignItems="center">
                            {/* Hole info */}
                            <Grid item xs={3}>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Box
                                            sx={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mr: 0.5,
                                                fontWeight: 'bold',
                                                fontSize: '0.75rem'
                                            }}
                                        >
                                            {hole.number || hole.hole_number}
                                        </Box>
                                        <Typography variant="caption">
                                            Par {hole.par} • {hole.yards || '—'} yds
                                        </Typography>
                                    </Box>
                                    {hole.handicap !== undefined && hole.handicap !== null && (
                                        <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', mt: 0.5 }}>
                                            Hdcp: {hole.handicap || '—'}
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>

                            {/* Player score inputs */}
                            {teamScores.map((player, playerIndex) => {
                                const score = player.scores[hole.id] || '';

                                // Determine if this is the low score across ALL players for this hole
                                let isLowScore = false;
                                if (score !== '') {
                                    // Get all scores for this hole from both teams
                                    const allScoresForHole = [];

                                    // Get home team scores for this hole
                                    homeTeamScores.forEach(p => {
                                        const holeScore = p.scores[hole.id];
                                        if (holeScore !== undefined && holeScore !== '') {
                                            allScoresForHole.push(Number(holeScore));
                                        }
                                    });

                                    // Get away team scores for this hole
                                    awayTeamScores.forEach(p => {
                                        const holeScore = p.scores[hole.id];
                                        if (holeScore !== undefined && holeScore !== '') {
                                            allScoresForHole.push(Number(holeScore));
                                        }
                                    });

                                    // Only highlight if this is the absolute lowest score
                                    // and there is more than one score to compare
                                    const numScore = Number(score);
                                    isLowScore = allScoresForHole.length > 1 &&
                                        numScore === Math.min(...allScoresForHole) &&
                                        allScoresForHole.filter(s => s === numScore).length === 1; // No ties
                                }

                                return (
                                    <Grid item xs key={`${player.player_id}-${hole.id}`} sx={{ textAlign: 'center' }}>
                                        <TextField
                                            type="number"
                                            variant="outlined"
                                            value={score}
                                            disabled={match.is_completed && !editMode} // Only disable if completed AND not in edit mode
                                            onChange={(e) => handleScoreChange(
                                                teamType,
                                                playerIndex,
                                                hole.id,
                                                e.target.value
                                            )}
                                            onKeyUp={(e) => {
                                                if (/^\d$/.test(e.key) && hole.id) {
                                                    const currentHoleIndex = holes.findIndex(h => h.id === hole.id);

                                                    // If this is the last hole for the current player
                                                    if (currentHoleIndex === holes.length - 1) {
                                                        // Find the next player to focus
                                                        if (playerIndex < teamScores.length - 1) {
                                                            // Move to next player's first hole
                                                            const nextInput = document.querySelector(
                                                                `[data-player-index="${playerIndex + 1}"][data-team-type="${teamType}"][data-hole-index="0"] input`
                                                            );
                                                            if (nextInput) {
                                                                nextInput.focus();
                                                            }
                                                        } else if (teamType === 'home') {
                                                            // If we're at the last player in home team, move to first player in away team
                                                            const firstAwayInput = document.querySelector(
                                                                `[data-player-index="0"][data-team-type="away"][data-hole-index="0"] input`
                                                            );
                                                            if (firstAwayInput) {
                                                                firstAwayInput.focus();
                                                            }
                                                        }
                                                        // If we're at the last away player's last hole, we're done
                                                    } else {
                                                        // Not the last hole, just move to the next hole for this player
                                                        const nextHoleId = holes[currentHoleIndex + 1].id;
                                                        const nextInput = document.querySelector(
                                                            `[data-player-index="${playerIndex}"][data-team-type="${teamType}"][data-hole-id="${nextHoleId}"] input`
                                                        );
                                                        if (nextInput) {
                                                            nextInput.focus();
                                                        }
                                                    }
                                                }
                                            }}
                                            inputProps={{
                                                inputMode: 'numeric',
                                                pattern: '[0-9]*',
                                                maxLength: 2,
                                                style: {
                                                    textAlign: 'center',
                                                    fontWeight: score !== '' ? 'bold' : 'normal',
                                                    padding: '2px'
                                                }
                                            }}
                                            sx={{
                                                width: '45px',
                                                '& .MuiOutlinedInput-root': {
                                                    backgroundColor: score !== '' ?
                                                        (isLowScore ? 'rgba(76, 175, 80, 0.2)' :
                                                            score === hole[parProp] ? 'rgba(33, 150, 243, 0.1)' :
                                                                score < hole[parProp] ? 'rgba(76, 175, 80, 0.1)' :
                                                                    score === hole[parProp] + 1 ? 'rgba(255, 152, 0, 0.1)' :
                                                                        'rgba(244, 67, 54, 0.1)') : 'white',
                                                    border: isLowScore ? '2px solid #4caf50' : undefined,
                                                },
                                                '& input': {
                                                    p: 0.5,
                                                    color: getScoreColor(score, hole[parProp])
                                                },
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderWidth: '1px'
                                                }
                                            }}
                                            size="small"
                                            data-player-index={playerIndex}
                                            data-team-type={teamType}
                                            data-hole-id={hole.id}
                                            data-hole-index={holes.findIndex(h => h.id === hole.id)}
                                        />
                                    </Grid>
                                );
                            })}
                        </Grid>

                        {/* Team total for this hole */}
                        <Grid container spacing={0.5} alignItems="center" sx={{ mt: 0.5, pt: 0.5, borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                            <Grid item xs={3}>
                                <Typography variant="caption" sx={{ pl: 0.5, fontSize: '0.65rem' }}>Team Total</Typography>
                            </Grid>
                            <Grid item xs={9} sx={{ textAlign: 'center' }}>
                                {(() => {
                                    // Calculate team total for this hole
                                    let teamTotal = 0;
                                    let completedScores = 0;

                                    teamScores.forEach(player => {
                                        const score = player.scores[hole.id];
                                        if (score !== undefined && score !== '') {
                                            teamTotal += Number(score);
                                            completedScores++;
                                        }
                                    });

                                    const hasCompleteScores = completedScores === teamScores.length;

                                    // Check if this is the low team total
                                    let isLowTeamTotal = false;
                                    if (hasCompleteScores) {
                                        const otherTeamScores = teamType === 'home' ? awayTeamScores : homeTeamScores;
                                        let otherTeamTotal = 0;
                                        let otherTeamComplete = true;

                                        otherTeamScores.forEach(player => {
                                            const score = player.scores[hole.id];
                                            if (score !== undefined && score !== '') {
                                                otherTeamTotal += Number(score);
                                            } else {
                                                otherTeamComplete = false;
                                            }
                                        });

                                        isLowTeamTotal = otherTeamComplete && teamTotal < otherTeamTotal;
                                    }

                                    return (
                                        <Box
                                            sx={{
                                                display: 'inline-block',
                                                minWidth: '2rem',
                                                fontWeight: 'bold',
                                                color: isLowTeamTotal ? 'white' : 'text.secondary',
                                                backgroundColor: isLowTeamTotal ? 'primary.main' : 'transparent',
                                                borderRadius: '4px',
                                                padding: '1px 6px',
                                                border: isLowTeamTotal ? '1px solid #1976d2' : 'none',
                                                fontSize: '0.75rem'
                                            }}
                                        >
                                            {hasCompleteScores ? teamTotal : '-'}
                                        </Box>
                                    );
                                })()}
                            </Grid>
                        </Grid>
                    </Paper>
                ))}

                {/* Totals row */}
                <Paper sx={{ mt: 1, p: 0.5, bgcolor: 'grey.100', fontWeight: 'bold' }}>
                    <Grid container spacing={0.5} alignItems="center">
                        <Grid item xs={3} sx={{ pl: 1 }}>
                            <Typography variant="caption">Total</Typography>
                        </Grid>
                        {teamScores.map((player) => {
                            const total = calculatePlayerTotal(player);
                            const par = calculatePar();
                            const diff = total - par;
                            return (
                                <Grid item xs key={player.player_id} sx={{ textAlign: 'center' }}>
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center'
                                    }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 'bold',
                                                color: diff < 0 ? 'success.main' :
                                                    diff === 0 ? 'text.primary' : 'error.main'
                                            }}
                                        >
                                            {total || '-'}
                                        </Typography>
                                        {total > 0 && (
                                            <Typography variant="caption" sx={{
                                                fontSize: '0.65rem',
                                                color: diff < 0 ? 'success.main' :
                                                    diff === 0 ? 'text.secondary' : 'error.main'
                                            }}>
                                                {diff < 0 ? diff : diff > 0 ? `+${diff}` : 'E'}
                                            </Typography>
                                        )}
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Paper>
            </Box>
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

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 1 }}>
                    <Typography variant="h6" gutterBottom>
                        Match Scorecard
                    </Typography>

                    {/* Combined score entry for both teams */}
                    <Grid container spacing={1}>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 1, mb: 1, bgcolor: 'rgba(33, 150, 243, 0.05)' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    {match.home_team?.name || 'Home'} Team
                                </Typography>
                                {homeTeamScores.length > 0 ? (
                                    renderScoreTable(homeTeamScores, 'home')
                                ) : (
                                    <Alert severity="info" sx={{ mt: 1 }}>
                                        No players found for home team.
                                    </Alert>
                                )}
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 1, mb: 1, bgcolor: 'rgba(244, 67, 54, 0.05)' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    {match.away_team?.name || 'Away'} Team
                                </Typography>
                                {awayTeamScores.length > 0 ? (
                                    renderScoreTable(awayTeamScores, 'away')
                                ) : (
                                    <Alert severity="info" sx={{ mt: 1 }}>
                                        No players found for away team.
                                    </Alert>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>

            <MatchResultsSummary results={matchResults} />

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