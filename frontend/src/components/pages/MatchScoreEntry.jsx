import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Box, Paper, Typography, Button, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, IconButton, Tabs, Tab, Divider, Chip, Grid, TableFooter,
    Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Save as SaveIcon,
    GolfCourse as CourseIcon,
    Edit as EditIcon,
    Check as CheckIcon,
    PersonAdd as SubstituteIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import format from 'date-fns/format';
import env from '../../config/env';
import MatchHeader from './MatchScoreEntry/MatchHeader';

// Add this function to sort holes by handicap for pop application

const prepareHolesForHandicaps = (holes) => {
    if (!holes || holes.length === 0) return [];

    // Create a copy of the holes array with only valid handicaps
    const holesWithHandicaps = holes
        .filter(hole => hole.handicap !== null && hole.handicap !== undefined)
        .map(hole => ({
            id: hole.id,
            handicap: hole.handicap
        }));

    // Sort holes by handicap value (lowest to highest)
    return holesWithHandicaps.sort((a, b) => a.handicap - b.handicap);
};

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

    // Keep a sorted reference of holes by handicap
    const sortedHolesByHandicap = useMemo(() => {
        return prepareHolesForHandicaps(holes);
    }, [holes]);

    // Match results state
    const [matchResults, setMatchResults] = useState(null);

    // Add these state variables inside the MatchScoreEntry component
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

    // Add this function inside the MatchScoreEntry component
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

            // Apply pops based on lowest handicap
            const homeScoresWithPops = calculatePlayerPops(homeScores, awayTeamData.players);

            console.log('Initialized home team scores for', homeScoresWithPops.length, 'players');
            setHomeTeamScores(homeScoresWithPops);
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

            // Apply pops based on lowest handicap
            const awayScoresWithPops = calculatePlayerPops(awayScores, homeTeamData.players);

            console.log('Initialized away team scores for', awayScoresWithPops.length, 'players');
            setAwayTeamScores(awayScoresWithPops);
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

    const initializePlayerScores = async (matchData = match, leagueData = league) => {
        if (!matchData || !leagueData) return;

        try {
            // Fetch match players from the match_players table
            const response = await fetch(`${env.API_BASE_URL}/matches/${matchData.id}/players`);

            if (!response.ok) {
                console.error('Failed to fetch match players:', response.status);
                throw new Error(`Failed to fetch match players: ${response.status}`);
            }

            const matchPlayersData = await response.json();
            console.log('Match players data:', matchPlayersData);

            // Group players by team and filter for active players only
            const homeTeamPlayers = matchPlayersData
                .filter(mp => mp.team_id === matchData.home_team_id && mp.is_active)
                .map(mp => mp.player);

            const awayTeamPlayers = matchPlayersData
                .filter(mp => mp.team_id === matchData.away_team_id && mp.is_active)
                .map(mp => mp.player);

            console.log('Home team players from match_players:', homeTeamPlayers);
            console.log('Away team players from match_players:', awayTeamPlayers);

            // If we have no players from match_players, fall back to initializing from league teams
            if (homeTeamPlayers.length === 0 || awayTeamPlayers.length === 0) {
                console.warn('No match players found, initializing from league teams');

                // Find the teams in the league
                const homeTeam = leagueData.teams.find(t => t.id === matchData.home_team_id);
                const awayTeam = leagueData.teams.find(t => t.id === matchData.away_team_id);

                // Create a new endpoint request to initialize match_players
                try {
                    const initPlayersResponse = await fetch(`${env.API_BASE_URL}/matches/${matchData.id}/initialize-players`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            home_team_id: matchData.home_team_id,
                            away_team_id: matchData.away_team_id
                        }),
                    });

                    if (initPlayersResponse.ok) {
                        console.log('Successfully initialized match players from teams');
                        // Refresh the data after initialization
                        return await initializePlayerScores(matchData, leagueData);
                    }
                } catch (initError) {
                    console.error('Error initializing match players:', initError);
                }

                // If we couldn't initialize match_players, use the league team data directly
                if (homeTeam && homeTeam.players) {
                    const homeScores = homeTeam.players.map(player => ({
                        player_id: player.id,
                        player_name: formatPlayerName(player),
                        first_name: player.first_name,
                        last_name: player.last_name,
                        email: player.email,
                        handicap: player.handicap || 0,
                        scores: {},
                        is_substitute: false
                    }));
                    setHomeTeamScores(calculatePlayerPops(homeScores, awayTeam?.players || []));
                }

                if (awayTeam && awayTeam.players) {
                    const awayScores = awayTeam.players.map(player => ({
                        player_id: player.id,
                        player_name: formatPlayerName(player),
                        first_name: player.first_name,
                        last_name: player.last_name,
                        email: player.email,
                        handicap: player.handicap || 0,
                        scores: {},
                        is_substitute: false
                    }));
                    setAwayTeamScores(calculatePlayerPops(awayScores, homeTeam?.players || []));
                }
            } else {
                // Create player score objects for home team from match_players data
                const homeScores = homeTeamPlayers.map(player => {
                    // Get the match_player record to check if this is a substitute
                    const matchPlayer = matchPlayersData.find(mp =>
                        mp.team_id === matchData.home_team_id && mp.player_id === player.id
                    );

                    return {
                        player_id: player.id,
                        player_name: formatPlayerName(player),
                        first_name: player.first_name,
                        last_name: player.last_name,
                        email: player.email,
                        handicap: player.handicap || 0,
                        scores: {},
                        is_substitute: matchPlayer?.is_substitute || false
                    };
                });

                // Create player score objects for away team from match_players data
                const awayScores = awayTeamPlayers.map(player => {
                    // Get the match_player record to check if this is a substitute
                    const matchPlayer = matchPlayersData.find(mp =>
                        mp.team_id === matchData.away_team_id && mp.player_id === player.id
                    );

                    return {
                        player_id: player.id,
                        player_name: formatPlayerName(player),
                        first_name: player.first_name,
                        last_name: player.last_name,
                        email: player.email,
                        handicap: player.handicap || 0,
                        scores: {},
                        is_substitute: matchPlayer?.is_substitute || false
                    };
                });

                // Apply handicap calculations for both teams
                setHomeTeamScores(calculatePlayerPops(homeScores, awayScores));
                setAwayTeamScores(calculatePlayerPops(awayScores, homeScores));
            }

            // Fetch existing scores if any
            if (matchData.id) {
                fetchExistingScores(matchData.id);
            }
        } catch (error) {
            console.error('Error initializing player scores:', error);
            setError('Failed to initialize player scores: ' + error.message);
        }
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

    // Update fetchExistingScores function to use handicaps from match_players
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

            // Create a map of player scores for easy lookup
            const playerScores = {};

            // Process existing scores if any
            if (data.scores && data.scores.length > 0) {
                // Group scores by player
                data.scores.forEach(score => {
                    if (!playerScores[score.player_id]) {
                        playerScores[score.player_id] = {};
                    }
                    playerScores[score.player_id][score.hole_id] = score.strokes;
                });

                console.log('Organized player scores:', playerScores);
            }

            // Process player data with active players only
            if (data.match_players) {
                // Get only active players
                const activeMatchPlayers = data.match_players.filter(mp => mp.is_active);

                // Initialize team scores with active player data from API
                const homePlayersData = activeMatchPlayers
                    .filter(mp => mp.team_id === match.home_team_id)
                    .map(mp => {
                        // Use handicap from match_players table instead of player.handicap
                        return {
                            player_id: mp.player_id,
                            player_name: formatPlayerName(mp.player),
                            first_name: mp.player.first_name,
                            last_name: mp.player.last_name,
                            email: mp.player.email,
                            // Use mp.handicap from match_players instead of player's current handicap
                            handicap: mp.handicap || mp.player.handicap || 0,
                            scores: playerScores[mp.player_id] || {},
                            is_substitute: mp.is_substitute || false
                        };
                    });

                const awayPlayersData = activeMatchPlayers
                    .filter(mp => mp.team_id === match.away_team_id)
                    .map(mp => {
                        return {
                            player_id: mp.player_id,
                            player_name: formatPlayerName(mp.player),
                            first_name: mp.player.first_name,
                            last_name: mp.player.last_name,
                            email: mp.player.email,
                            // Use mp.handicap from match_players instead of player's current handicap
                            handicap: mp.handicap || mp.player.handicap || 0,
                            scores: playerScores[mp.player_id] || {},
                            is_substitute: mp.is_substitute || false
                        };
                    });

                console.log(`Got ${homePlayersData.length} home players and ${awayPlayersData.length} away players from API`);
                console.log('Home players data with handicaps from match_players:', homePlayersData);
                console.log('Away players data with handicaps from match_players:', awayPlayersData);

                // Apply pops based on lowest handicap
                setHomeTeamScores(calculatePlayerPops(homePlayersData, awayPlayersData));
                setAwayTeamScores(calculatePlayerPops(awayPlayersData, homePlayersData));
            }

            // Force a recalculation of match results
            if (homeTeamScores.length > 0 && awayTeamScores.length > 0) {
                setTimeout(() => {
                    console.log('Forcing match results calculation with loaded scores');
                    calculateMatchResults();
                }, 500);
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

        // Auto-tab to next field if a single digit was entered
        if (score !== '' && score < 10) {
            // Use setTimeout to ensure state has updated before we try to focus next field
            setTimeout(() => {
                const nextInput = getNextInputField(teamType, playerIndex, holeId);
                if (nextInput) {
                    nextInput.focus();
                }
            }, 50);
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
            // Use the specific return path if provided
            navigate(location.state.returnTo);
        } else if (match && match.league_id && match.week_id) {
            // Navigate back to the league management page with the specific week selected
            navigate(`/leagues/${match.league_id}/manage`, {
                state: {
                    selectedWeekId: match.week_id
                }
            });
        } else {
            // Fallback to leagues list
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

    // Update the calculateMatchResults function to use net scores

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
                pops: homePlayer.pops || 0,
                score: 0,
                score_net: 0,
                points: 0,
                points_by_hole: Array(holes.length).fill(null),
                opponent_id: awayPlayer.player_id,
                opponent_name: awayPlayer.player_name,
            });

            results.away_team.players.push({
                player_id: awayPlayer.player_id,
                player_name: awayPlayer.player_name,
                handicap: awayPlayer.handicap,
                pops: awayPlayer.pops || 0,
                score: 0,
                score_net: 0,
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
            let homeTeamNetHoleTotal = 0;
            let awayTeamNetHoleTotal = 0;
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
                    const netHomeScore = calculateNetScore(homeScore, homePlayer.pops, hole);

                    allPlayersForHole.push({
                        team: 'home',
                        playerIndex: i,
                        gross: numHomeScore,
                        net: netHomeScore
                    });

                    // Add to player's total score
                    results.home_team.players[i].score += numHomeScore;
                    results.home_team.players[i].score_net = results.home_team.players[i].score - homePlayer.handicap;

                    // Add to team total for this hole
                    homeTeamHoleTotal += numHomeScore;
                    homeTeamNetHoleTotal += netHomeScore;
                    homeTeamPlayersWithScores++;
                }

                // Add away player score if available
                if (awayScore !== undefined && awayScore !== '') {
                    const numAwayScore = Number(awayScore);
                    const netAwayScore = calculateNetScore(awayScore, awayPlayer.pops, hole);

                    allPlayersForHole.push({
                        team: 'away',
                        playerIndex: i,
                        gross: numAwayScore,
                        net: netAwayScore
                    });

                    // Add to player's total score
                    results.away_team.players[i].score += numAwayScore;
                    results.away_team.players[i].score_net = results.away_team.players[i].score - awayPlayer.handicap;

                    // Add to team total for this hole
                    awayTeamHoleTotal += numAwayScore;
                    awayTeamNetHoleTotal += netAwayScore;
                    awayTeamPlayersWithScores++;
                }
            }

            // Find the lowest net score(s) for this hole
            if (allPlayersForHole.length > 0) {
                // Sort by net score (lowest first)
                allPlayersForHole.sort((a, b) => a.net - b.net);

                // Get the lowest net score
                const lowestNetScore = allPlayersForHole[0].net;

                // Find all players with the lowest net score
                const lowestNetScorePlayers = allPlayersForHole.filter(p => p.net === lowestNetScore);

                // Group lowest net scores by team
                const groupedByTeam = {};
                lowestNetScorePlayers.forEach(player => {
                    if (!groupedByTeam[player.team]) {
                        groupedByTeam[player.team] = [];
                    }
                    groupedByTeam[player.team].push(player);
                });

                // Check if only one team has players with the lowest net score and more than one player
                const teamsWithLowestScore = Object.keys(groupedByTeam);

                if (teamsWithLowestScore.length === 1) {
                    const teamWithLowScore = teamsWithLowestScore[0];
                    const playersWithLowScore = groupedByTeam[teamWithLowScore];

                    // If there's exactly one player with the low score, give them 1 point
                    if (playersWithLowScore.length === 1) {
                        const winner = playersWithLowScore[0];
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
                    // If there are multiple players from the same team with the low score,
                    // give each a half point, but NO additional team point
                    else if (playersWithLowScore.length > 1) {
                        // Award 0.5 points to each player with lowest net score
                        playersWithLowScore.forEach(player => {
                            if (player.team === 'home') {
                                results.home_team.players[player.playerIndex].points += 0.5;
                                results.home_team.players[player.playerIndex].points_by_hole[holeIndex] = 0.5;
                                results.home_team.total_points += 0.5;
                            } else {
                                results.away_team.players[player.playerIndex].points += 0.5;
                                results.away_team.players[player.playerIndex].points_by_hole[holeIndex] = 0.5;
                                results.away_team.total_points += 0.5;
                            }
                        });

                        // REMOVED: The additional team point for multiple low scores
                    }
                } else if (lowestNetScorePlayers.length === 1) {
                    // Single player with lowest net score - award 1 point
                    const winner = lowestNetScorePlayers[0];

                    if (winner.team === 'home') {
                        results.home_team.players[winner.playerIndex].points += 1;
                        results.home_team.players[winner.playerIndex].points_by_hole[holeIndex] = 1;
                        results.home_team.total_points += 1;
                    } else {
                        results.away_team.players[winner.playerIndex].points += 1;
                        results.away_team.players[winner.playerIndex].points_by_hole[holeIndex] = 1;
                        results.away_team.total_points += 1;
                    }
                } else {
                    // Players from different teams tied - no points awarded
                }
            }

            // Calculate and award team point for this hole
            const allHomePlayersHaveScores = homeTeamPlayersWithScores === homeTeamScores.length && homeTeamPlayersWithScores > 0;
            const allAwayPlayersHaveScores = awayTeamPlayersWithScores === awayTeamScores.length && awayTeamPlayersWithScores > 0;

            if (allHomePlayersHaveScores && allAwayPlayersHaveScores) {
                // Add to team total scores (gross)
                results.home_team.total_score += homeTeamHoleTotal;
                results.away_team.total_score += awayTeamHoleTotal;

                // Determine team point for this hole based on NET scores
                if (homeTeamNetHoleTotal < awayTeamNetHoleTotal) {
                    // Home team wins hole
                    results.home_team.total_points += 1;
                    results.home_team.total_points_by_hole[holeIndex] = 1;
                    results.away_team.total_points_by_hole[holeIndex] = 0;
                } else if (awayTeamNetHoleTotal < homeTeamNetHoleTotal) {
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

    // Update the handleSaveScores function to save player data
    const handleSaveScores = async () => {
        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // Make sure match results are calculated before saving
            calculateMatchResults();

            // Wait a moment to ensure calculation completes
            await new Promise(resolve => setTimeout(resolve, 100));

            // Check if matchResults is available
            if (!matchResults) {
                console.error("Match results not available");
                throw new Error("Failed to calculate match results");
            }

            console.log("Match results:", matchResults);

            // Combine home and away team scores into a single array
            const allScores = [];

            // Track substitutes used in this match
            const substitutes = [];

            // Track player summary data
            const playerSummaries = [];

            // Process home team scores
            homeTeamScores.forEach((player, index) => {
                // Add this player to substitutes list if marked as substitute
                if (player.is_substitute) {
                    substitutes.push({
                        player_id: player.player_id,
                        team_type: 'home'
                    });
                }

                // Calculate gross score for this player
                const grossScore = calculatePlayerTotal(player);

                // Calculate net score (gross - handicap)
                const netScore = grossScore - (player.handicap || 0);

                // Get player results from matchResults
                const playerResults = matchResults?.home_team?.players[index];

                // Add player summary data for match_players
                playerSummaries.push({
                    player_id: player.player_id,
                    team_id: match.home_team_id,
                    handicap: player.handicap || 0,
                    pops: player.pops || 0,
                    gross_score: grossScore,
                    net_score: netScore,
                    points: playerResults?.points || 0,
                    is_substitute: player.is_substitute || false
                });

                // Add individual hole scores
                Object.entries(player.scores).forEach(([holeId, strokes]) => {
                    if (strokes !== '') { // Only send valid scores
                        allScores.push({
                            player_id: player.player_id,
                            hole_id: parseInt(holeId, 10),
                            strokes: parseInt(strokes, 10)
                        });
                    }
                });
            });

            // Process away team scores
            awayTeamScores.forEach((player, index) => {
                // Add this player to substitutes list if marked as substitute
                if (player.is_substitute) {
                    substitutes.push({
                        player_id: player.player_id,
                        team_type: 'away'
                    });
                }

                // Calculate gross score for this player
                const grossScore = calculatePlayerTotal(player);

                // Calculate net score (gross - handicap)
                const netScore = grossScore - (player.handicap || 0);

                // Get player results from matchResults
                const playerResults = matchResults?.away_team?.players[index];

                // Add player summary data for match_players
                playerSummaries.push({
                    player_id: player.player_id,
                    team_id: match.away_team_id,
                    handicap: player.handicap || 0,
                    pops: player.pops || 0,
                    gross_score: grossScore,
                    net_score: netScore,
                    points: playerResults?.points || 0,
                    is_substitute: player.is_substitute || false
                });

                // Add individual hole scores
                Object.entries(player.scores).forEach(([holeId, strokes]) => {
                    if (strokes !== '') { // Only send valid scores
                        allScores.push({
                            player_id: player.player_id,
                            hole_id: parseInt(holeId, 10),
                            strokes: parseInt(strokes, 10)
                        });
                    }
                });
            });

            const isUpdate = match.is_completed && editMode;

            // Create team summary data with explicit values (not relying on optional chaining)
            const teamSummary = {
                home_team_gross_score: matchResults.home_team.total_score,
                home_team_net_score: calculateTeamNetTotal(matchResults.home_team.players),
                home_team_points: matchResults.home_team.total_points,
                away_team_gross_score: matchResults.away_team.total_score,
                away_team_net_score: calculateTeamNetTotal(matchResults.away_team.players),
                away_team_points: matchResults.away_team.total_points
            };

            console.log("Team summary:", teamSummary);

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
                    is_update: isUpdate,
                    substitute_players: substitutes,
                    player_summaries: playerSummaries,
                    ...teamSummary
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

            // Update the match object to reflect completion and team points
            setMatch({
                ...match,
                is_completed: true,
                ...teamSummary,
                substitute_players: substitutes
            });

        } catch (error) {
            console.error('Error saving scores:', error);
            setError('Failed to save scores. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Update the calculatePlayerPops function to use the lowest handicap across all players

    const calculatePlayerPops = (teamScores, otherTeamScores = []) => {
        if (!teamScores || teamScores.length === 0) return [];

        // Combine players from both teams to find the overall lowest handicap
        const allPlayers = [...teamScores, ...(otherTeamScores || [])];

        // Find the lowest handicap among all players
        const lowestHandicap = Math.min(...allPlayers.map(player =>
            player.handicap !== null && player.handicap !== undefined ? player.handicap : Infinity
        ));

        console.log('Lowest handicap across all players:', lowestHandicap);

        // Calculate pops for each player based on the overall lowest handicap
        return teamScores.map(player => ({
            ...player,
            pops: player.handicap !== null && player.handicap !== undefined
                ? Math.max(0, player.handicap - lowestHandicap)
                : 0
        }));
    };

    // Update the calculateNetScore function to handle courses with any number of holes

    const calculateNetScore = (score, pops, hole) => {
        if (score === '' || score === undefined) return '';

        // If the player has no pops or hole has no handicap, the net score is the same as gross
        if (!pops || !hole.handicap === undefined || hole.handicap === null) return Number(score);

        // Get the total number of holes in the course
        const totalHoles = holes.length;

        // For a course with fewer than 18 holes, we need to adjust how pops are distributed
        // Calculate how many "complete rounds" of pops to give across all holes
        const fullRounds = Math.floor(pops / totalHoles);

        // Calculate remaining pops to distribute based on hole handicap
        const remainingPops = pops % totalHoles;

        // All holes get the full rounds of strokes
        let strokesGiven = fullRounds;

        // Find this hole's position in the sorted handicap list
        const sortedHoles = prepareHolesForHandicaps(holes);
        const holePosition = sortedHoles.findIndex(h => h.id === hole.id);

        // If hole is one of the hardest holes (based on remaining pops), give an extra stroke
        // Note: Hole handicap ranks from 1 (hardest) to 18 (easiest)
        if (holePosition !== -1 && holePosition < remainingPops) {
            strokesGiven += 1;
        }

        // Return net score
        return Number(score) - strokesGiven;
    };

    const calculateTeamNetTotal = (players) => {
        return players.reduce((total, player) => {
            return total + (player.score_net || 0);
        }, 0);
    };

    const MatchResultsSummary = ({ results }) => {
        if (!results) return null;

        // Add this helper function inside the MatchResultsSummary component
        const calculateTeamNetTotal = (players) => {
            return players.reduce((sum, player) => {
                const playerNetScore = player.score - (player.handicap || 0);
                return sum + playerNetScore;
            }, 0);
        };

        return (
            <Paper sx={{ p: 3, mt: 3, bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Match Results</Typography>

                    {/* Add Recalculate button */}
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => calculateMatchResults()}
                        startIcon={<RefreshIcon />}
                        sx={{ fontSize: '0.8rem' }}
                    >
                        Recalculate
                    </Button>
                </Box>

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
                        </Typography>
                        {results.home_team.sweep_bonuses && results.home_team.sweep_bonuses.length > 0 && (
                            <Typography variant="body2" color="success.main" sx={{ fontWeight: 'medium' }}>
                                Team sweep bonus points: {results.home_team.sweep_bonuses.length}
                            </Typography>
                        )}
                        <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'medium' }}>
                            Net Total: {calculateTeamNetTotal(results.home_team.players)}
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
                        {/* Add net team total display */}
                        <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'medium' }}>
                            Net Total: {calculateTeamNetTotal(results.away_team.players)}
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
                                                    {homePlayer.pops > 0 && ` (Pops: ${homePlayer.pops})`}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            {homePlayer.score || '-'}
                                            {homePlayer.handicap > 0 && homePlayer.score > 0 && (
                                                <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                                    Net: {homePlayer.score - homePlayer.handicap}
                                                </Typography>
                                            )}
                                        </TableCell>
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
                                        <TableCell align="center">
                                            {awayPlayer.score || '-'}
                                            {awayPlayer.handicap > 0 && awayPlayer.score > 0 && (
                                                <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                                    Net: {awayPlayer.score - awayPlayer.handicap}
                                                </Typography>
                                            )}
                                        </TableCell>
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
                                    <Typography variant="caption" display="block" sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                                        Net: {calculateTeamNetTotal(results.home_team.players)}
                                    </Typography>
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
                                    <Typography variant="caption" display="block" sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                                        Net: {calculateTeamNetTotal(results.away_team.players)}
                                    </Typography>
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
                        • 1 point awarded to the player with the lowest individual net score
                    </Typography>
                    <Typography variant="body2">
                        • When players from the same team tie for lowest net score, each player earns 0.5 points
                    </Typography>
                    <Typography variant="body2">
                        • 1 point awarded to the team with the lowest combined net total
                    </Typography>
                    <Typography variant="body2">
                        • Player pops are calculated by subtracting the lowest handicap in the group from each player's handicap
                    </Typography>
                </Box>
            </Paper>
        );
    };

    // Update the handleOpenSubstituteDialog function to fetch available players

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

    const handleSubstituteChange = (e) => {
        const { name, value } = e.target;
        setCurrentSubstitute({
            ...currentSubstitute,
            substitute: {
                ...currentSubstitute.substitute,
                [name]: value
            }
        });
    };

    const handleSelectExistingPlayer = (playerId) => {
        const selectedPlayer = availablePlayers.find(p => p.id === playerId);
        if (selectedPlayer) {
            setCurrentSubstitute({
                ...currentSubstitute,
                substitute: {
                    player_id: selectedPlayer.id,
                    player_name: `${selectedPlayer.first_name} ${selectedPlayer.last_name}`,
                    handicap: selectedPlayer.handicap || 0,
                    is_substitute: true
                }
            });
        }
    };

    // Update the handleApplySubstitute function to round handicaps
    const handleApplySubstitute = async () => {
        const { teamType, playerIndex, originalPlayer, substitute } = currentSubstitute;
        let substituteFinal = { ...substitute };

        try {
            // If this is a new player (no player_id), save to database first
            if (!substitute.player_id && substitute.first_name) {
                try {
                    // Use the provided email or generate one if empty
                    const email = substitute.email || `temp_${Date.now()}@golftracker.example.com`;

                    // Round the handicap to the nearest whole number
                    const roundedHandicap = Math.round(parseFloat(substitute.handicap) || 0);

                    // Create the new player in the database
                    const response = await fetch(`${env.API_BASE_URL}/players`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            first_name: substitute.first_name,
                            last_name: substitute.last_name || '',
                            email: email,
                            handicap: roundedHandicap, // Use rounded handicap
                            team_id: null // Don't associate with any team
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Failed to save substitute player');
                    }

                    // Get the saved player data with ID
                    const savedPlayer = await response.json();

                    // Update our substitute with the saved player data
                    substituteFinal = {
                        player_id: savedPlayer.id,
                        player_name: `${savedPlayer.first_name} ${savedPlayer.last_name || ''}`.trim(),
                        handicap: savedPlayer.handicap,
                        is_substitute: true
                    };

                    console.log('Created new player in database:', savedPlayer);
                } catch (error) {
                    console.error('Error saving substitute player:', error);
                    setError('Failed to save substitute player. Using temporary substitute instead.');
                    // Continue with the temporary substitute even if saving failed
                    return;
                }
            } else if (substitute.player_id) {
                // For existing players, ensure their handicap is rounded
                substituteFinal.handicap = Math.round(parseFloat(substituteFinal.handicap) || 0);
            }

            // Determine team ID
            const teamId = teamType === 'home' ? match.home_team_id : match.away_team_id;

            // Update match_players table - add the substitute with rounded handicap
            const updateMatchPlayersResponse = await fetch(`${env.API_BASE_URL}/matches/${match.id}/players/substitute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    original_player_id: originalPlayer.player_id,
                    substitute_player_id: substituteFinal.player_id,
                    team_id: teamId,
                    is_substitute: true,
                    handicap: Math.round(parseFloat(substituteFinal.handicap) || 0) // Send the rounded handicap
                }),
            });

            if (!updateMatchPlayersResponse.ok) {
                throw new Error('Failed to update match players record');
            }

            // 2. Update the UI with the substitution
            // Copy current team scores
            let newHomeTeamScores = [...homeTeamScores];
            let newAwayTeamScores = [...awayTeamScores];

            // Apply the substitute to the appropriate team with rounded handicap
            if (teamType === 'home') {
                // Preserve existing scores when substituting
                const existingScores = newHomeTeamScores[playerIndex].scores;

                // Replace player but keep the scores, ensure handicap is rounded
                newHomeTeamScores[playerIndex] = {
                    ...substituteFinal,
                    handicap: Math.round(parseFloat(substituteFinal.handicap) || 0), // Ensure handicap is rounded in UI
                    scores: existingScores
                };
            } else {
                // Preserve existing scores when substituting
                const existingScores = newAwayTeamScores[playerIndex].scores;

                // Replace player but keep the scores, ensure handicap is rounded
                newAwayTeamScores[playerIndex] = {
                    ...substituteFinal,
                    handicap: Math.round(parseFloat(substituteFinal.handicap) || 0), // Ensure handicap is rounded in UI
                    scores: existingScores
                };
            }

            // Recalculate pops for BOTH teams at once to ensure proper calculation
            newHomeTeamScores = calculatePlayerPops(newHomeTeamScores, newAwayTeamScores);
            newAwayTeamScores = calculatePlayerPops(newAwayTeamScores, newHomeTeamScores);

            // Update state with new scores and pops
            setHomeTeamScores(newHomeTeamScores);
            setAwayTeamScores(newAwayTeamScores);

            setSubstituteDialogOpen(false);
            setSuccessMessage("Substitute player applied and recorded successfully!");

            // Force recalculation of match results
            setTimeout(() => {
                calculateMatchResults();
            }, 50);

        } catch (error) {
            console.error('Error applying substitute:', error);
            setError(`Failed to apply substitute: ${error.message}`);
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
                <Alert severity="warning" sx={{ my: 1 }}>
                    Course information is not available.
                </Alert>
            );
        }

        // Determine which property to use for hole number and par
        const holeNumberProp = 'hole_number' in holes[0] ? 'hole_number' : 'number';

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
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 'bold',
                                            fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                        }}
                                    >
                                        {player.player_name.split(' ')[0]}
                                        {player.is_substitute &&
                                            <Chip
                                                size="small"
                                                label="Sub"
                                                color="secondary"
                                                sx={{ ml: 0.5, height: 16, fontSize: '0.6rem' }}
                                            />
                                        }
                                    </Typography>

                                    {player.handicap !== undefined && player.handicap !== null && (
                                        <Box component="span" sx={{
                                            display: 'block',
                                            fontSize: '0.65rem',
                                            color: 'text.secondary'
                                        }}>
                                            Hdcp: {player.handicap}
                                            {player.pops > 0 && ` (Pops: ${player.pops})`}
                                        </Box>
                                    )}

                                    {/* Add substitute button */}
                                    {!match.is_completed || editMode ? (
                                        <IconButton
                                            size="small"
                                            onClick={() => handleOpenSubstituteDialog(teamType, index)}
                                            sx={{ padding: '2px', mt: 0.5 }}
                                        >
                                            <SubstituteIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                                        </IconButton>
                                    ) : null}
                                </Box>
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
                            height: '120px', // Fixed height for consistent alignment
                            display: 'flex',
                            flexDirection: 'column',
                            bgcolor: 'background.paper' // Use consistent background color for all holes
                        }}
                    >
                        <Grid container spacing={0.5} alignItems="flex-start" sx={{ flex: 1 }}>
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

                                // Determine if this is part of a low NET score group
                                let isLowScore = false;
                                let isTeamTiedLowScore = false;

                                if (score !== '') {
                                    // Calculate the net score for this player
                                    const netScore = calculateNetScore(score, player.pops, hole);

                                    // Get all net scores for this hole from both teams
                                    const allNetScoresForHole = [];
                                    const homeNetScoresForHole = [];
                                    const awayNetScoresForHole = [];

                                    // Get home team net scores for this hole
                                    homeTeamScores.forEach(p => {
                                        const holeScore = p.scores[hole.id];
                                        if (holeScore !== undefined && holeScore !== '') {
                                            const pNetScore = calculateNetScore(holeScore, p.pops, hole);
                                            allNetScoresForHole.push(pNetScore);
                                            homeNetScoresForHole.push(pNetScore);
                                        }
                                    });

                                    // Get away team net scores for this hole
                                    awayTeamScores.forEach(p => {
                                        const holeScore = p.scores[hole.id];
                                        if (holeScore !== undefined && holeScore !== '') {
                                            const pNetScore = calculateNetScore(holeScore, p.pops, hole);
                                            allNetScoresForHole.push(pNetScore);
                                            awayNetScoresForHole.push(pNetScore);
                                        }
                                    });

                                    // Find the lowest net score
                                    const lowestNetScore = Math.min(...allNetScoresForHole);

                                    // Count how many players have the lowest score on each team
                                    const homeTeamLowScoreCount = homeNetScoresForHole.filter(s => s === lowestNetScore).length;
                                    const awayTeamLowScoreCount = awayNetScoresForHole.filter(s => s === lowestNetScore).length;

                                    // Highlight individual lowest net score with no ties
                                    isLowScore = netScore === lowestNetScore &&
                                        ((homeTeamLowScoreCount + awayTeamLowScoreCount) === 1);

                                    // Highlight tied players on same team (when there are no ties on other team)
                                    isTeamTiedLowScore = netScore === lowestNetScore &&
                                        ((teamType === 'home' && homeTeamLowScoreCount > 1 && awayTeamLowScoreCount === 0) ||
                                            (teamType === 'away' && awayTeamLowScoreCount > 1 && homeTeamLowScoreCount === 0));
                                }

                                return (
                                    <Grid item xs key={`${player.player_id}-${hole.id}`} sx={{ textAlign: 'center' }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <TextField
                                                type="number"
                                                variant="outlined"
                                                value={score}
                                                disabled={match.is_completed && !editMode}
                                                onChange={(e) => handleScoreChange(
                                                    teamType,
                                                    playerIndex,
                                                    hole.id,
                                                    e.target.value
                                                )}
                                                onKeyUp={(e) => {
                                                    // Auto-tab to next input on Enter or Tab key
                                                    if (e.key === 'Enter' || e.key === 'Tab') {
                                                        const nextInput = getNextInputField(teamType, playerIndex, hole.id);
                                                        if (nextInput) {
                                                            // Only prevent default if we have a next input to focus
                                                            e.preventDefault();
                                                            nextInput.focus();
                                                        }
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Tab') {
                                                        const nextInput = getNextInputField(teamType, playerIndex, hole.id);
                                                        if (nextInput) {
                                                            e.preventDefault();
                                                            nextInput.focus();
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
                                                        backgroundColor: score !== ''
                                                            ? (isLowScore ? 'rgba(76, 175, 80, 0.2)' :
                                                                isTeamTiedLowScore ? 'rgba(156, 39, 176, 0.2)' : 'white')
                                                            : undefined,
                                                        border: isLowScore ? '2px solid #4caf50' :
                                                            isTeamTiedLowScore ? '2px solid #9c27b0' : undefined,
                                                    },
                                                    '& input': {
                                                        p: 0.5,
                                                        color: 'text.primary'
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

                                            {/* Net score display - show in purple for team-tied low scores */}
                                            {score !== '' && player.pops > 0 && (
                                                (() => {
                                                    const netScore = calculateNetScore(score, player.pops, hole);
                                                    // Only show net score if it's different from gross score
                                                    return Number(score) !== netScore ? (
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                fontSize: '0.65rem',
                                                                color: isTeamTiedLowScore ? 'secondary.main' : 'text.secondary',
                                                                mt: 0.5,
                                                                display: 'block',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            Net: {netScore}
                                                        </Typography>
                                                    ) : null;
                                                })()
                                            )}
                                        </Box>
                                    </Grid>
                                );
                            })}
                        </Grid>

                        {/* Team totals */}
                        <Grid container spacing={0.5} alignItems="center"
                            sx={{
                                mt: 'auto',
                                pt: 0.5,
                                borderTop: '1px dashed rgba(0,0,0,0.1)'
                            }}
                        >
                            <Grid item xs={3}>
                                <Typography variant="caption" sx={{ pl: 0.5, fontSize: '0.65rem' }}>Team Total</Typography>
                            </Grid>
                            <Grid item xs={9} sx={{ textAlign: 'center' }}>
                                {(() => {
                                    // Calculate team NET total for this hole
                                    let teamGrossTotal = 0;
                                    let teamNetTotal = 0;
                                    let completedScores = 0;

                                    teamScores.forEach(player => {
                                        const score = player.scores[hole.id];
                                        if (score !== undefined && score !== '') {
                                            // Add gross score to gross total
                                            teamGrossTotal += Number(score);

                                            // Calculate and add net score to net total
                                            const netScore = calculateNetScore(score, player.pops, hole);
                                            teamNetTotal += netScore;

                                            completedScores++;
                                        }
                                    });

                                    const hasCompleteScores = completedScores === teamScores.length;

                                    // Check if this is the low team NET total
                                    let isLowTeamTotal = false;
                                    if (hasCompleteScores) {
                                        const otherTeamScores = teamType === 'home' ? awayTeamScores : homeTeamScores;
                                        let otherTeamNetTotal = 0;
                                        let otherTeamComplete = true;

                                        otherTeamScores.forEach(player => {
                                            const score = player.scores[hole.id];
                                            if (score !== undefined && score !== '') {
                                                // Calculate and add net score
                                                const netScore = calculateNetScore(score, player.pops, hole);
                                                otherTeamNetTotal += netScore;
                                            } else {
                                                otherTeamComplete = false;
                                            }
                                        });

                                        isLowTeamTotal = otherTeamComplete && teamNetTotal < otherTeamNetTotal;
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
                                                border: isLowTeamTotal ? '1px solid #1976d2' : 'none'
                                            }}
                                        >
                                            {hasCompleteScores ? (
                                                <>
                                                    {teamGrossTotal}
                                                    {teamGrossTotal !== teamNetTotal && (
                                                        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem' }}>
                                                            Net: {teamNetTotal}
                                                        </Typography>
                                                    )}
                                                </>
                                            ) : '-'}
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

                                        {/* Net total - based on handicap, not pops */}
                                        {total > 0 && player.handicap > 0 && (
                                            <Typography variant="caption" sx={{
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold',
                                                color: 'primary.main',
                                                mt: 0.5
                                            }}>
                                                Net: {total - player.handicap}
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
            <MatchHeader
                match={match}
                error={error}
                successMessage={successMessage}
                saving={saving}
                editMode={editMode}
                handleBack={handleBack}
                handleSaveScores={handleSaveScores}
                toggleEditMode={toggleEditMode}
            />

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
                                <Box>
                                    {homeTeamScores.length > 0 ? (
                                        renderScoreTable(homeTeamScores, 'home')
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
                                        renderScoreTable(awayTeamScores, 'away')
                                    ) : (
                                        <Alert severity="info" sx={{ mt: 1 }}>
                                            No players found for away team.
                                        </Alert>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>

            <MatchResultsSummary
                results={matchResults}
                calculateMatchResults={calculateMatchResults}
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

            {/* Add the Substitute Player Dialog at the end of your return statement */}
            <Dialog open={substituteDialogOpen} onClose={handleCloseSubstituteDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Substitute Player
                    {currentSubstitute.originalPlayer && (
                        <Typography variant="subtitle2" color="text.secondary">
                            Replacing: {currentSubstitute.originalPlayer.player_name}
                        </Typography>
                    )}
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Select an existing player:
                        </Typography>
                        <Box sx={{ maxHeight: '200px', overflowY: 'auto', mb: 2 }}>
                            {availablePlayers.length > 0 ? (
                                <List dense>
                                    {availablePlayers.map(player => (
                                        <ListItem
                                            key={player.id}
                                            button
                                            onClick={() => handleSelectExistingPlayer(player.id)}
                                            selected={currentSubstitute.substitute.player_id === player.id}
                                        >
                                            <ListItemText
                                                primary={`${player.first_name} ${player.last_name}`}
                                                secondary={`Handicap: ${player.handicap || 0}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 2 }}>
                                    <CircularProgress size={24} sx={{ mb: 1 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Loading players...
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        <Divider sx={{ my: 2 }}>OR</Divider>

                        <Typography variant="subtitle2" gutterBottom>
                            Create a temporary substitute:
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="First Name"
                                    name="first_name"
                                    value={currentSubstitute.substitute.first_name || ''}
                                    onChange={handleSubstituteChange}
                                    fullWidth
                                    margin="normal"
                                    size="small"
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Last Name"
                                    name="last_name"
                                    value={currentSubstitute.substitute.last_name || ''}
                                    onChange={handleSubstituteChange}
                                    fullWidth
                                    margin="normal"
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                        <TextField
                            label="Email"
                            name="email"
                            type="email"
                            value={currentSubstitute.substitute.email || ''}
                            onChange={handleSubstituteChange}
                            fullWidth
                            margin="normal"
                            size="small"
                            helperText="Required for new player"
                            required
                        />
                        <TextField
                            label="Handicap"
                            name="handicap"
                            type="number"
                            value={currentSubstitute.substitute.handicap}
                            onChange={handleSubstituteChange}
                            fullWidth
                            margin="normal"
                            size="small"
                            InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseSubstituteDialog}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleApplySubstitute}
                        disabled={
                            !currentSubstitute.substitute.player_id && // If not selecting existing player
                            (!currentSubstitute.substitute.first_name || !currentSubstitute.substitute.email) // Require first name and email
                        }
                    >
                        Apply Substitute
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MatchScoreEntry;