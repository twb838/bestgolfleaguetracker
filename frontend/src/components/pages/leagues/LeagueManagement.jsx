import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
    Leaderboard as LeaderboardIcon,
    PrintOutlined as PrintIcon,
    TrendingUp as TrendingUpIcon,
    Settings as SettingsIcon,
    GridOn
} from '@mui/icons-material';
import { format, parseISO, addDays } from 'date-fns';
import { get, post, put, del } from '../../../services/api'; // Import API service
import Rankings from './Rankings';
import PlayerStats from './PlayerStats';
import Standings from './Standings';

function LeagueManagement() {
    const { leagueId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

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


    // Add these state variables with your other state declarations
    const [sortConfig, setSortConfig] = useState({
        key: 'win_percentage',
        direction: 'desc'
    });

    // Add state to track if we've initialized the week selection
    const [weekSelectionInitialized, setWeekSelectionInitialized] = useState(false);

    // Add this state variable with your other state declarations
    const [shuffleCount, setShuffleCount] = useState(0);

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

    // Handle week selection initialization and URL synchronization
    useEffect(() => {
        if (weeks.length > 0 && !weekSelectionInitialized) {
            let weekToSelect = null;

            // Priority 1: Week from URL parameter
            const weekParam = searchParams.get('week');
            if (weekParam) {
                const weekNumber = parseInt(weekParam);
                weekToSelect = weeks.find(w => w.week_number === weekNumber);

                if (!weekToSelect) {
                    // Week number not found, remove invalid parameter and fall back
                    setSearchParams(prev => {
                        const newParams = new URLSearchParams(prev);
                        newParams.delete('week');
                        return newParams;
                    });
                }
            }

            // Priority 2: Week from navigation state (one-time use)
            if (!weekToSelect && location.state?.selectedWeekId) {
                weekToSelect = weeks.find(w => w.id === location.state.selectedWeekId);

                // Clear the location state after using it
                window.history.replaceState({}, document.title);
            }

            // Priority 3: Most recent week (default)
            if (!weekToSelect) {
                weekToSelect = weeks.reduce((latest, current) =>
                    (latest.week_number > current.week_number) ? latest : current
                );
            }

            if (weekToSelect) {
                setSelectedWeekId(weekToSelect.id);

                // Update URL to reflect the selected week
                setSearchParams(prev => {
                    const newParams = new URLSearchParams(prev);
                    newParams.set('week', weekToSelect.week_number.toString());
                    return newParams;
                });

                // Fetch matches for the selected week
                fetchMatchesForWeek(weekToSelect.id);
            }

            setWeekSelectionInitialized(true);
        }
    }, [weeks, weekSelectionInitialized, searchParams, location.state, setSearchParams]);

    // Handle manual week changes and update URL
    useEffect(() => {
        if (selectedWeekId && weekSelectionInitialized) {
            const selectedWeek = weeks.find(w => w.id === selectedWeekId);
            if (selectedWeek) {
                // Update URL parameter
                setSearchParams(prev => {
                    const newParams = new URLSearchParams(prev);
                    newParams.set('week', selectedWeek.week_number.toString());
                    return newParams;
                });

                // Fetch matches for the week
                fetchMatchesForWeek(selectedWeekId);
            }
        }
    }, [selectedWeekId, weekSelectionInitialized, weeks, setSearchParams]);

    // Update fetchLeagueDetails to use API service
    const fetchLeagueDetails = async () => {
        setLoading(true);
        try {
            const data = await get(`/leagues/${leagueId}`);
            setLeague(data);
            setLoading(false);
        } catch (error) {
            setError('Failed to load league details. Please try again later.');
            setLoading(false);
        }
    };

    // Update fetchWeeks to use API service
    const fetchWeeks = async () => {
        setLoadingMatches(true);
        try {
            const weeksData = await get(`/leagues/${leagueId}/weeks`);
            setWeeks(weeksData);

            // Reset week selection initialization when weeks change
            if (weeksData.length === 0) {
                setSelectedWeekId(null);
                setMatches([]);
                setWeekSelectionInitialized(true); // Mark as initialized even with no weeks
            } else {
                setWeekSelectionInitialized(false); // Allow re-initialization with new weeks
            }
        } catch (error) {
            // Handle error silently
        } finally {
            setLoadingMatches(false);
        }
    };

    // Update fetchMatchesForWeek to use API service
    const fetchMatchesForWeek = async (weekId) => {
        if (!weekId) return;

        setLoadingMatches(true);
        setMatches([]);

        try {
            const matchesData = await get(`/matches/weeks/${weekId}/matches`);

            if (league?.teams && league?.courses) {
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
            // Handle error silently
        } finally {
            setLoadingMatches(false);
        }
    };

    // Update fetchLeagueLeaderboard to use API service
    const fetchLeagueLeaderboard = async () => {
        setLoadingAllMatches(true);
        try {
            const data = await get(`/leagues/${leagueId}/leaderboard`);
            return data;
        } catch (error) {
            return [];
        } finally {
            setLoadingAllMatches(false);
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

    const handleWeekChange = (event) => {
        const newWeekId = event.target.value;
        setSelectedWeekId(newWeekId);
        // URL update will be handled by the useEffect
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleBackClick = () => {
        navigate('/leagues');
    };

    // Match creation handlers
    const handleCreateMatchClick = () => {
        // Get the start date of the selected week
        const selectedWeek = weeks.find(week => week.id === selectedWeekId);
        const defaultMatchDate = selectedWeek
            ? selectedWeek.start_date
            : format(new Date(), 'yyyy-MM-dd');

        // Initialize with default values
        let initialMatchState = {
            match_date: defaultMatchDate,
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

    // Update handleCreateMatch to use API service
    const handleCreateMatch = async () => {
        try {
            if (!selectedWeekId) {
                alert("No week selected. Please create or select a week first.");
                return;
            }

            // Show that we're saving
            console.log("Creating match...");

            await post('/matches', {
                ...newMatch,
                week_id: selectedWeekId
            });

            // First, close the dialog regardless of success to improve UX
            handleCreateMatchClose();

            console.log("Match created successfully");

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
            console.error('Error creating match:', error);

            // Even if there's an error, try to refresh the matches
            // since you mentioned the match is actually being created
            setTimeout(() => {
                fetchMatchesForWeek(selectedWeekId);
            }, 500);
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
        setShuffleCount(0); // Reset shuffle count

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
                generatePossibleMatchups(allTeamIds, defaultCourse, newWeek.start_date, 0);
            }
        } else {
            setGeneratedMatchups([]);
        }
    };

    const handleMatchupConfigChange = (e) => {
        const { name, value } = e.target;

        if (name === "selectedTeams") {
            // Reset shuffle count when teams change
            setShuffleCount(0);
            // For multiple select
            setMatchupConfig({
                ...matchupConfig,
                selectedTeams: Array.isArray(value) ? value : [value]
            });

            // Generate new matchups when teams change
            generatePossibleMatchups(
                Array.isArray(value) ? value : [value],
                matchupConfig.selectedCourse,
                matchupConfig.matchDate,
                0 // Reset shuffle seed
            );
        } else {
            // Reset shuffle count when other settings change
            setShuffleCount(0);
            setMatchupConfig({
                ...matchupConfig,
                [name]: value
            });

            // Generate new matchups when other settings change
            if (name === "selectedCourse" || name === "matchDate") {
                generatePossibleMatchups(
                    matchupConfig.selectedTeams,
                    name === "selectedCourse" ? value : matchupConfig.selectedCourse,
                    name === "matchDate" ? value : matchupConfig.matchDate,
                    0 // Reset shuffle seed
                );
            }
        }
    };

    // Add this function to reshuffle matchups
    const reshuffleMatchups = () => {
        if (matchupConfig.selectedTeams && matchupConfig.selectedTeams.length >= 2) {
            setShuffleCount(prev => prev + 1); // Force re-generation with different seed
            generatePossibleMatchups(
                matchupConfig.selectedTeams,
                matchupConfig.selectedCourse,
                matchupConfig.matchDate,
                shuffleCount + 1 // Pass shuffle count as seed
            );
        }
    };

    // Update the generatePossibleMatchups function to accept a shuffle seed
    const generatePossibleMatchups = async (selectedTeamIds, courseId, matchDate, shuffleSeed = 0) => {
        if (!selectedTeamIds || selectedTeamIds.length < 2) {
            setGeneratedMatchups([]);
            return;
        }

        try {
            setMatchupWarning(null);

            // Fetch historical matches for these teams
            const historicalMatches = await get(`/leagues/${leagueId}/matches`);

            const selectedTeams = league.teams.filter(team => selectedTeamIds.includes(team.id));
            const selectedCourse = league.courses.find(course => course.id === courseId);

            // Build matchup history - track how many times each pair has played
            const matchupHistory = new Map();
            const matchupDetails = new Map();

            // Process historical matches
            historicalMatches.forEach(match => {
                const teamIds = [match.home_team_id, match.away_team_id].sort();
                if (!selectedTeamIds.includes(teamIds[0]) || !selectedTeamIds.includes(teamIds[1])) {
                    return;
                }

                const pairingKey = teamIds.join('-');
                matchupHistory.set(pairingKey, (matchupHistory.get(pairingKey) || 0) + 1);

                if (!matchupDetails.has(pairingKey)) {
                    matchupDetails.set(pairingKey, []);
                }
                matchupDetails.get(pairingKey).push({
                    week_id: match.week_id,
                    match_date: match.match_date
                });
            });

            console.log("Matchup history:", Object.fromEntries(matchupHistory));

            // Handle odd number of teams with randomization
            let byeTeam = null;
            let teamsForPairing = [...selectedTeams];

            if (teamsForPairing.length % 2 !== 0) {
                // Randomize bye team selection based on shuffle seed
                const seededRandom = createSeededRandom(shuffleSeed);
                const byeIndex = Math.floor(seededRandom() * teamsForPairing.length);
                byeTeam = teamsForPairing.splice(byeIndex, 1)[0];
            }

            // Generate optimal pairings using improved algorithm with randomization
            const optimalPairings = findOptimalPairings(teamsForPairing, matchupHistory, shuffleSeed);

            // Convert to matchup format
            const matchups = [];
            let hasAnyDuplicates = false;

            optimalPairings.forEach(pairing => {
                const pairingKey = [pairing.team1.id, pairing.team2.id].sort().join('-');
                const previousMatchups = matchupHistory.get(pairingKey) || 0;
                const isDuplicate = previousMatchups > 0;

                if (isDuplicate) {
                    hasAnyDuplicates = true;
                }

                // Randomize home/away assignment
                const seededRandom = createSeededRandom(shuffleSeed + pairing.team1.id + pairing.team2.id);
                const homeFirst = seededRandom() > 0.5;

                matchups.push({
                    home_team_id: homeFirst ? pairing.team1.id : pairing.team2.id,
                    home_team_name: homeFirst ? pairing.team1.name : pairing.team2.name,
                    away_team_id: homeFirst ? pairing.team2.id : pairing.team1.id,
                    away_team_name: homeFirst ? pairing.team2.name : pairing.team1.name,
                    course_id: courseId,
                    course_name: selectedCourse ? selectedCourse.name : 'Not selected',
                    match_date: matchDate,
                    previous_matchups: previousMatchups,
                    is_duplicate: isDuplicate,
                    matchup_history: matchupDetails.get(pairingKey) || [],
                    starting_hole: null // Will be assigned by backend
                });
            });

            // Add bye team if exists
            if (byeTeam) {
                matchups.push({
                    home_team_id: byeTeam.id,
                    home_team_name: byeTeam.name,
                    away_team_id: null,
                    away_team_name: "BYE",
                    course_id: null,
                    course_name: "N/A - Bye Week",
                    match_date: matchDate,
                    is_bye: true,
                    previous_matchups: 0,
                    is_duplicate: false,
                    matchup_history: []
                });
            }

            setGeneratedMatchups(matchups);

            // Analyze the results and provide feedback
            const uniqueMatchups = matchups.filter(m => !m.is_duplicate && !m.is_bye).length;
            const duplicateMatchups = matchups.filter(m => m.is_duplicate).length;

            if (hasAnyDuplicates) {
                if (duplicateMatchups < matchups.length / 2) {
                    setMatchupWarning(
                        `${duplicateMatchups} out of ${matchups.length - (byeTeam ? 1 : 0)} matchups are repeats. ` +
                        `This is optimal given the match history. Try reshuffling for different home/away assignments.`
                    );
                } else {
                    setMatchupWarning(
                        `${duplicateMatchups} out of ${matchups.length - (byeTeam ? 1 : 0)} matchups are repeats. ` +
                        `Consider rotating different teams or try reshuffling for alternative pairings.`
                    );
                }
            } else if (uniqueMatchups > 0) {
                if (shuffleSeed > 0) {
                    setMatchupWarning(`All unique matchups found! (Shuffle #${shuffleSeed})`);
                } else {
                    setMatchupWarning(null);
                }
            }

        } catch (error) {
            console.error("Error generating matchups:", error);
            setMatchupWarning("Error fetching match history. Using basic pairing algorithm.");
            basicMatchupGeneration(selectedTeamIds, courseId, matchDate, shuffleSeed);
        }
    };

    // Add seeded random number generator for consistent randomization
    const createSeededRandom = (seed) => {
        let currentSeed = seed;
        return function () {
            currentSeed = (currentSeed * 9301 + 49297) % 233280;
            return currentSeed / 233280;
        };
    };

    // Update the findOptimalPairings function to include randomization
    const findOptimalPairings = (teams, matchupHistory, shuffleSeed = 0) => {
        const n = teams.length;
        if (n === 0) return [];

        // For small numbers of teams, we can use exact algorithms with randomization
        if (n <= 8) {
            return findOptimalPairingsExact(teams, matchupHistory, shuffleSeed);
        } else {
            // For larger numbers, use a greedy approach with optimization and randomization
            return findOptimalPairingsGreedy(teams, matchupHistory, shuffleSeed);
        }
    };

    // Update exact algorithm to include randomization among equally good solutions
    const findOptimalPairingsExact = (teams, matchupHistory, shuffleSeed = 0) => {
        if (teams.length === 0) return [];
        if (teams.length === 2) {
            return [{ team1: teams[0], team2: teams[1] }];
        }

        // Generate all possible ways to pair the teams
        const allPairings = generateAllPairings(teams);

        // Score each complete pairing set and group by score
        const pairingsByScore = new Map();
        let bestScore = Infinity;

        allPairings.forEach(pairingSet => {
            const score = scorePairingSet(pairingSet, matchupHistory);
            if (score < bestScore) {
                bestScore = score;
            }

            if (!pairingsByScore.has(score)) {
                pairingsByScore.set(score, []);
            }
            pairingsByScore.get(score).push(pairingSet);
        });

        // Get all pairings with the best score
        const bestPairings = pairingsByScore.get(bestScore) || [];

        if (bestPairings.length === 0) return [];

        // Randomly select from the best options using seeded random
        const seededRandom = createSeededRandom(shuffleSeed);
        const randomIndex = Math.floor(seededRandom() * bestPairings.length);

        return bestPairings[randomIndex];
    };

    // Update greedy algorithm to include more randomization
    const findOptimalPairingsGreedy = (teams, matchupHistory, shuffleSeed = 0) => {
        // Create all possible pairings with their scores
        const possiblePairings = [];

        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                const team1 = teams[i];
                const team2 = teams[j];
                const pairingKey = [team1.id, team2.id].sort().join('-');
                const previousMatchups = matchupHistory.get(pairingKey) || 0;

                possiblePairings.push({
                    team1,
                    team2,
                    pairingKey,
                    score: previousMatchups,
                    used: false
                });
            }
        }

        // Group pairings by score (number of previous matchups)
        const pairingsByScore = possiblePairings.reduce((groups, pairing) => {
            const score = pairing.score;
            if (!groups[score]) {
                groups[score] = [];
            }
            groups[score].push(pairing);
            return groups;
        }, {});

        // Sort score groups (prefer lower scores = fewer previous matchups)
        const sortedScores = Object.keys(pairingsByScore).map(Number).sort((a, b) => a - b);

        // Use randomized selection within each score group
        const seededRandom = createSeededRandom(shuffleSeed);
        const result = [];
        const usedTeams = new Set();
        const targetPairings = teams.length / 2;

        for (const score of sortedScores) {
            if (result.length >= targetPairings) break;

            // Shuffle pairings within this score group
            const pairingsInGroup = [...pairingsByScore[score]];
            shuffleArraySeeded(pairingsInGroup, seededRandom);

            for (const pairing of pairingsInGroup) {
                if (result.length >= targetPairings) break;

                if (!usedTeams.has(pairing.team1.id) && !usedTeams.has(pairing.team2.id)) {
                    result.push(pairing);
                    usedTeams.add(pairing.team1.id);
                    usedTeams.add(pairing.team2.id);
                }
            }
        }

        return result;
    };

    // Helper function to shuffle array with seeded random
    const shuffleArraySeeded = (array, seededRandom) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(seededRandom() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    };

    // Update basic generation to include randomization
    const basicMatchupGeneration = (selectedTeamIds, courseId, matchDate, shuffleSeed = 0) => {
        const selectedTeams = league.teams.filter(team => selectedTeamIds.includes(team.id));
        const selectedCourse = league.courses.find(course => course.id === courseId);

        const matchups = [];
        let byeTeam = null;

        // Create a copy for manipulation
        let teamsToShuffle = [...selectedTeams];

        // Handle odd teams with randomization
        if (teamsToShuffle.length % 2 !== 0) {
            const seededRandom = createSeededRandom(shuffleSeed);
            const byeIndex = Math.floor(seededRandom() * teamsToShuffle.length);
            byeTeam = teamsToShuffle.splice(byeIndex, 1)[0];
        }

        // Shuffle teams using seeded random
        const seededRandom = createSeededRandom(shuffleSeed + 100);
        shuffleArraySeeded(teamsToShuffle, seededRandom);

        for (let i = 0; i < teamsToShuffle.length; i += 2) {
            if (i + 1 < teamsToShuffle.length) {
                // Randomize home/away assignment
                const homeAwayRandom = createSeededRandom(shuffleSeed + i);
                const homeFirst = homeAwayRandom() > 0.5;

                matchups.push({
                    home_team_id: homeFirst ? teamsToShuffle[i].id : teamsToShuffle[i + 1].id,
                    home_team_name: homeFirst ? teamsToShuffle[i].name : teamsToShuffle[i + 1].name,
                    away_team_id: homeFirst ? teamsToShuffle[i + 1].id : teamsToShuffle[i].id,
                    away_team_name: homeFirst ? teamsToShuffle[i + 1].name : teamsToShuffle[i].name,
                    course_id: courseId,
                    course_name: selectedCourse ? selectedCourse.name : 'Not selected',
                    match_date: matchDate,
                    previous_matchups: 0, // Unknown in fallback mode
                    is_duplicate: false,
                    matchup_history: []
                });
            }
        }

        if (byeTeam) {
            matchups.push({
                home_team_id: byeTeam.id,
                home_team_name: byeTeam.name,
                away_team_id: null,
                away_team_name: "BYE",
                course_id: null,
                course_name: "N/A - Bye Week",
                match_date: matchDate,
                is_bye: true,
                previous_matchups: 0,
                is_duplicate: false,
                matchup_history: []
            });
        }

        setGeneratedMatchups(matchups);
        const suffix = shuffleSeed > 0 ? ` (Shuffle #${shuffleSeed})` : "";
        setMatchupWarning(`Using basic pairing - match history not available.${suffix}`);
    };

    // Update handleCreateWeek to use API service
    const handleCreateWeek = async () => {
        try {
            const weekData = await post(`/leagues/${leagueId}/weeks`, newWeek);
            const createdWeekId = weekData.id;

            if (generateMatchups && generatedMatchups.length > 0) {
                for (const matchup of generatedMatchups) {
                    if (matchup.is_bye) {
                        continue;
                    }

                    await post('/matches', {
                        home_team_id: matchup.home_team_id,
                        away_team_id: matchup.away_team_id,
                        course_id: matchup.course_id,
                        match_date: matchup.match_date,
                        week_id: createdWeekId
                    });
                }
            }

            // Refresh the weeks list
            await fetchWeeks();

            // Select the newly created week
            setSelectedWeekId(createdWeekId);

            handleCreateWeekClose();

            setNewWeek({
                week_number: newWeek.week_number + 1,
                start_date: format(addDays(parseISO(newWeek.end_date), 1), 'yyyy-MM-dd'),
                end_date: format(addDays(parseISO(newWeek.end_date), 7), 'yyyy-MM-dd')
            });

            setGenerateMatchups(false);
            setGeneratedMatchups([]);

        } catch (error) {
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

    // The handleDeleteWeek function you already have remains the same:
    const handleDeleteWeek = async () => {
        if (!weekToDelete) return;

        try {
            await del(`/leagues/${leagueId}/weeks/${weekToDelete.id}`);

            // If we're deleting the currently selected week, we need to handle selection
            const wasCurrentWeek = weekToDelete.id === selectedWeekId;

            await fetchWeeks();

            // If we deleted the current week, let the system select a new one
            if (wasCurrentWeek) {
                setWeekSelectionInitialized(false);
            }

            handleDeleteWeekClose();
        } catch (error) {
            alert('Failed to delete week. Please try again.');
        }
    };

    // Helper function to get the current week object
    const getCurrentWeek = () => {
        return weeks.find(week => week.id === selectedWeekId);
    };

    // Helper function to check if a week is the most recent
    const isMostRecentWeek = (week) => {
        if (!weeks.length) return false;
        const mostRecent = weeks.reduce((latest, current) =>
            (latest.week_number > current.week_number) ? latest : current
        );
        return week.id === mostRecent.id;
    };

    // Helper function to generate all possible pairings
    const generateAllPairings = (teams) => {
        if (teams.length === 0) return [[]];
        if (teams.length === 2) return [[{ team1: teams[0], team2: teams[1] }]];

        const result = [];
        const firstTeam = teams[0];

        for (let i = 1; i < teams.length; i++) {
            const partner = teams[i];
            const remainingTeams = teams.filter((_, index) => index !== 0 && index !== i);
            const subPairings = generateAllPairings(remainingTeams);

            subPairings.forEach(subPairing => {
                result.push([{ team1: firstTeam, team2: partner }, ...subPairing]);
            });
        }

        return result;
    };

    // Helper function to score a pairing set
    const scorePairingSet = (pairingSet, matchupHistory) => {
        let totalScore = 0;
        pairingSet.forEach(pairing => {
            const pairingKey = [pairing.team1.id, pairing.team2.id].sort().join('-');
            const previousMatchups = matchupHistory.get(pairingKey) || 0;
            totalScore += previousMatchups;
        });
        return totalScore;
    };

    // update formatDate function to handle dates from the API
    const formatDate = (dateString, formatPattern) => {
        if (!dateString) return '';

        try {
            // First parse the ISO date string properly
            const parsedDate = parseISO(dateString);

            // Format with the requested pattern
            return format(parsedDate, formatPattern);
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
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
    const selectedWeek = getCurrentWeek();

    return (
        <div>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button startIcon={<ArrowBackIcon />} onClick={handleBackClick}>
                    Back to Leagues
                </Button>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        onClick={() => navigate(`/leagues/${leagueId}/matchup-matrix`)}
                        variant="outlined"
                        sx={{
                            minWidth: '48px',
                            width: '48px',
                            height: '48px',
                            padding: 0
                        }}
                    >
                        <GridOn />
                    </Button>
                    <Button
                        onClick={() => navigate(`/leagues/${leagueId}/settings`)}
                        variant="outlined"
                        sx={{
                            minWidth: '48px',
                            width: '48px',
                            height: '48px',
                            padding: 0
                        }}
                    >
                        <SettingsIcon />
                    </Button>
                    <Button
                        onClick={() => {
                            const printUrl = selectedWeek
                                ? `/leagues/${leagueId}/print?week=${selectedWeek.week_number}`
                                : `/leagues/${leagueId}/print`;
                            navigate(printUrl);
                        }}
                        variant="outlined"
                        sx={{
                            minWidth: '48px',
                            width: '48px',
                            height: '48px',
                            padding: 0
                        }}
                    >
                        <PrintIcon />
                    </Button>
                </Box>
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
                                        {weeks
                                            .slice()
                                            .sort((a, b) => b.week_number - a.week_number) // Sort by week number descending (most recent first)
                                            .map((week) => {
                                                const isRecent = isMostRecentWeek(week);
                                                return (
                                                    <MenuItem key={week.id} value={week.id}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                            <Typography>
                                                                Week {week.week_number} ({formatDate(week.start_date, 'MMM d')} - {formatDate(week.end_date, 'MMM d')})
                                                            </Typography>
                                                        </Box>
                                                    </MenuItem>
                                                );
                                            })}
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
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="h6">
                                            Week {selectedWeek.week_number}
                                        </Typography>
                                    </Box>
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
                                        Start: {formatDate(selectedWeek.start_date, 'MMMM d, yyyy')}
                                    </Typography>
                                    <Typography variant="body2">
                                        End: {formatDate(selectedWeek.end_date, 'MMMM d, yyyy')}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={
                                            new Date(parseISO(selectedWeek.end_date)) < new Date()
                                                ? (matches.every(match => match.is_completed)
                                                    ? "Completed"
                                                    : "In Progress")
                                                : "Current"
                                        }
                                        color={
                                            new Date(parseISO(selectedWeek.end_date)) < new Date()
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
                                        const date = format((parseISO(match.match_date)), 'yyyy-MM-dd');
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
                                                {format(new Date(parseISO(date)), 'EEEE, MMMM d, yyyy')}
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

                                                        {/* Empty row for spacing */}
                                                        {matchesByDate[date].length === 1 && (
                                                            <TableRow>
                                                                <TableCell colSpan={4} sx={{ height: '10px', border: 'none' }} />
                                                            </TableRow>
                                                        )}
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
                    <Standings league={league} />
                )}

                {activeTab === 2 && (
                    <PlayerStats league={league} />
                )}

                {activeTab === 3 && (
                    <Rankings league={league} />
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
            <Dialog
                open={createMatchDialogOpen}
                onClose={handleCreateMatchClose}
                maxWidth="md"
                fullWidth

            >
                <DialogTitle>Create New Match</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>Match Details</Typography>
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
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="subtitle1">
                                                        {generatedMatchups.length} Matchups will be created:
                                                    </Typography>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={reshuffleMatchups}
                                                        sx={{ minWidth: 120 }}
                                                    >
                                                        🎲 Reshuffle
                                                    </Button>
                                                </Box>

                                                {matchupWarning && (
                                                    <Alert
                                                        severity={matchupWarning.includes('All unique') ? "success" : "warning"}
                                                        sx={{ mb: 2 }}
                                                    >
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
                                                                    key={`${matchup.home_team_id}-${matchup.away_team_id}-${index}`} // Include index to force re-render on shuffle
                                                                    sx={{
                                                                        ...(matchup.is_duplicate && {
                                                                            bgcolor: 'rgba(255, 152, 0, 0.08)', // Light orange background for duplicates
                                                                        })
                                                                    }}
                                                                >
                                                                    <TableCell>{matchup.home_team_name}</TableCell>
                                                                    <TableCell>{matchup.away_team_name}</TableCell>
                                                                    <TableCell>{matchup.course_name}</TableCell>
                                                                    <TableCell>{formatDate(matchup.match_date, 'MMM d, yyyy')}</TableCell>
                                                                    <TableCell>
                                                                        {matchup.is_bye ? (
                                                                            <Chip size="small" label="BYE" color="default" />
                                                                        ) : matchup.is_duplicate ? (
                                                                            <Chip
                                                                                size="small"
                                                                                label={`Played ${matchup.previous_matchups}x`}
                                                                                color="warning"
                                                                            />
                                                                        ) : (
                                                                            <Chip size="small" label="New" color="success" />
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
                        disabled={
                            !newWeek.week_number ||
                            !newWeek.start_date ||
                            !newWeek.end_date ||
                            new Date(newWeek.end_date) <= new Date(newWeek.start_date) ||
                            (generateMatchups && (
                                !matchupConfig.selectedTeams ||
                                matchupConfig.selectedTeams.length < 2 ||
                                !matchupConfig.selectedCourse
                            ))
                        }
                    >
                        Create Week
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Week Confirmation Dialog */}
            <Dialog
                open={deleteWeekDialogOpen}
                onClose={handleDeleteWeekClose}
            >
                <DialogTitle>Confirm Delete Week</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete Week {weekToDelete?.week_number}?
                        This will also delete all matches scheduled for this week.
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteWeekClose}>Cancel</Button>
                    <Button
                        onClick={handleDeleteWeek}
                        color="error"
                        variant="contained"
                    >
                        Delete Week
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default LeagueManagement;