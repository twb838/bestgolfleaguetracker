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
import format from 'date-fns/format';
import env from '../../config/env';

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

    // Fetch all data on load
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                // Fetch league details
                const leagueResponse = await fetch(`${env.API_BASE_URL}/leagues/${leagueId}`);
                if (!leagueResponse.ok) {
                    throw new Error('League not found');
                }
                const leagueData = await leagueResponse.json();
                setLeague(leagueData);

                // Fetch weeks
                const weeksResponse = await fetch(`${env.API_BASE_URL}/leagues/${leagueId}/weeks`);
                if (!weeksResponse.ok) {
                    throw new Error('Failed to fetch weeks');
                }
                const weeksData = await weeksResponse.json();
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
                const leaderboardResponse = await fetch(`${env.API_BASE_URL}/leagues/${leagueId}/leaderboard`);
                if (leaderboardResponse.ok) {
                    const leaderboardData = await leaderboardResponse.json();
                    setLeaderboardData(leaderboardData);
                }

                // Fetch player stats
                const playerStatsResponse = await fetch(`${env.API_BASE_URL}/playerstats/league/${leagueId}/player-stats?minimum_rounds=1`);
                if (playerStatsResponse.ok) {
                    const playerStatsData = await playerStatsResponse.json();
                    setPlayerStats(playerStatsData);
                }

                // Fetch rankings data
                await fetchRankingsData();

            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to load league data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [leagueId]);

    const fetchMatchesForWeek = async (weekId, leagueData) => {
        if (!weekId) return;

        try {
            const matchesResponse = await fetch(`${env.API_BASE_URL}/matches/weeks/${weekId}/matches`);
            if (!matchesResponse.ok) {
                throw new Error('Failed to fetch matches');
            }

            const matchesData = await matchesResponse.json();

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
        }
    };

    const fetchRankingsData = async () => {
        try {
            // Fetch all ranking data in parallel
            const [individualGrossResponse, individualNetResponse, teamGrossResponse, teamNetResponse] =
                await Promise.all([
                    fetch(`${env.API_BASE_URL}/playerstats/league/${leagueId}/top-scores?limit=5&score_type=gross`),
                    fetch(`${env.API_BASE_URL}/playerstats/league/${leagueId}/top-scores?limit=5&score_type=net`),
                    fetch(`${env.API_BASE_URL}/teamstats/league/${leagueId}/top-scores?limit=5&score_type=gross`),
                    fetch(`${env.API_BASE_URL}/teamstats/league/${leagueId}/top-scores?limit=5&score_type=net`)
                ]);

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
            setRankingsData({
                topIndividualGross: [],
                topIndividualNet: [],
                topTeamGross: [],
                topTeamNet: []
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
                    {league?.name} League Summary
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                    {selectedWeek ? `Week ${selectedWeek.week_number}: ${format(new Date(selectedWeek.start_date), 'MMMM d')} - ${format(new Date(selectedWeek.end_date), 'MMMM d, yyyy')}` : ''}
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
                                                    {format(new Date(match.match_date), 'MMM d, yyyy')}
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
                                                        {score.date ? format(new Date(score.date), 'MMM d, yyyy') : ''} - {score.course_name || ''}
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
                                                        {score.date ? format(new Date(score.date), 'MMM d, yyyy') : ''} - {score.course_name || ''}
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
                                                        {score.date ? format(new Date(score.date), 'MMM d, yyyy') : ''} - {score.course_name || ''}
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
                                                        {score.date ? format(new Date(score.date), 'MMM d, yyyy') : ''} - {score.course_name || ''}
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