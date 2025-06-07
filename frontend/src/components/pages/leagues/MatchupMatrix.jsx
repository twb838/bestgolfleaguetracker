import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Card,
    CardContent,
    Grid
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    GridOn as MatrixIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { get } from '../../../services/api';

const MatchupMatrix = () => {
    const { leagueId } = useParams();
    const navigate = useNavigate();

    // State
    const [league, setLeague] = useState(null);
    const [matches, setMatches] = useState([]);
    const [weeks, setWeeks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedWeekFilter, setSelectedWeekFilter] = useState('all');
    const [matrixData, setMatrixData] = useState({});
    const [teamStats, setTeamStats] = useState({});

    useEffect(() => {
        fetchData();
    }, [leagueId]);

    useEffect(() => {
        if (matches.length > 0 && league?.teams && weeks.length > 0) {
            buildMatrixData();
        }
    }, [matches, league, selectedWeekFilter, weeks]); // Add weeks to dependencies

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch league details, matches, and weeks in parallel
            const [leagueData, matchesData, weeksData] = await Promise.all([
                get(`/leagues/${leagueId}`),
                get(`/leagues/${leagueId}/matches`),
                get(`/leagues/${leagueId}/weeks`)
            ]);

            setLeague(leagueData);
            setMatches(matchesData);
            setWeeks(weeksData.sort((a, b) => a.week_number - b.week_number));
        } catch (err) {
            setError('Failed to load matchup data');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Update the buildMatrixData function
    const buildMatrixData = () => {
        if (!league?.teams || !matches.length || !weeks.length) return;

        const teams = league.teams.sort((a, b) => a.name.localeCompare(b.name));
        const filteredMatches = selectedWeekFilter === 'all'
            ? matches
            : matches.filter(match => match.week_id === parseInt(selectedWeekFilter));

        // Build matrix data
        const matrix = {};
        const stats = {};

        // Initialize matrix and stats
        teams.forEach(team => {
            matrix[team.id] = {};
            stats[team.id] = {
                name: team.name,
                totalGames: 0,
                opponents: new Set(),
                weeksPlayed: new Set()
            };

            teams.forEach(opponent => {
                if (team.id !== opponent.id) {
                    matrix[team.id][opponent.id] = [];
                }
            });
        });

        // Create a week lookup map for better performance
        const weekLookup = {};
        weeks.forEach(week => {
            weekLookup[week.id] = week;
            // Also map week_id if it exists and is different
            if (week.week_id && week.week_id !== week.id) {
                weekLookup[week.week_id] = week;
            }
        });

        // Fill matrix with match data
        filteredMatches.forEach(match => {
            const homeTeamId = match.home_team_id;
            const awayTeamId = match.away_team_id;

            if (!homeTeamId || !awayTeamId) return; // Skip bye weeks

            // Use the lookup map for better performance
            const weekData = weekLookup[match.week_id];
            const weekNumber = weekData?.week_number || match.week_number || 'Unknown';

            const matchInfo = {
                weekNumber,
                weekId: match.week_id,
                matchId: match.id,
                homeTeam: homeTeamId,
                awayTeam: awayTeamId,
                isCompleted: match.is_completed,
                homePoints: match.home_team_points,
                awayPoints: match.away_team_points,
                matchDate: match.match_date,
                courseName: match.course?.name || 'Unknown Course'
            };

            // Add to both teams' records
            if (matrix[homeTeamId] && matrix[homeTeamId][awayTeamId]) {
                matrix[homeTeamId][awayTeamId].push(matchInfo);
            }
            if (matrix[awayTeamId] && matrix[awayTeamId][homeTeamId]) {
                matrix[awayTeamId][homeTeamId].push(matchInfo);
            }

            // Update stats
            [homeTeamId, awayTeamId].forEach(teamId => {
                if (stats[teamId]) {
                    stats[teamId].totalGames++;
                    stats[teamId].opponents.add(teamId === homeTeamId ? awayTeamId : homeTeamId);
                    stats[teamId].weeksPlayed.add(weekNumber);
                }
            });
        });

        // Convert sets to counts
        Object.keys(stats).forEach(teamId => {
            stats[teamId].uniqueOpponents = stats[teamId].opponents.size;
            stats[teamId].weeksActive = stats[teamId].weeksPlayed.size;
            delete stats[teamId].opponents;
            delete stats[teamId].weeksPlayed;
        });

        setMatrixData(matrix);
        setTeamStats(stats);
    };

    const renderMatchupCell = (team1Id, team2Id) => {
        if (team1Id === team2Id) {
            return (
                <TableCell
                    key={`${team1Id}-${team2Id}`}
                    sx={{
                        bgcolor: 'grey.100',
                        textAlign: 'center',
                        border: '1px solid',
                        borderColor: 'grey.300'
                    }}
                >
                    -
                </TableCell>
            );
        }

        const matchups = matrixData[team1Id]?.[team2Id] || [];

        return (
            <TableCell
                key={`${team1Id}-${team2Id}`}
                sx={{
                    textAlign: 'center',
                    padding: 1,
                    border: '1px solid',
                    borderColor: 'grey.300',
                    minWidth: 80,
                    bgcolor: matchups.length === 0 ? 'grey.50' : 'white'
                }}
            >
                {matchups.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                        -
                    </Typography>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {matchups.map((match, index) => (
                            <Tooltip
                                key={index}
                                title={
                                    <Box>
                                        <Typography variant="body2">
                                            Week {match.weekNumber}
                                        </Typography>
                                        <Typography variant="caption">
                                            {match.courseName}
                                        </Typography>
                                        {match.isCompleted && (
                                            <Typography variant="caption" display="block">
                                                Score: {match.homePoints} - {match.awayPoints}
                                            </Typography>
                                        )}
                                        <Typography variant="caption" display="block">
                                            Click to view match details
                                        </Typography>
                                    </Box>
                                }
                            >
                                <Chip
                                    size="small"
                                    label={`W${match.weekNumber}`}
                                    color={match.isCompleted ? "success" : "primary"}
                                    variant={match.isCompleted ? "filled" : "outlined"}
                                    onClick={() => {
                                        navigate(`/matches/${match.matchId}/scores`, {
                                            state: {
                                                returnTo: `/leagues/${leagueId}/matchup-matrix`
                                            }
                                        });
                                    }}
                                    sx={{
                                        cursor: 'pointer',
                                        fontSize: '10px',
                                        height: 20,
                                        minWidth: 35,
                                        '&:hover': {
                                            transform: 'scale(1.05)'
                                        }
                                    }}
                                />
                            </Tooltip>
                        ))}
                    </Box>
                )}
            </TableCell>
        );
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
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/leagues/${leagueId}`)}>
                    Back to League
                </Button>
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            </Box>
        );
    }

    const teams = league?.teams?.sort((a, b) => a.name.localeCompare(b.name)) || [];

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate(`/leagues/${leagueId}`)}
                        sx={{ mb: 1 }}
                    >
                        Back to League
                    </Button>
                    <Typography variant="h4" component="h1">
                        Matchup Matrix - {league?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Visual representation of which teams have played each other
                    </Typography>
                </Box>
                <MatrixIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary.main">
                                {teams.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total Teams
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary.main">
                                {matches.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total Matches
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary.main">
                                {matches.filter(m => m.is_completed).length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Completed
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary.main">
                                {weeks.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total Weeks
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Filter by Week</InputLabel>
                        <Select
                            value={selectedWeekFilter}
                            label="Filter by Week"
                            onChange={(e) => setSelectedWeekFilter(e.target.value)}
                        >
                            <MenuItem value="all">All Weeks</MenuItem>
                            {weeks.map(week => (
                                <MenuItem key={week.id} value={week.id}>
                                    Week {week.week_number}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Alert severity="info" icon={<InfoIcon />} sx={{ flexGrow: 1 }}>
                        <strong>How to read:</strong> Each cell shows when teams played each other.
                        Green chips = completed matches, Blue chips = scheduled matches.
                        Click chips to view match details.
                    </Alert>
                </Box>
            </Paper>

            {/* Matrix Table */}
            <Paper sx={{ overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: '70vh' }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    sx={{
                                        bgcolor: 'primary.main',
                                        color: 'primary.contrastText',
                                        fontWeight: 'bold',
                                        minWidth: 120,
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 3
                                    }}
                                >
                                    Team vs Team
                                </TableCell>
                                {teams.map(team => (
                                    <TableCell
                                        key={team.id}
                                        sx={{
                                            bgcolor: 'primary.main',
                                            color: 'primary.contrastText',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            minWidth: 80,
                                            padding: 1,
                                            writingMode: 'vertical-rl',
                                            textOrientation: 'mixed',
                                            height: 120
                                        }}
                                    >
                                        <Box sx={{ transform: 'rotate(180deg)' }}>
                                            {team.name}
                                        </Box>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {teams.map(team => (
                                <TableRow key={team.id}>
                                    <TableCell
                                        sx={{
                                            bgcolor: 'primary.main',
                                            color: 'primary.contrastText',
                                            fontWeight: 'bold',
                                            position: 'sticky',
                                            left: 0,
                                            zIndex: 2
                                        }}
                                    >
                                        {team.name}
                                    </TableCell>
                                    {teams.map(opponent =>
                                        renderMatchupCell(team.id, opponent.id)
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Team Statistics */}
            <Paper sx={{ mt: 3, p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Team Statistics
                </Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Team</strong></TableCell>
                                <TableCell align="center"><strong>Games Played</strong></TableCell>
                                <TableCell align="center"><strong>Unique Opponents</strong></TableCell>
                                <TableCell align="center"><strong>Weeks Active</strong></TableCell>
                                <TableCell align="center"><strong>Avg Games/Week</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.entries(teamStats)
                                .sort(([, a], [, b]) => b.totalGames - a.totalGames)
                                .map(([teamId, stats]) => (
                                    <TableRow key={teamId}>
                                        <TableCell>{stats.name}</TableCell>
                                        <TableCell align="center">{stats.totalGames}</TableCell>
                                        <TableCell align="center">{stats.uniqueOpponents}</TableCell>
                                        <TableCell align="center">{stats.weeksActive}</TableCell>
                                        <TableCell align="center">
                                            {stats.weeksActive > 0 ? (stats.totalGames / stats.weeksActive).toFixed(1) : '0.0'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default MatchupMatrix;