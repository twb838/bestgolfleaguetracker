import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Typography,
    Box,
    Button,
    Paper,
    Tabs,
    Tab,
    CircularProgress,
    Breadcrumbs,
    Link,
    Chip,
    Divider,
    Card,
    CardContent,
    Grid,
    List,
    ListItem,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    FormControlLabel,
    Checkbox,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
    Paper as MuiPaper
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    SportsSoccer as TeamIcon,
    GolfCourse as CourseIcon,
    Event as EventIcon,
    EmojiEvents as TrophyIcon,
    Add as AddIcon,
    DateRange as WeekIcon,
    Delete as DeleteIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    Person as PersonIcon,
    Dangerous as DangerousIcon,
    Hotel as HotelIcon,
    Stars as StarsIcon,
    Star as StarIcon,
    EmojiEventsOutlined as TrophyOutlineIcon,
    Leaderboard as LeaderboardIcon
} from '@mui/icons-material';
import format from 'date-fns/format';
import env from '../../config/env';

function LeagueManagement() {
    const { leagueId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // League data - try to use passed state or fetch if not available
    const [league, setLeague] = useState(location.state?.league || null);
    const [loading, setLoading] = useState(!location.state?.league);
    const [error, setError] = useState(null);

    // UI state
    const [activeTab, setActiveTab] = useState(0);

    // Weeks and Matches state
    const [weeks, setWeeks] = useState([]);
    const [selectedWeekId, setSelectedWeekId] = useState(null);
    const [matches, setMatches] = useState([]);
    const [loadingMatches, setLoadingMatches] = useState(false);

    // New match dialog
    const [createMatchDialogOpen, setCreateMatchDialogOpen] = useState(false);
    const [newMatch, setNewMatch] = useState({
        match_date: format(new Date(), 'yyyy-MM-dd'),
        home_team_id: '',
        away_team_id: '',
        course_id: ''
    });

    // New week dialog
    const [createWeekDialogOpen, setCreateWeekDialogOpen] = useState(false);
    const [newWeek, setNewWeek] = useState({
        week_number: 1,
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(new Date().setDate(new Date().getDate() + 6)), 'yyyy-MM-dd')
    });

    const [generateMatchups, setGenerateMatchups] = useState(false);
    const [matchupConfig, setMatchupConfig] = useState({
        selectedTeams: [],
        selectedCourse: '',
        matchDate: format(new Date(), 'yyyy-MM-dd')
    });
    const [generatedMatchups, setGeneratedMatchups] = useState([]);
    const [matchupWarning, setMatchupWarning] = useState(null);

    // Add new state variables near the top of your component
    const [deleteWeekDialogOpen, setDeleteWeekDialogOpen] = useState(false);
    const [weekToDelete, setWeekToDelete] = useState(null);

    // State for all matches across all weeks
    const [allMatches, setAllMatches] = useState([]);
    const [loadingAllMatches, setLoadingAllMatches] = useState(false);

    // State for leaderboard data
    const [leaderboardData, setLeaderboardData] = useState([]);

    // Add these state variables with your other state declarations
    const [sortConfig, setSortConfig] = useState({
        key: 'win_percentage',
        direction: 'desc'
    });

    // Add with your other state declarations
    const [playerStats, setPlayerStats] = useState([]);
    const [loadingPlayerStats, setLoadingPlayerStats] = useState(false);
    const [playerStatsSortConfig, setPlayerStatsSortConfig] = useState({
        key: 'average_score',
        direction: 'asc'
    });

    // Add with your other state declarations
    const [rankingsData, setRankingsData] = useState({
        topIndividualGross: [],
        topIndividualNet: [],
        topTeamGross: [],
        topTeamNet: []
    });
    const [loadingRankings, setLoadingRankings] = useState(false);

    useEffect(() => {
        // If league data wasn't passed via navigation state, fetch it
        if (!league) {
            fetchLeagueDetails();
        } else {
            // If we have the league, fetch the weeks
            fetchWeeks();
        }
    }, [leagueId]);

    // When league data is loaded, fetch weeks
    useEffect(() => {
        if (league) {
            fetchWeeks();
        }
    }, [league]);

    // Update useEffect to fetch leaderboard when standings tab is selected
    useEffect(() => {
        if (activeTab === 1 && league?.id) {
            setLeaderboardData([]); // Clear previous data
            fetchLeagueLeaderboard().then(data => {
                setLeaderboardData(data);
            });
        }
    }, [activeTab, league?.id]);

    // Add this useEffect to handle week changes and always fetch matches when the selected week changes
    useEffect(() => {
        if (selectedWeekId && league?.id) {
            console.log("Selected week changed, fetching matches for:", selectedWeekId);
            fetchMatchesForWeek(selectedWeekId);
        }
    }, [selectedWeekId, league?.id]); // Only depend on selectedWeekId and league.id

    // Then update your existing location.state handler useEffect to avoid conflicts
    useEffect(() => {
        // Only handle the initial state from navigation
        if (location.state?.selectedWeekId) {
            const weekToSelect = location.state.selectedWeekId;

            // Clear the location state
            window.history.replaceState({}, document.title);

            // Just set the selected week - the other useEffect will handle fetching
            setSelectedWeekId(weekToSelect);
        } else if (weeks.length > 0 && !selectedWeekId) {
            // Default behavior - select first week if none is selected
            setSelectedWeekId(weeks[0].id);
        }
    }, [location.state, weeks, selectedWeekId]); // Remove league from dependencies

    // Add this useEffect
    useEffect(() => {
        if (activeTab === 2 && league?.id) {
            fetchPlayerStats();
        }
    }, [activeTab, league?.id]);

    useEffect(() => {
        if (activeTab === 3 && league?.id) {
            fetchRankingsData();
        }
    }, [activeTab, league?.id]);

    const fetchLeagueDetails = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${env.API_BASE_URL}/leagues/${leagueId}`);

            if (!response.ok) {
                throw new Error('League not found');
            }

            const data = await response.json();
            setLeague(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching league details:', error);
            setError('Failed to load league details. Please try again later.');
            setLoading(false);
        }
    };

    // Modify your fetchWeeks function to handle proper selection after deletion
    const fetchWeeks = async () => {
        setLoadingMatches(true);
        try {
            // Fetch weeks for this league
            const weeksResponse = await fetch(`${env.API_BASE_URL}/leagues/${leagueId}/weeks`);
            if (!weeksResponse.ok) {
                throw new Error('Failed to fetch weeks');
            }

            const weeksData = await weeksResponse.json();
            setWeeks(weeksData);

            // If there are weeks, select one
            if (weeksData && weeksData.length > 0) {
                // If we had a selected week that still exists, keep it selected
                const currentWeekExists = selectedWeekId && weeksData.some(w => w.id === selectedWeekId);

                if (currentWeekExists) {
                    // Keep current selection
                    await fetchMatchesForWeek(selectedWeekId);
                } else {
                    // Otherwise select the latest week
                    const latestWeek = weeksData.reduce((latest, current) =>
                        (latest.week_number > current.week_number) ? latest : current
                    );
                    setSelectedWeekId(latestWeek.id);

                    // Load matches for the selected week
                    await fetchMatchesForWeek(latestWeek.id);
                }
            } else {
                // No weeks left
                setSelectedWeekId(null);
                setMatches([]);
                setLoadingMatches(false);
            }
        } catch (error) {
            console.error('Error fetching weeks:', error);
            setLoadingMatches(false);
        }
    };

    // Also ensure the fetchMatchesForWeek function resets the matches state before loading
    const fetchMatchesForWeek = async (weekId) => {
        if (!weekId) return;

        console.log("Fetching matches for week:", weekId);
        setLoadingMatches(true);
        // Clear existing matches while loading
        setMatches([]);

        try {
            const matchesResponse = await fetch(`${env.API_BASE_URL}/matches/weeks/${weekId}/matches`);
            if (!matchesResponse.ok) {
                throw new Error('Failed to fetch matches');
            }

            const matchesData = await matchesResponse.json();

            // Ensure we have league data before enriching
            if (league?.teams && league?.courses) {
                // Enrich the matches data with full team objects
                const enrichedMatches = matchesData.map(match => {
                    const homeTeam = league.teams.find(team => team.id === match.home_team_id);
                    const awayTeam = league.teams.find(team => team.id === match.away_team_id);
                    const course = league.courses.find(course => course.id === match.course_id);

                    return {
                        ...match,
                        home_team: homeTeam || { name: `Team #${match.home_team_id}` },
                        away_team: awayTeam || { name: `Team #${match.away_team_id}` },
                        course: course || { name: `Course #${match.course_id}` }
                    };
                });

                setMatches(enrichedMatches);
            } else {
                setMatches(matchesData);
            }
        } catch (error) {
            console.error('Error fetching matches:', error);
        } finally {
            setLoadingMatches(false);
        }
    };

    // Function to fetch leaderboard data
    const fetchLeagueLeaderboard = async () => {
        setLoadingAllMatches(true);
        try {
            const response = await fetch(`${env.API_BASE_URL}/leagues/${leagueId}/leaderboard`);
            if (!response.ok) {
                throw new Error('Failed to fetch leaderboard data');
            }
            const data = await response.json();
            console.log("Fetched leaderboard data:", data);

            // The data is already sorted and calculated on the backend
            return data;
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        } finally {
            setLoadingAllMatches(false);
        }
    };

    // Add this function with your other data fetching functions
    const fetchPlayerStats = async () => {
        if (!league?.id) return;

        setLoadingPlayerStats(true);
        try {
            const response = await fetch(`${env.API_BASE_URL}/playerstats/league/${leagueId}/player-stats?minimum_rounds=1`);
            if (!response.ok) {
                throw new Error('Failed to fetch player statistics');
            }
            const data = await response.json();
            setPlayerStats(data);
        } catch (error) {
            console.error('Error fetching player statistics:', error);
            // If API endpoint doesn't exist yet, return empty array
            setPlayerStats([]);
        } finally {
            setLoadingPlayerStats(false);
        }
    };

    // Add with your other data fetching functions
    const fetchRankingsData = async () => {
        if (!league?.id) return;

        setLoadingRankings(true);
        try {
            // Fetch individual gross scores
            const individualGrossResponse = await fetch(`${env.API_BASE_URL}/playerstats/league/${leagueId}/top-scores?limit=5&score_type=gross`);
            // Fetch individual net scores
            const individualNetResponse = await fetch(`${env.API_BASE_URL}/playerstats/league/${leagueId}/top-scores?limit=5&score_type=net`);
            // Fetch team gross scores
            const teamGrossResponse = await fetch(`${env.API_BASE_URL}/teamstats/league/${leagueId}/top-scores?limit=5&score_type=gross`);
            // Fetch team net scores
            const teamNetResponse = await fetch(`${env.API_BASE_URL}/teamstats/league/${leagueId}/top-scores?limit=5&score_type=net`);

            const [individualGrossData, individualNetData, teamGrossData, teamNetData] = await Promise.all([
                individualGrossResponse.ok ? individualGrossResponse.json() : [],
                individualNetResponse.ok ? individualNetResponse.json() : [],
                teamGrossResponse.ok ? teamGrossResponse.json() : [],
                teamNetResponse.ok ? teamNetResponse.json() : []
            ]);

            setRankingsData({
                topIndividualGross: individualGrossData,
                topIndividualNet: individualNetData,
                topTeamGross: teamGrossData,
                topTeamNet: teamNetData
            });
        } catch (error) {
            console.error('Error fetching rankings data:', error);
            // If API endpoints don't exist yet, use empty arrays
            setRankingsData({
                topIndividualGross: [],
                topIndividualNet: [],
                topTeamGross: [],
                topTeamNet: []
            });
        } finally {
            setLoadingRankings(false);
        }
    };

    // Add this sort function before your return statement
    const handleSort = (key) => {
        // Toggle direction if clicking the same column
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }

        setSortConfig({ key, direction });
    };

    // Create a sorted version of the leaderboard data
    const getSortedData = () => {
        if (!leaderboardData || leaderboardData.length === 0) return [];

        const sortableData = [...leaderboardData];

        sortableData.sort((a, b) => {
            // Special case for team name (string sorting)
            if (sortConfig.key === 'name') {
                return sortConfig.direction === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            }

            // Special case for rank (we maintain ranks based on win percentage)
            if (sortConfig.key === 'rank') {
                // When sorting by rank, we actually sort by win percentage
                return sortConfig.direction === 'asc'
                    ? a.win_percentage - b.win_percentage
                    : b.win_percentage - a.win_percentage;
            }

            // Handle null values for lowest scores
            if (sortConfig.key === 'lowest_gross' || sortConfig.key === 'lowest_net') {
                // If both values are null, they're equal
                if (a[sortConfig.key] === null && b[sortConfig.key] === null) return 0;
                // Null values should appear last regardless of sort direction
                if (a[sortConfig.key] === null) return 1;
                if (b[sortConfig.key] === null) return -1;
            }

            // Default numeric sorting
            return sortConfig.direction === 'asc'
                ? a[sortConfig.key] - b[sortConfig.key]
                : b[sortConfig.key] - a[sortConfig.key];
        });

        return sortableData;
    };

    // Add arrow indicator component to show sort direction
    const getSortArrow = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc'
            ? <ArrowUpwardIcon fontSize="small" sx={{ fontSize: 16, ml: 0.5, verticalAlign: 'middle' }} />
            : <ArrowDownwardIcon fontSize="small" sx={{ fontSize: 16, ml: 0.5, verticalAlign: 'middle' }} />;
    };

    // Add this function with your other utility functions
    const handlePlayerStatsSort = (key) => {
        let direction = 'asc';
        if (playerStatsSortConfig.key === key && playerStatsSortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setPlayerStatsSortConfig({ key, direction });
    };

    const getSortedPlayerStats = () => {
        if (!playerStats || playerStats.length === 0) return [];

        const sortableData = [...playerStats];

        sortableData.sort((a, b) => {
            // Handle null values
            if (a[playerStatsSortConfig.key] === null && b[playerStatsSortConfig.key] === null) return 0;
            if (a[playerStatsSortConfig.key] === null) return 1;
            if (b[playerStatsSortConfig.key] === null) return -1;

            // String sorting for name
            if (playerStatsSortConfig.key === 'player_name') {
                return playerStatsSortConfig.direction === 'asc'
                    ? a.player_name.localeCompare(b.player_name)
                    : b.player_name.localeCompare(a.player_name);
            }

            // Number sorting for everything else
            return playerStatsSortConfig.direction === 'asc'
                ? a[playerStatsSortConfig.key] - b[playerStatsSortConfig.key]
                : b[playerStatsSortConfig.key] - a[playerStatsSortConfig.key];
        });

        return sortableData;
    };

    // Reuse your existing getSortArrow function for player stats
    const getPlayerStatsSortArrow = (key) => {
        if (playerStatsSortConfig.key !== key) return null;
        return playerStatsSortConfig.direction === 'asc'
            ? <ArrowUpwardIcon fontSize="small" sx={{ fontSize: 16, ml: 0.5, verticalAlign: 'middle' }} />
            : <ArrowDownwardIcon fontSize="small" sx={{ fontSize: 16, ml: 0.5, verticalAlign: 'middle' }} />;
    };

    const handleWeekChange = (event) => {
        setSelectedWeekId(event.target.value);
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleBackClick = () => {
        navigate('/leagues');
    };

    // Match creation handlers
    const handleCreateMatchClick = () => {
        // Initialize with default values
        let initialMatchState = {
            match_date: format(new Date(), 'yyyy-MM-dd'),
            home_team_id: '',
            away_team_id: '',
            course_id: ''
        };

        // If there's only one course, default to it
        if (league.courses && league.courses.length === 1) {
            initialMatchState.course_id = league.courses[0].id;
        }

        setNewMatch(initialMatchState);
        setCreateMatchDialogOpen(true);
    };

    const handleCreateMatchClose = () => {
        setCreateMatchDialogOpen(false);
    };

    const handleMatchInputChange = (e) => {
        const { name, value } = e.target;
        setNewMatch({
            ...newMatch,
            [name]: value
        });
    };

    const handleCreateMatch = async () => {
        try {
            if (!selectedWeekId) {
                alert("No week selected. Please create or select a week first.");
                return;
            }

            // Show that we're saving
            console.log("Creating match...");

            const response = await fetch(`${env.API_BASE_URL}/matches`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...newMatch,
                    week_id: selectedWeekId
                }),
            });

            // First, close the dialog regardless of success to improve UX
            handleCreateMatchClose();

            // Try to read the response
            let responseData;
            try {
                // This might fail if the response isn't valid JSON
                responseData = await response.json();
            } catch (parseError) {
                console.error("Response parsing error:", parseError);
                // Continue execution even if parsing fails
            }

            // Check if match creation was successful
            if (!response.ok) {
                throw new Error(
                    responseData?.detail ||
                    `Server error: ${response.status} ${response.statusText}`
                );
            }

            console.log("Match created successfully:", responseData);

            // Refresh the matches list after a short delay to ensure DB consistency
            setTimeout(() => {
                fetchMatchesForWeek(selectedWeekId);
            }, 500);

            // Reset the form
            setNewMatch({
                match_date: format(new Date(), 'yyyy-MM-dd'),
                home_team_id: '',
                away_team_id: '',
                course_id: ''
            });

        } catch (error) {
            //console.error('Error creating match:', error); TODO: Come back and find out why this is failing

            // Even if there's an error, try to refresh the matches
            // since you mentioned the match is actually being created
            setTimeout(() => {
                fetchMatchesForWeek(selectedWeekId);
            }, 500);

            //alert(`Note: Match might have been created, but there was an error: ${error.message}`);
        }
    };

    // Week creation handlers
    const handleCreateWeekClick = () => {
        // Set the next week number based on existing weeks
        if (weeks && weeks.length > 0) {
            const maxWeekNumber = Math.max(...weeks.map(w => w.week_number));
            setNewWeek({
                ...newWeek,
                week_number: maxWeekNumber + 1
            });
        }

        setCreateWeekDialogOpen(true);
    };

    const handleCreateWeekClose = () => {
        setCreateWeekDialogOpen(false);
    };

    const handleWeekInputChange = (e) => {
        const { name, value } = e.target;
        setNewWeek({
            ...newWeek,
            [name]: value
        });
    };

    const handleGenerateMatchupsChange = (event) => {
        setGenerateMatchups(event.target.checked);

        // If enabled, set default values
        if (event.target.checked) {
            // Default to selecting all teams
            const allTeamIds = league.teams ? league.teams.map(team => team.id) : [];
            // Default to first course if available
            const defaultCourse = league.courses && league.courses.length > 0 ? league.courses[0].id : '';

            setMatchupConfig({
                selectedTeams: allTeamIds,
                selectedCourse: defaultCourse,
                matchDate: newWeek.start_date // Default to week start date
            });

            if (allTeamIds.length > 0) {
                generatePossibleMatchups(allTeamIds, defaultCourse, newWeek.start_date);
            }
        } else {
            setGeneratedMatchups([]);
        }
    };

    const handleMatchupConfigChange = (e) => {
        const { name, value } = e.target;

        if (name === "selectedTeams") {
            // For multiple select
            setMatchupConfig({
                ...matchupConfig,
                selectedTeams: Array.isArray(value) ? value : [value]
            });

            // Generate new matchups when teams change
            generatePossibleMatchups(
                Array.isArray(value) ? value : [value],
                matchupConfig.selectedCourse,
                matchupConfig.matchDate
            );
        } else {
            setMatchupConfig({
                ...matchupConfig,
                [name]: value
            });

            // Generate new matchups when other settings change
            if (name === "selectedCourse" || name === "matchDate") {
                generatePossibleMatchups(
                    matchupConfig.selectedTeams,
                    name === "selectedCourse" ? value : matchupConfig.selectedCourse,
                    name === "matchDate" ? value : matchupConfig.matchDate
                );
            }
        }
    };

    const generatePossibleMatchups = async (selectedTeamIds, courseId, matchDate) => {
        if (!selectedTeamIds || selectedTeamIds.length < 2) {
            setGeneratedMatchups([]);
            return;
        }

        try {
            // First, fetch ALL historical matches for these teams across all weeks
            setMatchupWarning(null);
            const historicalMatchesResponse = await fetch(`${env.API_BASE_URL}/leagues/${leagueId}/matches`);
            if (!historicalMatchesResponse.ok) {
                throw new Error('Failed to fetch historical matches');
            }
            const historicalMatches = await historicalMatchesResponse.json();

            // Get the selected teams from the league teams
            const selectedTeams = league.teams.filter(team => selectedTeamIds.includes(team.id));
            const selectedCourse = league.courses.find(course => course.id === courseId);

            // Create a matchup history tracking structure - key is teamA-teamB (sorted), value is count
            const matchupHistory = new Map();

            // Also track the weeks where teams played each other
            const matchupDetails = new Map();

            // Process historical matches to build matchup history
            historicalMatches.forEach(match => {
                // Create a unique key for each team pairing regardless of home/away
                const teamIds = [match.home_team_id, match.away_team_id].sort();
                if (!selectedTeamIds.includes(teamIds[0]) || !selectedTeamIds.includes(teamIds[1])) {
                    return; // Skip matches that don't include our selected teams
                }

                const pairingKey = teamIds.join('-');

                // Track count of matchups
                if (!matchupHistory.has(pairingKey)) {
                    matchupHistory.set(pairingKey, 1);
                    matchupDetails.set(pairingKey, [{
                        week_id: match.week_id,
                        match_date: match.match_date
                    }]);
                } else {
                    matchupHistory.set(pairingKey, matchupHistory.get(pairingKey) + 1);
                    matchupDetails.get(pairingKey).push({
                        week_id: match.week_id,
                        match_date: match.match_date
                    });
                }
            });

            console.log("Matchup history:", matchupHistory);

            // Determine if we have an odd number of teams
            const hasOddTeams = selectedTeams.length % 2 !== 0;
            let byeTeam = null;

            // If odd number of teams, we'll need to give one a bye
            if (hasOddTeams) {
                // Find the team that has had the fewest byes
                // This would ideally be tracked in your database
                // For now, just pick the last team
                byeTeam = selectedTeams.pop();
            }

            // Create all possible pairings ranked by how many times they've played
            const possiblePairings = [];
            for (let i = 0; i < selectedTeams.length; i++) {
                for (let j = i + 1; j < selectedTeams.length; j++) {
                    const team1 = selectedTeams[i];
                    const team2 = selectedTeams[j];
                    const pairingKey = [team1.id, team2.id].sort().join('-');
                    const matchupCount = matchupHistory.get(pairingKey) || 0;
                    const matchupInfo = matchupDetails.get(pairingKey) || [];

                    possiblePairings.push({
                        team1,
                        team2,
                        pairingKey,
                        matchupCount,
                        matchupInfo
                    });
                }
            }

            // Sort pairings by the number of times they've played (ascending)
            possiblePairings.sort((a, b) => a.matchupCount - b.matchupCount);

            // Use a greedy algorithm to select pairings
            const matchups = [];
            const usedTeams = new Set();
            let hasDuplicatePairings = false;

            // First, try to use teams that haven't played each other at all
            for (const pairing of possiblePairings) {
                if (!usedTeams.has(pairing.team1.id) && !usedTeams.has(pairing.team2.id)) {
                    const isDuplicate = pairing.matchupCount > 0;

                    matchups.push({
                        home_team_id: pairing.team1.id,
                        home_team_name: pairing.team1.name,
                        away_team_id: pairing.team2.id,
                        away_team_name: pairing.team2.name,
                        course_id: courseId,
                        course_name: selectedCourse ? selectedCourse.name : 'Not selected',
                        match_date: matchDate,
                        previous_matchups: pairing.matchupCount,
                        is_duplicate: isDuplicate,
                        matchup_history: pairing.matchupInfo,
                    });

                    usedTeams.add(pairing.team1.id);
                    usedTeams.add(pairing.team2.id);

                    if (isDuplicate) {
                        hasDuplicatePairings = true;
                    }
                }
            }

            // If there are unused teams, pair them even if they've played before
            const unusedTeams = selectedTeams.filter(team => !usedTeams.has(team.id));
            if (unusedTeams.length > 0) {
                // Pair remaining teams optimally
                for (let i = 0; i < unusedTeams.length; i += 2) {
                    if (i + 1 < unusedTeams.length) {
                        const team1 = unusedTeams[i];
                        const team2 = unusedTeams[i + 1];
                        const pairingKey = [team1.id, team2.id].sort().join('-');
                        const matchupCount = matchupHistory.get(pairingKey) || 0;
                        const matchupInfo = matchupDetails.get(pairingKey) || [];

                        matchups.push({
                            home_team_id: team1.id,
                            home_team_name: team1.name,
                            away_team_id: team2.id,
                            away_team_name: team2.name,
                            course_id: courseId,
                            course_name: selectedCourse ? selectedCourse.name : 'Not selected',
                            match_date: matchDate,
                            previous_matchups: matchupCount,
                            is_duplicate: matchupCount > 0,
                            matchup_history: matchupInfo,
                            is_forced: true // This indicates we had to force this pairing
                        });

                        if (matchupCount > 0) {
                            hasDuplicatePairings = true;
                        }
                    }
                }
            }

            // If there was a bye team, add it to the generated data
            if (byeTeam) {
                matchups.push({
                    home_team_id: byeTeam.id,
                    home_team_name: byeTeam.name,
                    away_team_id: null,
                    away_team_name: "BYE",
                    course_id: null,
                    course_name: "N/A - Bye Week",
                    match_date: matchDate,
                    is_bye: true
                });
            }

            setGeneratedMatchups(matchups);

            // Set warning message if needed
            if (hasDuplicatePairings) {
                setMatchupWarning(
                    "Some teams will play against each other more than once because not all matchups can be unique. " +
                    "Duplicate matchups are highlighted."
                );
            }
        } catch (error) {
            console.error("Error generating matchups:", error);
            setMatchupWarning("Error fetching match history. Matches may not be optimally paired.");

            // Fall back to basic matchup generation without historical data
            basicMatchupGeneration(selectedTeamIds, courseId, matchDate);
        }
    };

    // Fallback method if API call fails
    const basicMatchupGeneration = (selectedTeamIds, courseId, matchDate) => {
        // Similar to original implementation, but without historical data
        const selectedTeams = league.teams.filter(team => selectedTeamIds.includes(team.id));
        const selectedCourse = league.courses.find(course => course.id === courseId);

        // Create simple pairings
        const matchups = [];
        const hasOddTeams = selectedTeams.length % 2 !== 0;
        let byeTeam = null;

        if (hasOddTeams) {
            byeTeam = selectedTeams.pop();
        }

        // Simple pairing algorithm
        for (let i = 0; i < selectedTeams.length; i += 2) {
            if (i + 1 < selectedTeams.length) {
                matchups.push({
                    home_team_id: selectedTeams[i].id,
                    home_team_name: selectedTeams[i].name,
                    away_team_id: selectedTeams[i + 1].id,
                    away_team_name: selectedTeams[i + 1].name,
                    course_id: courseId,
                    course_name: selectedCourse ? selectedCourse.name : 'Not selected',
                    match_date: matchDate
                });
            }
        }

        // Add bye team
        if (byeTeam) {
            matchups.push({
                home_team_id: byeTeam.id,
                home_team_name: byeTeam.name,
                away_team_id: null,
                away_team_name: "BYE",
                course_id: null,
                course_name: "N/A - Bye Week",
                match_date: matchDate,
                is_bye: true
            });
        }

        setGeneratedMatchups(matchups);
    };

    const handleCreateWeek = async () => {
        try {
            // First create the week
            const weekResponse = await fetch(`${env.API_BASE_URL}/leagues/${leagueId}/weeks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newWeek),
            });

            if (!weekResponse.ok) {
                throw new Error('Failed to create week');
            }

            // Get the created week ID
            const weekData = await weekResponse.json();
            const createdWeekId = weekData.id;

            // If matchup generation is enabled and we have matchups to create
            if (generateMatchups && generatedMatchups.length > 0) {
                for (const matchup of generatedMatchups) {
                    // Skip creating actual matches for byes
                    if (matchup.is_bye) {
                        console.log(`Team ${matchup.home_team_name} has a bye this week`);
                        continue;
                    }

                    await fetch(`${env.API_BASE_URL}/matches`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            home_team_id: matchup.home_team_id,
                            away_team_id: matchup.away_team_id,
                            course_id: matchup.course_id,
                            match_date: matchup.match_date,
                            week_id: createdWeekId
                        }),
                    });
                }
            }

            // Refresh the weeks and show the newly created one
            await fetchWeeks();
            setSelectedWeekId(createdWeekId);
            handleCreateWeekClose();

            // Reset the form with incremented week number and updated dates
            setNewWeek({
                week_number: newWeek.week_number + 1,
                start_date: format(new Date(new Date(newWeek.end_date).getTime() + 86400000), 'yyyy-MM-dd'),
                end_date: format(new Date(new Date(newWeek.end_date).getTime() + 7 * 86400000), 'yyyy-MM-dd')
            });

            // Reset the matchup generation state
            setGenerateMatchups(false);
            setGeneratedMatchups([]);

        } catch (error) {
            console.error('Error creating week:', error);
            alert('Failed to create week. Please try again.');
        }
    };

    const handleDeleteWeekClick = (week) => {
        setWeekToDelete(week);
        setDeleteWeekDialogOpen(true);
    };

    const handleDeleteWeekClose = () => {
        setDeleteWeekDialogOpen(false);
        setWeekToDelete(null);
    };

    const handleDeleteWeek = async () => {
        if (!weekToDelete) return;

        try {
            // Delete the week
            const response = await fetch(`${env.API_BASE_URL}/leagues/${leagueId}/weeks/${weekToDelete.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete week');
            }

            // Re-fetch the weeks list
            await fetchWeeks();
            handleDeleteWeekClose();
        } catch (error) {
            console.error('Error deleting week:', error);
            alert('Failed to delete week. Please try again.');
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
            <Box sx={{ my: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={handleBackClick}>
                    Back to Leagues
                </Button>
                <Paper sx={{ p: 3, mt: 2, textAlign: 'center' }}>
                    <Typography color="error">{error}</Typography>
                </Paper>
            </Box>
        );
    }

    // Get the currently selected week object
    const selectedWeek = weeks.find(week => week.id === selectedWeekId);

    return (
        <div>
            <Box sx={{ mb: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={handleBackClick}>
                    Back to Leagues
                </Button>
            </Box>

            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {league.name}
                    </Typography>
                </Box>

                {league.description && (
                    <Typography variant="body1" color="text.secondary" paragraph>
                        {league.description}
                    </Typography>
                )}
            </Box>

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    textColor="primary"
                    indicatorColor="primary"
                >
                    <Tab icon={<EventIcon />} label="Schedule" />
                    <Tab icon={<TrophyIcon />} label="Standings" />
                    <Tab icon={<PersonIcon />} label="Player Stats" />
                    <Tab icon={<StarIcon />} label="Rankings" />
                    <Tab icon={<TeamIcon />} label="Teams" />
                    <Tab icon={<CourseIcon />} label="Courses" />
                </Tabs>
            </Paper>

            {/* Tab Content */}
            <Paper sx={{ p: 3 }}>
                {activeTab === 0 && (
                    <Box>
                        {/* Week selector and buttons */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1, maxWidth: 400 }}>
                                <FormControl fullWidth>
                                    <InputLabel id="week-select-label">Week</InputLabel>
                                    <Select
                                        labelId="week-select-label"
                                        id="week-select"
                                        value={selectedWeekId || ''}
                                        label="Week"
                                        onChange={handleWeekChange}
                                        disabled={weeks.length === 0}
                                    >
                                        {weeks.map((week) => (
                                            <MenuItem key={week.id} value={week.id}>
                                                Week {week.week_number} ({format(new Date(week.start_date), 'MMM d')} - {format(new Date(week.end_date), 'MMM d')})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {weeks.length === 0 && (
                                    <Typography variant="caption" color="error">
                                        No weeks created yet
                                    </Typography>
                                )}
                            </Box>

                            {/* Button group with both buttons */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<WeekIcon />}
                                    onClick={handleCreateWeekClick}
                                >
                                    Add Week
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleCreateMatchClick}
                                    disabled={!selectedWeekId}
                                >
                                    Create Matchup
                                </Button>
                            </Box>
                        </Box>

                        {/* Show selected week details */}
                        {selectedWeek && (
                            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6">
                                        Week {selectedWeek.week_number}
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        size="small"
                                        onClick={() => handleDeleteWeekClick(selectedWeek)}
                                        startIcon={<DeleteIcon />}
                                    >
                                        Delete Week
                                    </Button>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 3, color: 'text.secondary', mt: 1 }}>
                                    <Typography variant="body2">
                                        Start: {format(new Date(selectedWeek.start_date), 'MMMM d, yyyy')}
                                    </Typography>
                                    <Typography variant="body2">
                                        End: {format(new Date(selectedWeek.end_date), 'MMMM d, yyyy')}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={
                                            new Date(selectedWeek.end_date) < new Date()
                                                ? (matches.every(match => match.is_completed)
                                                    ? "Completed"
                                                    : "In Progress")
                                                : "Current"
                                        }
                                        color={
                                            new Date(selectedWeek.end_date) < new Date()
                                                ? (matches.every(match => match.is_completed)
                                                    ? "success"
                                                    : "warning")
                                                : "primary"
                                        }
                                    />
                                </Box>
                            </Box>
                        )}

                        {/* Matches grid or empty state */}
                        {loadingMatches ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : weeks.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body1" paragraph>
                                    You need to create weeks before adding matches.
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<WeekIcon />}
                                    onClick={handleCreateWeekClick}
                                >
                                    Create First Week
                                </Button>
                            </Box>
                        ) : matches && matches.length > 0 ? (
                            <>
                                <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                                    Matchups for Week {selectedWeek?.week_number}
                                </Typography>

                                {/* Group matches by date */}
                                {(() => {
                                    // Group matches by date
                                    const matchesByDate = matches.reduce((groups, match) => {
                                        const date = format(new Date(match.match_date), 'yyyy-MM-dd');
                                        if (!groups[date]) {
                                            groups[date] = [];
                                        }
                                        groups[date].push(match);
                                        return groups;
                                    }, {});

                                    // Sort dates
                                    const sortedDates = Object.keys(matchesByDate).sort();

                                    return sortedDates.map(date => (
                                        <Box key={date} sx={{ mb: 3 }}>
                                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', borderBottom: '1px solid', borderColor: 'divider', pb: 0.5 }}>
                                                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                                            </Typography>

                                            <TableContainer component={Paper} sx={{ mb: 3 }}>
                                                <Table size="small">
                                                    <TableBody>
                                                        {matchesByDate[date].map(match => (
                                                            <TableRow
                                                                key={match.id}
                                                                hover
                                                                onClick={() => {
                                                                    navigate(`/matches/${match.id}/scores`, {
                                                                        state: {
                                                                            match,
                                                                            league,
                                                                            returnTo: `/leagues/${leagueId}`
                                                                        }
                                                                    });
                                                                }}
                                                                sx={{
                                                                    cursor: 'pointer',
                                                                    '&:hover': { bgcolor: 'action.hover' },
                                                                }}
                                                            >
                                                                {/* Course */}
                                                                <TableCell
                                                                    sx={{
                                                                        width: '20%',
                                                                        borderLeft: match.is_completed ? '4px solid #4caf50' : '4px solid #2196f3'
                                                                    }}
                                                                >
                                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                        <CourseIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
                                                                        <Typography variant="body2" noWrap>
                                                                            {match.course ? match.course.name : 'TBD'}
                                                                        </Typography>
                                                                    </Box>
                                                                </TableCell>

                                                                {/* Home Team */}
                                                                <TableCell sx={{
                                                                    width: '30%',
                                                                    // Add highlight for home team winner
                                                                    ...(match.is_completed && match.home_team_points > match.away_team_points && {
                                                                        bgcolor: 'rgba(76, 175, 80, 0.08)',
                                                                        fontWeight: 'bold'
                                                                    })
                                                                }}>
                                                                    <Typography sx={{ fontWeight: 'bold' }}>
                                                                        {match.home_team ? match.home_team.name : 'Home Team'}
                                                                    </Typography>
                                                                </TableCell>

                                                                {/* Score/Status */}
                                                                <TableCell align="center" sx={{ width: '20%' }}>
                                                                    {match.is_completed ? (
                                                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                            <Typography variant="body1" sx={{
                                                                                fontWeight: 'bold',
                                                                                color: match.home_team_points > match.away_team_points ? 'success.main' : 'primary.main'
                                                                            }}>
                                                                                {match.home_team_points !== null
                                                                                    ? (match.home_team_points % 1 === 0
                                                                                        ? match.home_team_points
                                                                                        : match.home_team_points.toFixed(1))
                                                                                    : '-'}
                                                                            </Typography>
                                                                            <Typography variant="body2" sx={{ mx: 1 }}>vs</Typography>
                                                                            <Typography variant="body1" sx={{
                                                                                fontWeight: 'bold',
                                                                                color: match.away_team_points > match.home_team_points ? 'success.main' : 'primary.main'
                                                                            }}>
                                                                                {match.away_team_points !== null
                                                                                    ? (match.away_team_points % 1 === 0
                                                                                        ? match.away_team_points
                                                                                        : match.away_team_points.toFixed(1))
                                                                                    : '-'}
                                                                            </Typography>
                                                                        </Box>
                                                                    ) : (
                                                                        <Chip
                                                                            label="Scheduled"
                                                                            size="small"
                                                                            color="primary"
                                                                            sx={{ minWidth: 85 }}
                                                                        />
                                                                    )}
                                                                </TableCell>

                                                                {/* Away Team */}
                                                                <TableCell sx={{
                                                                    width: '30%',
                                                                    // Add highlight for away team winner
                                                                    ...(match.is_completed && match.away_team_points > match.home_team_points && {
                                                                        bgcolor: 'rgba(76, 175, 80, 0.08)',
                                                                        fontWeight: 'bold'
                                                                    })
                                                                }}>
                                                                    <Typography sx={{ fontWeight: 'bold' }}>
                                                                        {match.away_team ? match.away_team.name : 'Away Team'}
                                                                    </Typography>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Box>
                                    ));
                                })()}
                            </>
                        ) : selectedWeekId ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body1" paragraph>
                                    No matches scheduled for this week yet.
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleCreateMatchClick}
                                >
                                    Create Your First Matchup
                                </Button>
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body1" paragraph>
                                    Please select a week to view or create matches.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Other tabs content remains the same */}
                {activeTab === 1 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            League Standings
                        </Typography>
                        {loadingAllMatches ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : leaderboardData && leaderboardData.length > 0 ? (
                            <TableContainer component={Paper} sx={{ mt: 2 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                            <TableCell
                                                sx={{ color: 'white', fontWeight: 'bold', width: '50px', padding: '6px 8px', cursor: 'pointer' }}
                                                onClick={() => handleSort('rank')}
                                            >
                                                Rank {getSortArrow('rank')}
                                            </TableCell>
                                            <TableCell
                                                sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                                onClick={() => handleSort('name')}
                                            >
                                                Team {getSortArrow('name')}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                                onClick={() => handleSort('matches_played')}
                                            >
                                                Matches {getSortArrow('matches_played')}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                                onClick={() => handleSort('points_won')}
                                            >
                                                Points Won {getSortArrow('points_won')}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                                onClick={() => handleSort('points_lost')}
                                            >
                                                Points Lost {getSortArrow('points_lost')}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                                onClick={() => handleSort('win_percentage')}
                                            >
                                                Win % {getSortArrow('win_percentage')}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                                onClick={() => handleSort('lowest_gross')}
                                            >
                                                Low Gross {getSortArrow('lowest_gross')}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                                onClick={() => handleSort('lowest_net')}
                                            >
                                                Low Net {getSortArrow('lowest_net')}
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {getSortedData().map((teamStats, index) => (
                                            <TableRow
                                                key={teamStats.id}
                                                sx={{
                                                    '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                                    '&:hover': { bgcolor: 'action.selected' }
                                                }}
                                            >
                                                <TableCell sx={{ fontWeight: 'bold', padding: '6px 8px' }}>
                                                    {/* If sorted by something other than rank/win_percentage, show original rank */}
                                                    {sortConfig.key === 'rank' || sortConfig.key === 'win_percentage'
                                                        ? index + 1
                                                        : leaderboardData.findIndex(team => team.id === teamStats.id) + 1}
                                                </TableCell>
                                                <TableCell
                                                    component="th"
                                                    scope="row"
                                                    sx={{ fontWeight: 'bold', padding: '6px 8px' }}
                                                >
                                                    {teamStats.name}
                                                </TableCell>
                                                <TableCell align="center" sx={{ padding: '6px 8px' }}>{teamStats.matches_played}</TableCell>
                                                <TableCell align="center" sx={{ padding: '6px 8px' }}>
                                                    {Number.isInteger(teamStats.points_won)
                                                        ? teamStats.points_won
                                                        : Math.round(teamStats.points_won)}
                                                </TableCell>
                                                <TableCell align="center" sx={{ padding: '6px 8px' }}>
                                                    {Number.isInteger(teamStats.points_lost)
                                                        ? teamStats.points_lost
                                                        : Math.round(teamStats.points_lost)}
                                                </TableCell>
                                                <TableCell align="center" sx={{ padding: '6px 8px' }}>
                                                    {teamStats.win_percentage}%
                                                    {teamStats.matches_played > 0 &&
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={teamStats.win_percentage}
                                                            sx={{ mt: 0.5, height: 5, borderRadius: 2 }}
                                                            color={teamStats.win_percentage > 50 ? "success" : "primary"}
                                                        />
                                                    }
                                                </TableCell>
                                                <TableCell align="center" sx={{ padding: '6px 8px' }}>
                                                    {teamStats.lowest_gross || '—'}
                                                </TableCell>
                                                <TableCell align="center" sx={{ padding: '6px 8px' }}>
                                                    {teamStats.lowest_net || '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No leaderboard data available.
                            </Typography>
                        )}
                    </Box>
                )}

                {activeTab === 2 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Player Statistics
                        </Typography>
                        {loadingPlayerStats ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : playerStats && playerStats.length > 0 ? (
                            <Box>
                                <TableContainer component={Paper} sx={{ mt: 2, overflow: 'auto' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                                <TableCell
                                                    sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                                    onClick={() => handlePlayerStatsSort('player_name')}
                                                >
                                                    Player {getPlayerStatsSortArrow('player_name')}
                                                </TableCell>
                                                <TableCell
                                                    align="center"
                                                    sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                                    onClick={() => handlePlayerStatsSort('rounds_played')}
                                                >
                                                    Rounds {getPlayerStatsSortArrow('rounds_played')}
                                                </TableCell>
                                                <TableCell
                                                    align="center"
                                                    sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                                    onClick={() => handlePlayerStatsSort('avg_gross_score')}
                                                >
                                                    Avg Score {getPlayerStatsSortArrow('avg_gross_score')}
                                                </TableCell>
                                                <TableCell
                                                    align="center"
                                                    sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                                    onClick={() => handlePlayerStatsSort('lowest_gross_score')}
                                                >
                                                    Best Score {getPlayerStatsSortArrow('lowest_gross_score')}
                                                </TableCell>
                                                <TableCell
                                                    align="center"
                                                    sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                                    onClick={() => handlePlayerStatsSort('avg_net_score')}
                                                >
                                                    Avg Net {getPlayerStatsSortArrow('avg_net_score')}
                                                </TableCell>
                                                <TableCell
                                                    align="center"
                                                    sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                                    onClick={() => handlePlayerStatsSort('lowest_net_score')}
                                                >
                                                    Low Net {getPlayerStatsSortArrow('lowest_net_score')}
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {getSortedPlayerStats().map((player) => (
                                                <TableRow
                                                    key={player.player_id}
                                                    sx={{
                                                        '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                                        '&:hover': { bgcolor: 'action.selected' }
                                                    }}
                                                >
                                                    <TableCell sx={{ fontWeight: 'bold', padding: '6px 8px' }}>
                                                        {player.player_name}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ padding: '6px 8px' }}>
                                                        {player.rounds_played}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ padding: '6px 8px' }}>
                                                        {player.avg_gross_score ? player.avg_gross_score.toFixed(1) : '—'}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ padding: '6px 8px' }}>
                                                        {player.lowest_gross_score || '—'}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ padding: '6px 8px' }}>
                                                        {player.avg_net_score ? player.avg_net_score.toFixed(1) : '—'}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ padding: '6px 8px' }}>
                                                        {player.lowest_net_score ? player.lowest_net_score.toFixed(1) : '—'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <Box sx={{ mt: 4 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Notable Achievements
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {/* This section can be populated in the future with dynamic data */}
                                        {playerStats.some(p => p.birdies > 0) && (
                                            <Grid item xs={12} sm={6} md={3}>
                                                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                                                    <StarsIcon color="primary" sx={{ mr: 1 }} />
                                                    <Typography variant="body2">
                                                        {playerStats.reduce((sum, p) => sum + (p.birdies || 0), 0)} Total Birdies
                                                    </Typography>
                                                </Paper>
                                            </Grid>
                                        )}
                                        {/* Add more achievement cards here as needed */}
                                    </Grid>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <DangerousIcon color="action" sx={{ fontSize: 40, opacity: 0.5, mb: 2 }} />
                                <Typography variant="body1" color="text.secondary">
                                    No player statistics available yet.
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Stats will appear once players have completed rounds.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}

                {activeTab === 3 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Top Rankings
                        </Typography>
                        {loadingRankings ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Grid container spacing={3}>
                                {/* Individual Gross Scores */}
                                <Grid item xs={12} md={6}>
                                    <Paper
                                        sx={{
                                            p: 2,
                                            height: '100%',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            mb: 2,
                                            pb: 1,
                                            borderBottom: '1px solid',
                                            borderColor: 'divider'
                                        }}>
                                            <TrophyOutlineIcon sx={{ mr: 1, color: 'primary.main' }} />
                                            <Typography variant="h6" component="h3">
                                                Lowest Individual Gross Scores
                                            </Typography>
                                        </Box>

                                        {rankingsData.topIndividualGross.length > 0 ? (
                                            <List disablePadding>
                                                {rankingsData.topIndividualGross.map((score, index) => (
                                                    <ListItem
                                                        key={`gross-${score.player_id}-${index}`}
                                                        sx={{
                                                            px: 1,
                                                            py: 0.5,
                                                            backgroundColor: index % 2 === 0 ? 'action.hover' : 'transparent'
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                width: '100%'
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="body1"
                                                                sx={{
                                                                    fontWeight: 'bold',
                                                                    minWidth: '24px',
                                                                    color: index === 0 ? 'warning.dark' : 'text.primary'
                                                                }}
                                                            >
                                                                {index + 1}.
                                                            </Typography>
                                                            <Box sx={{ flexGrow: 1 }}>
                                                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                                    {score.player_name}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {score.date ? format(new Date(score.date), 'MMM d, yyyy') : 'Unknown date'} - {score.course_name || 'Unknown course'}
                                                                </Typography>
                                                            </Box>
                                                            <Typography
                                                                variant="body1"
                                                                sx={{
                                                                    fontWeight: 'bold',
                                                                    color: 'success.main',
                                                                    fontSize: index === 0 ? '1.2rem' : '1rem'
                                                                }}
                                                            >
                                                                {score.score}
                                                            </Typography>
                                                        </Box>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                                No individual gross scores recorded yet
                                            </Typography>
                                        )}
                                    </Paper>
                                </Grid>

                                {/* Individual Net Scores */}
                                <Grid item xs={12} md={6}>
                                    <Paper
                                        sx={{
                                            p: 2,
                                            height: '100%',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            mb: 2,
                                            pb: 1,
                                            borderBottom: '1px solid',
                                            borderColor: 'divider'
                                        }}>
                                            <TrophyOutlineIcon sx={{ mr: 1, color: 'primary.main' }} />
                                            <Typography variant="h6" component="h3">
                                                Lowest Individual Net Scores
                                            </Typography>
                                        </Box>

                                        {rankingsData.topIndividualNet.length > 0 ? (
                                            <List disablePadding>
                                                {rankingsData.topIndividualNet.map((score, index) => (
                                                    <ListItem
                                                        key={`net-${score.player_id}-${index}`}
                                                        sx={{
                                                            px: 1,
                                                            py: 0.5,
                                                            backgroundColor: index % 2 === 0 ? 'action.hover' : 'transparent'
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                width: '100%'
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="body1"
                                                                sx={{
                                                                    fontWeight: 'bold',
                                                                    minWidth: '24px',
                                                                    color: index === 0 ? 'warning.dark' : 'text.primary'
                                                                }}
                                                            >
                                                                {index + 1}.
                                                            </Typography>
                                                            <Box sx={{ flexGrow: 1 }}>
                                                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                                    {score.player_name}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {score.date ? format(new Date(score.date), 'MMM d, yyyy') : 'Unknown date'} - {score.course_name || 'Unknown course'}
                                                                </Typography>
                                                            </Box>
                                                            <Typography
                                                                variant="body1"
                                                                sx={{
                                                                    fontWeight: 'bold',
                                                                    color: 'success.main',
                                                                    fontSize: index === 0 ? '1.2rem' : '1rem'
                                                                }}
                                                            >
                                                                {score.score}
                                                            </Typography>
                                                        </Box>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                                No individual net scores recorded yet
                                            </Typography>
                                        )}
                                    </Paper>
                                </Grid>

                                {/* Team Gross Scores */}
                                <Grid item xs={12} md={6}>
                                    <Paper
                                        sx={{
                                            p: 2,
                                            height: '100%',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            mb: 2,
                                            pb: 1,
                                            borderBottom: '1px solid',
                                            borderColor: 'divider'
                                        }}>
                                            <LeaderboardIcon sx={{ mr: 1, color: 'primary.main' }} />
                                            <Typography variant="h6" component="h3">
                                                Lowest Team Gross Scores
                                            </Typography>
                                        </Box>

                                        {rankingsData.topTeamGross.length > 0 ? (
                                            <List disablePadding>
                                                {rankingsData.topTeamGross.map((score, index) => (
                                                    <ListItem
                                                        key={`team-gross-${score.team_id}-${index}`}
                                                        sx={{
                                                            px: 1,
                                                            py: 0.5,
                                                            backgroundColor: index % 2 === 0 ? 'action.hover' : 'transparent'
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                width: '100%'
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="body1"
                                                                sx={{
                                                                    fontWeight: 'bold',
                                                                    minWidth: '24px',
                                                                    color: index === 0 ? 'warning.dark' : 'text.primary'
                                                                }}
                                                            >
                                                                {index + 1}.
                                                            </Typography>
                                                            <Box sx={{ flexGrow: 1 }}>
                                                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                                    {score.team_name}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {score.date ? format(new Date(score.date), 'MMM d, yyyy') : 'Unknown date'} - {score.course_name || 'Unknown course'}
                                                                </Typography>
                                                            </Box>
                                                            <Typography
                                                                variant="body1"
                                                                sx={{
                                                                    fontWeight: 'bold',
                                                                    color: 'success.main',
                                                                    fontSize: index === 0 ? '1.2rem' : '1rem'
                                                                }}
                                                            >
                                                                {score.score}
                                                            </Typography>
                                                        </Box>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                                No team gross scores recorded yet
                                            </Typography>
                                        )}
                                    </Paper>
                                </Grid>

                                {/* Team Net Scores */}
                                <Grid item xs={12} md={6}>
                                    <Paper
                                        sx={{
                                            p: 2,
                                            height: '100%',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            mb: 2,
                                            pb: 1,
                                            borderBottom: '1px solid',
                                            borderColor: 'divider'
                                        }}>
                                            <LeaderboardIcon sx={{ mr: 1, color: 'primary.main' }} />
                                            <Typography variant="h6" component="h3">
                                                Lowest Team Net Scores
                                            </Typography>
                                        </Box>

                                        {rankingsData.topTeamNet.length > 0 ? (
                                            <List disablePadding>
                                                {rankingsData.topTeamNet.map((score, index) => (
                                                    <ListItem
                                                        key={`team-net-${score.team_id}-${index}`}
                                                        sx={{
                                                            px: 1,
                                                            py: 0.5,
                                                            backgroundColor: index % 2 === 0 ? 'action.hover' : 'transparent'
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                width: '100%'
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="body1"
                                                                sx={{
                                                                    fontWeight: 'bold',
                                                                    minWidth: '24px',
                                                                    color: index === 0 ? 'warning.dark' : 'text.primary'
                                                                }}
                                                            >
                                                                {index + 1}.
                                                            </Typography>
                                                            <Box sx={{ flexGrow: 1 }}>
                                                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                                    {score.team_name}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {score.date ? format(new Date(score.date), 'MMM d, yyyy') : 'Unknown date'} - {score.course_name || 'Unknown course'}
                                                                </Typography>
                                                            </Box>
                                                            <Typography
                                                                variant="body1"
                                                                sx={{
                                                                    fontWeight: 'bold',
                                                                    color: 'success.main',
                                                                    fontSize: index === 0 ? '1.2rem' : '1rem'
                                                                }}
                                                            >
                                                                {score.score}
                                                            </Typography>
                                                        </Box>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                                No team net scores recorded yet
                                            </Typography>
                                        )}
                                    </Paper>
                                </Grid>
                            </Grid>
                        )}
                    </Box>
                )}

                {activeTab === 4 && (
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Teams
                        </Typography>
                        {league.teams && league.teams.length > 0 ? (
                            <List>
                                {league.teams.map((team) => (
                                    <ListItem key={team.id}>
                                        <ListItemText
                                            primary={team.name}
                                            secondary={`Members: ${team.members?.length || 0}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No teams assigned to this league.
                            </Typography>
                        )}
                    </Paper>
                )}

                {activeTab === 5 && (
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Courses
                        </Typography>
                        {league.courses && league.courses.length > 0 ? (
                            <List>
                                {league.courses.map((course) => (
                                    <ListItem key={course.id}>
                                        <ListItemText
                                            primary={course.name}
                                            secondary={`${course.holes?.length || 0} holes`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No courses assigned to this league.
                            </Typography>
                        )}
                    </Paper>
                )}
            </Paper>

            {/* Create Match Dialog */}
            <Dialog open={createMatchDialogOpen} onClose={handleCreateMatchClose} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Match</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Match Date"
                            type="date"
                            name="match_date"
                            value={newMatch.match_date}
                            onChange={handleMatchInputChange}
                            InputLabelProps={{ shrink: true }}
                            sx={{ mb: 3 }}
                        />

                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel id="home-team-label">Home Team</InputLabel>
                            <Select
                                labelId="home-team-label"
                                name="home_team_id"
                                value={newMatch.home_team_id}
                                onChange={handleMatchInputChange}
                                label="Home Team"
                            >
                                {league.teams?.slice().sort((a, b) => a.name.localeCompare(b.name)).map(team => (
                                    <MenuItem key={team.id} value={team.id}>
                                        {team.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel id="away-team-label">Away Team</InputLabel>
                            <Select
                                labelId="away-team-label"
                                name="away_team_id"
                                value={newMatch.away_team_id}
                                onChange={handleMatchInputChange}
                                label="Away Team"
                            >
                                {league.teams?.filter(team => team.id !== newMatch.home_team_id)
                                    .slice().sort((a, b) => a.name.localeCompare(b.name))
                                    .map(team => (
                                        <MenuItem key={team.id} value={team.id}>
                                            {team.name}
                                        </MenuItem>
                                    ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel id="course-label">Course</InputLabel>
                            <Select
                                labelId="course-label"
                                name="course_id"
                                value={newMatch.course_id}
                                onChange={handleMatchInputChange}
                                label="Course"
                            >
                                {league.courses?.map(course => (
                                    <MenuItem key={course.id} value={course.id}>
                                        {course.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCreateMatchClose}>Cancel</Button>
                    <Button
                        onClick={handleCreateMatch}
                        variant="contained"
                        disabled={!newMatch.home_team_id || !newMatch.away_team_id || !newMatch.course_id || !newMatch.match_date}
                    >
                        Create Match
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Week Dialog */}
            <Dialog
                open={createWeekDialogOpen}
                onClose={handleCreateWeekClose}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Add New Week</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>Week Details</Typography>
                        <TextField
                            fullWidth
                            label="Week Number"
                            type="number"
                            name="week_number"
                            value={newWeek.week_number}
                            onChange={handleWeekInputChange}
                            InputProps={{ inputProps: { min: 1 } }}
                            sx={{ mb: 3 }}
                        />

                        <TextField
                            fullWidth
                            label="Start Date"
                            type="date"
                            name="start_date"
                            value={newWeek.start_date}
                            onChange={handleWeekInputChange}
                            InputLabelProps={{ shrink: true }}
                            sx={{ mb: 3 }}
                        />

                        <TextField
                            fullWidth
                            label="End Date"
                            type="date"
                            name="end_date"
                            value={newWeek.end_date}
                            onChange={handleWeekInputChange}
                            InputLabelProps={{ shrink: true }}
                            error={new Date(newWeek.end_date) <= new Date(newWeek.start_date)}
                            helperText={new Date(newWeek.end_date) <= new Date(newWeek.start_date) ?
                                "End date must be after start date" : ""}
                            sx={{ mb: 3 }}
                        />

                        <Divider sx={{ my: 3 }} />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={generateMatchups}
                                    onChange={handleGenerateMatchupsChange}
                                    name="generateMatchups"
                                />
                            }
                            label={
                                <Typography variant="h6">
                                    Generate Matchups for this Week
                                </Typography>
                            }
                        />

                        {generateMatchups && (
                            <Box sx={{ mt: 2 }}>
                                {(!league.teams || league.teams.length < 2) && (
                                    <Alert severity="warning" sx={{ mb: 2 }}>
                                        You need at least two teams to generate matchups.
                                    </Alert>
                                )}

                                {(!league.courses || league.courses.length === 0) && (
                                    <Alert severity="warning" sx={{ mb: 2 }}>
                                        You need at least one course to generate matchups.
                                    </Alert>
                                )}

                                {league.teams?.length >= 2 && league.courses?.length > 0 && (
                                    <>
                                        <FormControl fullWidth sx={{ mb: 3 }}>
                                            <InputLabel id="teams-select-label">Teams</InputLabel>
                                            <Select
                                                labelId="teams-select-label"
                                                name="selectedTeams"
                                                multiple
                                                value={matchupConfig.selectedTeams}
                                                onChange={handleMatchupConfigChange}
                                                label="Teams"
                                            >
                                                {league.teams.map(team => (
                                                    <MenuItem key={team.id} value={team.id}>
                                                        {team.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            <Typography variant="caption" color="text.secondary">
                                                Select teams to include in matchups. All possible pairings will be created.
                                            </Typography>
                                        </FormControl>

                                        <FormControl fullWidth sx={{ mb: 3 }}>
                                            <InputLabel id="course-select-label">Course</InputLabel>
                                            <Select
                                                labelId="course-select-label"
                                                name="selectedCourse"
                                                value={matchupConfig.selectedCourse}
                                                onChange={handleMatchupConfigChange}
                                                label="Course"
                                            >
                                                {league.courses.map(course => (
                                                    <MenuItem key={course.id} value={course.id}>
                                                        {course.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <TextField
                                            fullWidth
                                            label="Match Date"
                                            type="date"
                                            name="matchDate"
                                            value={matchupConfig.matchDate}
                                            onChange={handleMatchupConfigChange}
                                            InputLabelProps={{ shrink: true }}
                                            sx={{ mb: 3 }}
                                        />

                                        {generatedMatchups.length > 0 && (
                                            <Box sx={{ mt: 3 }}>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    {generatedMatchups.length} Matchups will be created:
                                                </Typography>

                                                {matchupWarning && (
                                                    <Alert severity="warning" sx={{ mb: 2 }}>
                                                        {matchupWarning}
                                                    </Alert>
                                                )}

                                                <TableContainer component={MuiPaper} sx={{ maxHeight: 300 }}>
                                                    <Table stickyHeader size="small">
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell>Home Team</TableCell>
                                                                <TableCell>Away Team</TableCell>
                                                                <TableCell>Course</TableCell>
                                                                <TableCell>Date</TableCell>
                                                                <TableCell>Status</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {generatedMatchups.map((matchup, index) => (
                                                                <TableRow
                                                                    key={index}
                                                                    sx={{
                                                                        ...(matchup.is_duplicate && {
                                                                            bgcolor: 'rgba(255, 152, 0, 0.08)', // Light orange background for duplicates
                                                                        })
                                                                    }}
                                                                >
                                                                    <TableCell>{matchup.home_team_name}</TableCell>
                                                                    <TableCell>{matchup.away_team_name}</TableCell>
                                                                    <TableCell>{matchup.course_name}</TableCell>
                                                                    <TableCell>{format(new Date(matchup.match_date), 'MMM d, yyyy')}</TableCell>
                                                                    <TableCell>
                                                                        {matchup.is_bye ? (
                                                                            <Chip size="small" label="BYE" color="default" />
                                                                        ) : matchup.is_duplicate ? (
                                                                            <Chip
                                                                                size="small"
                                                                                label={`Played ${matchup.previous_matchups}x`}
                                                                                color="warning"
                                                                                title={`These teams previously played on ${matchup.matchup_history ?
                                                                                    matchup.matchup_history
                                                                                        .map(m => format(new Date(m.match_date), 'MMM d'))
                                                                                        .join(', ') : 'unknown dates'
                                                                                    }`}
                                                                            />
                                                                        ) : (
                                                                            <Chip size="small" label="New Matchup" color="success" />
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </Box>
                                        )}
                                    </>
                                )}
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCreateWeekClose}>Cancel</Button>
                    <Button
                        onClick={handleCreateWeek}
                        variant="contained"
                        disabled={!newWeek.week_number || !newWeek.start_date || !newWeek.end_date ||
                            new Date(newWeek.end_date) <= new Date(newWeek.start_date) ||
                            (generateMatchups && generatedMatchups.length === 0)}
                    >
                        {generateMatchups
                            ? `Add Week & Create ${generatedMatchups.length} Matchups`
                            : 'Add Week'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Week Dialog */}
            <Dialog
                open={deleteWeekDialogOpen}
                onClose={handleDeleteWeekClose}
            >
                <DialogTitle>Delete Week</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <Typography variant="body1" gutterBottom>
                            Are you sure you want to delete Week {weekToDelete?.week_number}?
                        </Typography>
                        <Typography variant="body2" color="error">
                            This will permanently delete this week and all associated matches. This action cannot be undone.
                        </Typography>

                        {matches && matches.length > 0 && (
                            <Alert severity="warning" sx={{ mt: 2 }}>
                                This week has {matches.length} {matches.length === 1 ? 'match' : 'matches'} that will also be deleted.
                            </Alert>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteWeekClose}>Cancel</Button>
                    <Button
                        onClick={handleDeleteWeek}
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default LeagueManagement;