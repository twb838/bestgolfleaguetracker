import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Typography,
    Box,
    Button,
    Paper,
    CircularProgress,
    Grid,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    List,
    ListItem
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Print as PrintIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { get } from '../../../services/api';

const PrinterFriendlyLeagueSummary = () => {
    const { leagueId } = useParams();
    const navigate = useNavigate();

    // State variables
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [league, setLeague] = useState(null);
    const [weeks, setWeeks] = useState([]);
    const [selectedWeekId, setSelectedWeekId] = useState(null);
    const [matches, setMatches] = useState([]);
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [playerStats, setPlayerStats] = useState([]);
    const [rankingsData, setRankingsData] = useState({
        topIndividualGross: [],
        topIndividualNet: [],
        topTeamGross: [],
        topTeamNet: []
    });
    const [makeupMatches, setMakeupMatches] = useState([]);
    const [mostImprovedPlayers, setMostImprovedPlayers] = useState([]);
    const [mvpPlayers, setMvpPlayers] = useState([]);
    const [previousWeekMatches, setPreviousWeekMatches] = useState([]);
    const [previousWeek, setPreviousWeek] = useState(null);
    const [previousWeekTopScores, setPreviousWeekTopScores] = useState({
        topGross: [],
        topNet: []
    });

    // Fetch all data on load
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                // Fetch league details
                const leagueData = await get(`/leagues/${leagueId}`);
                setLeague(leagueData);

                // Fetch weeks
                const weeksData = await get(`/leagues/${leagueId}/weeks`);
                setWeeks(weeksData);

                // Find most recent week
                if (weeksData && weeksData.length > 0) {
                    // Sort weeks by week number descending to get the most recent one
                    const sortedWeeks = [...weeksData].sort((a, b) => b.week_number - a.week_number);
                    const latestWeek = sortedWeeks[0];
                    setSelectedWeekId(latestWeek.id);

                    // Fetch matches for the latest week
                    await fetchMatchesForWeek(latestWeek.id, leagueData);
                }

                // Fetch leaderboard data
                try {
                    const leaderboardData = await get(`/leagues/${leagueId}/leaderboard`);
                    setLeaderboardData(leaderboardData);
                } catch (error) {
                    console.error('Error fetching leaderboard:', error);
                    setLeaderboardData([]);
                }

                // Fetch player stats
                try {
                    const playerStatsData = await get(`/player-stats/league/${leagueId}/player-stats?minimum_rounds=1`);
                    setPlayerStats(playerStatsData);
                } catch (error) {
                    console.error('Error fetching player stats:', error);
                    setPlayerStats([]);
                }

                // Fetch rankings data
                await fetchRankingsData();

                // Fetch most improved players
                await fetchMostImprovedPlayers();

                // Fetch MVP players
                await fetchMvpPlayers();

                // Find the previous week for showing results
                if (weeksData && weeksData.length > 1) {
                    // Sort weeks by week number descending
                    const sortedWeeks = [...weeksData].sort((a, b) => b.week_number - a.week_number);
                    // Get the second week (index 1) which is the previous week
                    const prevWeek = sortedWeeks[1];
                    if (prevWeek) {
                        setPreviousWeek(prevWeek);
                        // Fetch the previous week's matches
                        fetchPreviousWeekMatches(prevWeek.id, leagueData);
                    }
                }

            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to load league data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [leagueId]);

    // Separate useEffect to fetch makeup matches after weeks and selectedWeekId are set
    useEffect(() => {
        if (weeks.length > 0 && selectedWeekId && league) {
            console.log('Fetching makeup matches after week and league data loaded');
            fetchMakeupMatches();
        }
    }, [weeks, selectedWeekId, league]);

    const fetchMatchesForWeek = async (weekId, leagueData) => {
        if (!weekId) return;

        try {
            const matchesData = await get(`/matches/weeks/${weekId}/matches`);

            // Enrich the matches data with team and course details
            if (leagueData?.teams && leagueData?.courses) {
                const enrichedMatches = matchesData.map(match => {
                    const homeTeam = leagueData.teams.find(team => team.id === match.home_team_id);
                    const awayTeam = leagueData.teams.find(team => team.id === match.away_team_id);
                    const course = leagueData.courses.find(course => course.id === match.course_id);

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
            setMatches([]);
        }
    };

    const fetchMakeupMatches = async () => {
        try {
            // Fetch all matches for the league
            const allMatches = await get(`/leagues/${leagueId}/matches`);

            // Find the current date
            const currentDate = new Date();

            // Find the week with the selectedWeekId
            const currentWeek = weeks.find(week => week.id === selectedWeekId);

            if (!currentWeek) {
                console.log('No current week found for makeup matches calculation');
                return;
            }

            console.log('Looking for makeup matches, current week:', currentWeek.week_number);

            // Filter matches that:
            // 1. Are not completed
            // 2. Are from past weeks (not the current week)
            // 3. Have a date in the past or are overdue
            const makeup = allMatches.filter(match => {
                // Check if match is not completed
                if (match.is_completed) return false;

                // Check if match is not from the current week
                if (match.week_id === currentWeek.id) return false;

                // Find the week this match belongs to
                const matchWeek = weeks.find(w => w.id === match.week_id);
                if (!matchWeek) return false;

                // Check if the week's end date is in the past
                const isOverdue = new Date(matchWeek.end_date) < currentDate;

                // Add some debugging
                if (isOverdue) {
                    console.log(`Found makeup match: Week ${matchWeek.week_number}, Teams: ${match.home_team_id} vs ${match.away_team_id}`);
                }

                return isOverdue;
            });

            console.log(`Found ${makeup.length} makeup matches`);

            // Enrich the makeup matches with team and course details
            if (league?.teams && league?.courses) {
                const enrichedMakeupMatches = makeup.map(match => {
                    const homeTeam = league.teams.find(team => team.id === match.home_team_id);
                    const awayTeam = league.teams.find(team => team.id === match.away_team_id);
                    const course = league.courses.find(course => course.id === match.course_id);
                    const matchWeek = weeks.find(w => w.id === match.week_id);

                    return {
                        ...match,
                        home_team: homeTeam || { name: `Team #${match.home_team_id}` },
                        away_team: awayTeam || { name: `Team #${match.away_team_id}` },
                        course: course || { name: `Course #${match.course_id}` },
                        week_number: matchWeek?.week_number || 'Unknown'
                    };
                });

                setMakeupMatches(enrichedMakeupMatches);
            } else {
                setMakeupMatches(makeup);
            }
        } catch (error) {
            console.error('Error fetching makeup matches:', error);
            setMakeupMatches([]);
        }
    };

    const fetchPreviousWeekMatches = async (weekId, leagueData) => {
        if (!weekId) return;

        try {
            const matchesData = await get(`/matches/weeks/${weekId}/matches`);

            // Include ALL matches (both completed and incomplete)
            // Enrich the matches data with team and course details
            if (leagueData?.teams && leagueData?.courses) {
                const enrichedMatches = matchesData.map(match => {
                    const homeTeam = leagueData.teams.find(team => team.id === match.home_team_id);
                    const awayTeam = leagueData.teams.find(team => team.id === match.away_team_id);
                    const course = leagueData.courses.find(course => course.id === match.course_id);

                    return {
                        ...match,
                        home_team: homeTeam || { name: `Team #${match.home_team_id}` },
                        away_team: awayTeam || { name: `Team #${match.away_team_id}` },
                        course: course || { name: `Course #${match.course_id}` }
                    };
                });

                setPreviousWeekMatches(enrichedMatches);
            } else {
                setPreviousWeekMatches(matchesData);
            }
        } catch (error) {
            console.error('Error fetching previous week matches:', error);
            setPreviousWeekMatches([]);
        }
    };

    const fetchRankingsData = async () => {
        try {
            // Fetch all ranking data in parallel
            const [individualGrossData, individualNetData, teamGrossData, teamNetData] = await Promise.all([
                get(`/player-stats/league/${leagueId}/top-scores?limit=5&score_type=gross`).catch(() => []),
                get(`/player-stats/league/${leagueId}/top-scores?limit=5&score_type=net`).catch(() => []),
                get(`/team-stats/league/${leagueId}/top-scores?limit=5&score_type=gross`).catch(() => []),
                get(`/team-stats/league/${leagueId}/top-scores?limit=5&score_type=net`).catch(() => [])
            ]);

            setRankingsData({
                topIndividualGross: individualGrossData,
                topIndividualNet: individualNetData,
                topTeamGross: teamGrossData,
                topTeamNet: teamNetData
            });
        } catch (error) {
            console.error('Error fetching rankings data:', error);
            setRankingsData({
                topIndividualGross: [],
                topIndividualNet: [],
                topTeamGross: [],
                topTeamNet: []
            });
        }
    };

    const fetchMostImprovedPlayers = async () => {
        try {
            const data = await get(`/player-stats/league/${leagueId}/most-improved?limit=5`);
            setMostImprovedPlayers(data);
        } catch (error) {
            console.error('Error fetching most improved players:', error);
            setMostImprovedPlayers([]);
        }
    };

    const fetchMvpPlayers = async () => {
        try {
            const data = await get(`/player-stats/league/${leagueId}/mvp?limit=5&min_rounds=1`);
            setMvpPlayers(data);
        } catch (error) {
            console.error('Error fetching MVP players:', error);
            setMvpPlayers([]);
        }
    };

    // Helper function to format points
    const formatPoints = (points) => {
        if (points === null || points === undefined) return '0';
        return Number.isInteger(points) ? points.toString() : points.toFixed(1);
    };

    const fetchPreviousWeekTopScores = async (weekId) => {
        if (!weekId) return;

        try {
            // Fetch top gross and net scores from last week
            const [grossData, netData] = await Promise.all([
                get(`/player-stats/league/${leagueId}/top-scores?limit=3&score_type=gross&week_id=${weekId}`).catch(() => []),
                get(`/player-stats/league/${leagueId}/top-scores?limit=3&score_type=net&week_id=${weekId}`).catch(() => [])
            ]);

            setPreviousWeekTopScores({
                topGross: grossData,
                topNet: netData
            });
        } catch (error) {
            console.error('Error fetching previous week top scores:', error);
            setPreviousWeekTopScores({
                topGross: [],
                topNet: []
            });
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleBack = () => {
        navigate(`/leagues/${leagueId}`);
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
                <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
                    Back to League
                </Button>
                <Paper sx={{ p: 3, mt: 2, textAlign: 'center' }}>
                    <Typography color="error">{error}</Typography>
                </Paper>
            </Box>
        );
    }

    // Log makeup matches for debugging
    console.log(`Rendering with ${makeupMatches.length} makeup matches:`, makeupMatches);

    // Find the selected week
    const selectedWeek = weeks.find(week => week.id === selectedWeekId);

    return (
        <>
            {/* Navigation/controls (hidden when printing) */}
            <Box className="no-print" sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
                    Back to League
                </Button>
                <Button startIcon={<PrintIcon />} onClick={handlePrint} variant="contained" color="primary">
                    Print This Page
                </Button>
            </Box>

            {/* Page title */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    {league?.name} - Summary
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                    {selectedWeek ? `Week ${selectedWeek.week_number}: ${format(parseISO(selectedWeek.start_date), 'MMMM d')} - ${format(parseISO(selectedWeek.end_date), 'MMMM d, yyyy')}` : ''}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Printed on: {format(new Date(), 'MMMM d, yyyy')}
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* SECTION 1: Matchups for the week */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'primary.main', pb: 1 }}>
                            Week {selectedWeek?.week_number} Matchups
                        </Typography>

                        {matches && matches.length > 0 ? (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Course</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Home Team</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Away Team</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Status/Result</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {matches.map(match => (
                                            <TableRow key={match.id}>
                                                <TableCell>
                                                    {format(parseISO(match.match_date), 'MMM d, yyyy')}
                                                </TableCell>
                                                <TableCell>
                                                    {match.course?.name || 'TBD'}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>
                                                    {match.home_team?.name || 'Home Team'}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>
                                                    {match.away_team?.name || 'Away Team'}
                                                </TableCell>
                                                <TableCell>
                                                    {match.is_completed ? (
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                                {match.home_team_points !== null
                                                                    ? (match.home_team_points % 1 === 0
                                                                        ? match.home_team_points
                                                                        : match.home_team_points.toFixed(1))
                                                                    : '-'}
                                                                {' - '}
                                                                {match.away_team_points !== null
                                                                    ? (match.away_team_points % 1 === 0
                                                                        ? match.away_team_points
                                                                        : match.away_team_points.toFixed(1))
                                                                    : '-'}
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="body2">Scheduled</Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                No matches scheduled for this week.
                            </Typography>
                        )}
                    </Paper>
                </Grid>

                {/* SECTION 1.5: Makeup Matches */}
                {makeupMatches && makeupMatches.length > 0 ? (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2, mb: 3, bgcolor: '#fff8e1' }} className="print-force-background">
                            <Typography variant="h5" component="h2" gutterBottom sx={{
                                fontWeight: 'bold',
                                borderBottom: '2px solid',
                                borderColor: 'warning.main',
                                pb: 1,
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <Box component="span" sx={{
                                    bgcolor: 'warning.main',
                                    color: 'white',
                                    px: 1,
                                    py: 0.5,
                                    mr: 1,
                                    borderRadius: 1,
                                    fontSize: '0.8em'
                                }}>
                                    ATTENTION
                                </Box>
                                Makeup Matches ({makeupMatches.length})
                            </Typography>

                            <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                                The following matches are from previous weeks and still need to be completed.
                            </Typography>

                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#fff3cd' }} className="print-force-background">
                                            <TableCell sx={{ fontWeight: 'bold' }}>Week</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Original Date</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Course</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Home Team</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Away Team</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {makeupMatches.map(match => (
                                            <TableRow key={`makeup-${match.id}`} sx={{
                                                backgroundColor: '#fffdf7'
                                            }} className="print-force-background">
                                                <TableCell>
                                                    Week {match.week_number}
                                                </TableCell>
                                                <TableCell>
                                                    {format(parseISO(match.match_date), 'MMM d, yyyy')}
                                                </TableCell>
                                                <TableCell>
                                                    {match.course?.name || 'TBD'}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>
                                                    {match.home_team?.name || 'Home Team'}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>
                                                    {match.away_team?.name || 'Away Team'}
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{
                                                        display: 'inline-block',
                                                        bgcolor: 'warning.light',
                                                        color: 'warning.contrastText',
                                                        px: 1,
                                                        py: 0.25,
                                                        borderRadius: 1,
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold'
                                                    }} className="print-force-background">
                                                        Makeup Required
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                ) : (
                    // If you want to show something when there are no makeup matches
                    <Grid item xs={12} className="no-print">
                        <Box sx={{ p: 1, mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                No makeup matches pending.
                            </Typography>
                        </Box>
                    </Grid>
                )}

                {/* SECTION 1.7: Previous Week Results */}
                {previousWeek && previousWeekMatches.length > 0 ? (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2, mb: 3, bgcolor: '#f0f7ff' }} className="print-force-background">
                            <Typography variant="h5" component="h2" gutterBottom sx={{
                                fontWeight: 'bold',
                                borderBottom: '2px solid',
                                borderColor: 'info.main',
                                pb: 1,
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <Box component="span" sx={{
                                    bgcolor: 'info.main',
                                    color: 'white',
                                    px: 1,
                                    py: 0.5,
                                    mr: 1,
                                    borderRadius: 1,
                                    fontSize: '0.8em'
                                }}>
                                    RESULTS
                                </Box>
                                Week {previousWeek.week_number} Results ({format(parseISO(previousWeek.start_date), 'MMM d')} - {format(parseISO(previousWeek.end_date), 'MMM d')})
                            </Typography>

                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#e3f2fd' }} className="print-force-background">
                                            <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Course</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Home Team</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Away Team</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Result</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {previousWeekMatches.map(match => {
                                            // Determine winner and status
                                            let winner = null;
                                            let status = null;

                                            if (match.is_completed) {
                                                if (match.home_team_points > match.away_team_points) {
                                                    winner = match.home_team.name;
                                                } else if (match.away_team_points > match.home_team_points) {
                                                    winner = match.away_team.name;
                                                } else {
                                                    winner = "Tied";
                                                }
                                                status = "Complete";
                                            } else {
                                                status = "Incomplete";
                                            }

                                            return (
                                                <TableRow key={`prev-${match.id}`} sx={{
                                                    backgroundColor: match.is_completed ? '#f5faff' : '#fff8e1'
                                                }} className="print-force-background">
                                                    <TableCell>
                                                        {format(parseISO(match.match_date), 'MMM d, yyyy')}
                                                    </TableCell>
                                                    <TableCell>
                                                        {match.course?.name || 'N/A'}
                                                    </TableCell>
                                                    <TableCell sx={{
                                                        fontWeight: match.is_completed && match.home_team_points > match.away_team_points ? 'bold' : 'normal'
                                                    }}>
                                                        {match.home_team?.name || 'Home Team'}
                                                    </TableCell>
                                                    <TableCell sx={{
                                                        fontWeight: match.is_completed && match.away_team_points > match.home_team_points ? 'bold' : 'normal'
                                                    }}>
                                                        {match.away_team?.name || 'Away Team'}
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>
                                                        {match.is_completed ? (
                                                            <>
                                                                {match.home_team_points !== null
                                                                    ? (match.home_team_points % 1 === 0
                                                                        ? match.home_team_points
                                                                        : match.home_team_points.toFixed(1))
                                                                    : '-'}
                                                                {' - '}
                                                                {match.away_team_points !== null
                                                                    ? (match.away_team_points % 1 === 0
                                                                        ? match.away_team_points
                                                                        : match.away_team_points.toFixed(1))
                                                                    : '-'}
                                                            </>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">
                                                                No Result
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {match.is_completed ? (
                                                            winner === "Tied" ? (
                                                                <Box sx={{
                                                                    display: 'inline-block',
                                                                    bgcolor: 'grey.200',
                                                                    px: 1,
                                                                    py: 0.25,
                                                                    borderRadius: 1,
                                                                    fontSize: '0.75rem'
                                                                }} className="print-force-background">
                                                                    Tied Match
                                                                </Box>
                                                            ) : (
                                                                <Box sx={{
                                                                    display: 'inline-block',
                                                                    bgcolor: 'success.light',
                                                                    color: 'success.contrastText',
                                                                    px: 1,
                                                                    py: 0.25,
                                                                    borderRadius: 1,
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 'bold'
                                                                }} className="print-force-background">
                                                                    {winner}
                                                                </Box>
                                                            )
                                                        ) : (
                                                            <Box sx={{
                                                                display: 'inline-block',
                                                                bgcolor: 'warning.light',
                                                                color: 'warning.contrastText',
                                                                px: 1,
                                                                py: 0.25,
                                                                borderRadius: 1,
                                                                fontSize: '0.75rem',
                                                                fontWeight: 'bold'
                                                            }} className="print-force-background">
                                                                Incomplete
                                                            </Box>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                ) : null}

                {/* SECTION 2: League Standings */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'primary.main', pb: 1 }}>
                            League Standings
                        </Typography>

                        {leaderboardData && leaderboardData.length > 0 ? (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Team</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Matches</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Points Won</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Points Lost</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Win %</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Low Gross</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Low Net</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {leaderboardData.map((team, index) => (
                                            <TableRow key={team.id} sx={{
                                                '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' }
                                            }}>
                                                <TableCell sx={{ fontWeight: 'bold' }}>{index + 1}</TableCell>
                                                <TableCell>{team.name}</TableCell>
                                                <TableCell align="center">{team.matches_played}</TableCell>
                                                <TableCell align="center">
                                                    {Number.isInteger(team.points_won)
                                                        ? team.points_won
                                                        : team.points_won.toFixed(1)}
                                                </TableCell>
                                                <TableCell align="center">
                                                    {Number.isInteger(team.points_lost)
                                                        ? team.points_lost
                                                        : team.points_lost.toFixed(1)}
                                                </TableCell>
                                                <TableCell align="center">{team.win_percentage}%</TableCell>
                                                <TableCell align="center">{team.lowest_gross || '—'}</TableCell>
                                                <TableCell align="center">{team.lowest_net || '—'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                No standings data available.
                            </Typography>
                        )}
                    </Paper>
                </Grid>

                {/* SECTION 3: Player Stats */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'primary.main', pb: 1 }}>
                            Player Statistics
                        </Typography>

                        {playerStats && playerStats.length > 0 ? (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Player</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Rounds</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Avg Score</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Best Score</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Avg Net</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Low Net</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {/* Sort by average score, ascending */}
                                        {[...playerStats]
                                            .sort((a, b) =>
                                                (a.avg_gross_score || Infinity) - (b.avg_gross_score || Infinity)
                                            )
                                            .map((player) => (
                                                <TableRow key={player.player_id} sx={{
                                                    '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' }
                                                }}>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>{player.player_name}</TableCell>
                                                    <TableCell align="center">{player.rounds_played}</TableCell>
                                                    <TableCell align="center">
                                                        {player.avg_gross_score ? player.avg_gross_score.toFixed(1) : '—'}
                                                    </TableCell>
                                                    <TableCell align="center">{player.lowest_gross_score || '—'}</TableCell>
                                                    <TableCell align="center">
                                                        {player.avg_net_score ? player.avg_net_score.toFixed(1) : '—'}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {player.lowest_net_score ? player.lowest_net_score.toFixed(1) : '—'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                No player statistics available.
                            </Typography>
                        )}
                    </Paper>
                </Grid>

                {/* SECTION 4: Top Rankings */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'primary.main', pb: 1 }}>
                            Top Rankings
                        </Typography>

                        <Grid container spacing={3}>
                            {/* Individual Gross Scores */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Lowest Individual Gross Scores
                                </Typography>

                                {rankingsData.topIndividualGross.length > 0 ? (
                                    <List disablePadding>
                                        {rankingsData.topIndividualGross.map((score, index) => (
                                            <ListItem
                                                key={`gross-${score.player_id}-${index}`}
                                                sx={{
                                                    px: 1,
                                                    py: 0.25,
                                                    backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'transparent'
                                                }}
                                                disableGutters
                                            >
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '20px' }}>
                                                    {index + 1}.
                                                </Typography>
                                                <Box sx={{ ml: 1, flexGrow: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {score.player_name} - <span style={{ fontWeight: 'normal' }}>{score.score}</span>
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {score.date ? format(parseISO(score.date), 'MMM d, yyyy') : ''} - {score.course_name || ''}
                                                    </Typography>
                                                </Box>
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        No individual gross scores recorded yet.
                                    </Typography>
                                )}
                            </Grid>

                            {/* Individual Net Scores */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Lowest Individual Net Scores
                                </Typography>

                                {rankingsData.topIndividualNet.length > 0 ? (
                                    <List disablePadding>
                                        {rankingsData.topIndividualNet.map((score, index) => (
                                            <ListItem
                                                key={`net-${score.player_id}-${index}`}
                                                sx={{
                                                    px: 1,
                                                    py: 0.25,
                                                    backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'transparent'
                                                }}
                                                disableGutters
                                            >
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '20px' }}>
                                                    {index + 1}.
                                                </Typography>
                                                <Box sx={{ ml: 1, flexGrow: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {score.player_name} - <span style={{ fontWeight: 'normal' }}>{score.score}</span>
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {score.date ? format(parseISO(score.date), 'MMM d, yyyy') : ''} - {score.course_name || ''}
                                                    </Typography>
                                                </Box>
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        No individual net scores recorded yet.
                                    </Typography>
                                )}
                            </Grid>

                            {/* Team Gross Scores */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Lowest Team Gross Scores
                                </Typography>

                                {rankingsData.topTeamGross.length > 0 ? (
                                    <List disablePadding>
                                        {rankingsData.topTeamGross.map((score, index) => (
                                            <ListItem
                                                key={`team-gross-${score.team_id}-${index}`}
                                                sx={{
                                                    px: 1,
                                                    py: 0.25,
                                                    backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'transparent'
                                                }}
                                                disableGutters
                                            >
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '20px' }}>
                                                    {index + 1}.
                                                </Typography>
                                                <Box sx={{ ml: 1, flexGrow: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {score.team_name} - <span style={{ fontWeight: 'normal' }}>{score.score}</span>
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {score.date ? format(parseISO(score.date), 'MMM d, yyyy') : ''} - {score.course_name || ''}
                                                    </Typography>
                                                </Box>
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        No team gross scores recorded yet.
                                    </Typography>
                                )}
                            </Grid>

                            {/* Team Net Scores */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Lowest Team Net Scores
                                </Typography>

                                {rankingsData.topTeamNet.length > 0 ? (
                                    <List disablePadding>
                                        {rankingsData.topTeamNet.map((score, index) => (
                                            <ListItem
                                                key={`team-net-${score.team_id}-${index}`}
                                                sx={{
                                                    px: 1,
                                                    py: 0.25,
                                                    backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'transparent'
                                                }}
                                                disableGutters
                                            >
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '20px' }}>
                                                    {index + 1}.
                                                </Typography>
                                                <Box sx={{ ml: 1, flexGrow: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {score.team_name} - <span style={{ fontWeight: 'normal' }}>{score.score}</span>
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {score.date ? format(parseISO(score.date), 'MMM d, yyyy') : ''} - {score.course_name || ''}
                                                    </Typography>
                                                </Box>
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        No team net scores recorded yet.
                                    </Typography>
                                )}
                            </Grid>

                            {/* Most Improved Players */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Most Improved Players
                                </Typography>

                                {mostImprovedPlayers.length > 0 ? (
                                    <List disablePadding>
                                        {mostImprovedPlayers.map((player, index) => (
                                            <ListItem
                                                key={`improved-${player.player_id}`}
                                                sx={{
                                                    px: 1,
                                                    py: 0.25,
                                                    backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'transparent'
                                                }}
                                                disableGutters
                                            >
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '20px' }}>
                                                    {index + 1}.
                                                </Typography>
                                                <Box sx={{ ml: 1, flexGrow: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {player.player_name} - <span style={{
                                                            color: player.improvement > 0 ? '#2e7d32' : '#d32f2f',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {player.improvement_display}
                                                        </span>
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Initial: {player.initial_avg} → Current: {player.overall_avg} ({player.total_rounds} rounds)
                                                    </Typography>
                                                </Box>
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        No players have enough rounds (minimum 4) to calculate improvement.
                                    </Typography>
                                )}
                            </Grid>

                            {/* Most Valuable Players */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Most Valuable Players
                                </Typography>

                                {mvpPlayers.length > 0 ? (
                                    <List disablePadding>
                                        {mvpPlayers.map((player, index) => (
                                            <ListItem
                                                key={`mvp-${player.player_id}`}
                                                sx={{
                                                    px: 1,
                                                    py: 0.25,
                                                    backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'transparent'
                                                }}
                                                disableGutters
                                            >
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '20px' }}>
                                                    {index + 1}.
                                                </Typography>
                                                <Box sx={{ ml: 1, flexGrow: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {player.player_name} - <span style={{
                                                            color: '#2e7d32',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {formatPoints(player.total_points)} pts
                                                        </span>
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {player.team_name || 'Unknown Team'} • {player.rounds_played} round{player.rounds_played !== 1 ? 's' : ''} • Avg: {formatPoints(player.avg_points_per_round)} pts/round
                                                    </Typography>
                                                </Box>
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        No MVP data available yet.
                                    </Typography>
                                )}
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>

            {/* Footer */}
            <Box sx={{ mt: 4, mb: 5, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    {league?.name} Golf League - Summary as of {format(new Date(), 'MMMM d, yyyy')}
                </Typography>
            </Box>
        </>
    );
};

export default PrinterFriendlyLeagueSummary;