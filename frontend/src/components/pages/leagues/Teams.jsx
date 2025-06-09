import React, { useState, useEffect } from 'react';
import {
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    Collapse,
    IconButton,
    Box,
    Avatar,
    Chip,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Divider
} from '@mui/material';
import {
    Groups as GroupsIcon,
    Person as PersonIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Close as CloseIcon,
    TrendingUp as TrendingUpIcon,
    Sports as SportsIcon,
    EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { get } from '../../../services/api';
import { format, parseISO } from 'date-fns';

const Teams = ({ league }) => {
    const [teamsData, setTeamsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedTeams, setExpandedTeams] = useState(new Set());

    // Player detail dialog state
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [playerDetailOpen, setPlayerDetailOpen] = useState(false);
    const [playerDetailData, setPlayerDetailData] = useState(null);
    const [playerDetailLoading, setPlayerDetailLoading] = useState(false);
    const [playerDetailError, setPlayerDetailError] = useState(null);

    // Fetch detailed team data with players using the new endpoint
    useEffect(() => {
        const fetchTeamsData = async () => {
            if (!league?.id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                console.log(`Fetching teams for league ${league.id}`);

                // This now uses the new /leagues/{league_id}/teams endpoint
                const teams = await get(`/leagues/${league.id}/teams`);
                console.log('Fetched teams data:', teams);

                // Since the backend already filters out substitutes, we don't need frontend filtering
                setTeamsData(teams);
            } catch (error) {
                console.error('Error fetching teams data:', error);
                setError(error.message || 'Failed to load teams data');
            } finally {
                setLoading(false);
            }
        };

        fetchTeamsData();
    }, [league?.id]);

    const toggleTeamExpansion = (teamId) => {
        const newExpanded = new Set(expandedTeams);
        if (newExpanded.has(teamId)) {
            newExpanded.delete(teamId);
        } else {
            newExpanded.add(teamId);
        }
        setExpandedTeams(newExpanded);
    };

    const handlePlayerClick = async (player) => {
        setSelectedPlayer(player);
        setPlayerDetailOpen(true);
        setPlayerDetailLoading(true);
        setPlayerDetailError(null);

        try {
            console.log(`Fetching player detail for player ${player.id} in league ${league.id}`);
            const playerData = await get(`/leagues/${league.id}/players/${player.id}`);
            setPlayerDetailData(playerData);
        } catch (error) {
            console.error('Error fetching player detail:', error);
            setPlayerDetailError(error.message || 'Failed to load player details');
        } finally {
            setPlayerDetailLoading(false);
        }
    };

    const handleClosePlayerDetail = () => {
        setPlayerDetailOpen(false);
        setSelectedPlayer(null);
        setPlayerDetailData(null);
        setPlayerDetailError(null);
    };

    const formatDate = (dateString) => {
        try {
            return format(parseISO(dateString), 'MMM d, yyyy');
        } catch (error) {
            return dateString;
        }
    };

    const formatPoints = (points) => {
        if (points === null || points === undefined) return '0.0';
        return typeof points === 'number' ? points.toFixed(1) : points;
    };

    if (loading) {
        return (
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Teams
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Teams
                </Typography>
                <Alert severity="error">
                    {error}
                </Alert>
            </Paper>
        );
    }

    return (
        <>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Teams ({teamsData.length})
                </Typography>

                {teamsData && teamsData.length > 0 ? (
                    <List>
                        {teamsData.map((team) => (
                            <React.Fragment key={team.id}>
                                <ListItem
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: 'action.hover'
                                        }
                                    }}
                                    onClick={() => toggleTeamExpansion(team.id)}
                                >
                                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                        <GroupsIcon />
                                    </Avatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {team.name}
                                                </Typography>
                                                <Chip
                                                    label={`${team.player_count || 0} players`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            team.description ? (
                                                <Typography variant="body2" color="text.secondary">
                                                    {team.description}
                                                </Typography>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    No description
                                                </Typography>
                                            )
                                        }
                                    />
                                    <IconButton>
                                        {expandedTeams.has(team.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </IconButton>
                                </ListItem>

                                {/* Team Players Collapse */}
                                <Collapse in={expandedTeams.has(team.id)} timeout="auto" unmountOnExit>
                                    <Box sx={{ pl: 8, pr: 2, pb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Team Players:
                                        </Typography>
                                        {team.players && team.players.length > 0 ? (
                                            <List dense>
                                                {team.players.map((player) => (
                                                    <ListItem
                                                        key={player.id}
                                                        sx={{
                                                            py: 0.5,
                                                            cursor: 'pointer',
                                                            borderRadius: 1,
                                                            '&:hover': {
                                                                backgroundColor: 'primary.light',
                                                                color: 'primary.contrastText'
                                                            }
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePlayerClick(player);
                                                        }}
                                                    >
                                                        <PersonIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                                                        <ListItemText
                                                            primary={player.player_name}
                                                            secondary={
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                                    {player.handicap !== null && player.handicap !== undefined ? (
                                                                        <Chip
                                                                            label={`HCP: ${player.handicap}`}
                                                                            size="small"
                                                                            variant="outlined"
                                                                            sx={{ fontSize: '0.7rem', height: '20px' }}
                                                                        />
                                                                    ) : (
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            No handicap
                                                                        </Typography>
                                                                    )}
                                                                    {player.email && (
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            • {player.email}
                                                                        </Typography>
                                                                    )}
                                                                    <Typography variant="caption" color="primary.main" sx={{ fontWeight: 'bold' }}>
                                                                        Click for details →
                                                                    </Typography>
                                                                </Box>
                                                            }
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    No regular players assigned to this team
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Collapse>
                            </React.Fragment>
                        ))}
                    </List>
                ) : (
                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                        <GroupsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                            No teams assigned to this league.
                        </Typography>
                    </Paper>
                )}
            </Paper>

            {/* Player Detail Dialog */}
            <Dialog
                open={playerDetailOpen}
                onClose={handleClosePlayerDetail}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6">
                            {selectedPlayer?.player_name} - League Statistics
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                            {league?.name}
                        </Typography>
                    </Box>
                    <IconButton onClick={handleClosePlayerDetail}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers>
                    {playerDetailLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : playerDetailError ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {playerDetailError}
                        </Alert>
                    ) : playerDetailData ? (
                        <Box>
                            {/* Player Info */}
                            <Grid container spacing={3} sx={{ mb: 3 }}>
                                <Grid item xs={12} md={4}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                                Player Info
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Email:</strong> {playerDetailData.email || 'Not provided'}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Current Handicap:</strong> {playerDetailData.current_handicap || 'Not set'}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Teams:</strong> {playerDetailData.teams_played_for?.join(', ') || 'None'}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                <SportsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                                Match Statistics
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Total Matches:</strong> {playerDetailData.statistics.total_matches}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Regular Matches:</strong> {playerDetailData.statistics.regular_matches}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Substitute Matches:</strong> {playerDetailData.statistics.substitute_matches}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Completed:</strong> {playerDetailData.statistics.completed_matches}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                <TrophyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                                Performance
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Total Points:</strong> {formatPoints(playerDetailData.statistics.total_points_earned)}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Avg Points/Match:</strong> {formatPoints(playerDetailData.statistics.avg_points_per_match)}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Avg Gross:</strong> {playerDetailData.statistics.avg_gross_score?.toFixed(1) || 'N/A'}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Avg Net:</strong> {playerDetailData.statistics.avg_net_score?.toFixed(1) || 'N/A'}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Best Performances */}
                            <Card sx={{ mb: 3 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Best Performances
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={4}>
                                            <Typography variant="body2" color="text.secondary">Best Gross Score</Typography>
                                            <Typography variant="h6" color="success.main">
                                                {playerDetailData.statistics.best_gross_score || 'N/A'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Typography variant="body2" color="text.secondary">Best Net Score</Typography>
                                            <Typography variant="h6" color="success.main">
                                                {playerDetailData.statistics.best_net_score || 'N/A'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Typography variant="body2" color="text.secondary">Best Points Match</Typography>
                                            <Typography variant="h6" color="primary.main">
                                                {formatPoints(playerDetailData.statistics.best_points_match)} pts
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    {playerDetailData.statistics.handicap_improvement !== null && (
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="body2" color="text.secondary">Handicap Improvement</Typography>
                                            <Typography
                                                variant="h6"
                                                color={playerDetailData.statistics.handicap_improvement > 0 ? 'success.main' : 'error.main'}
                                            >
                                                <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                                {playerDetailData.statistics.handicap_improvement > 0 ? '+' : ''}{playerDetailData.statistics.handicap_improvement?.toFixed(1)} strokes
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Match History */}
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Recent Match History
                                    </Typography>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Week</TableCell>
                                                    <TableCell>Date</TableCell>
                                                    <TableCell>Course</TableCell>
                                                    <TableCell>Opponent</TableCell>
                                                    <TableCell align="center">Gross</TableCell>
                                                    <TableCell align="center">Net</TableCell>
                                                    <TableCell align="center">Points</TableCell>
                                                    <TableCell align="center">Sub</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {playerDetailData.matches.slice(0, 10).map((match) => (
                                                    <TableRow key={match.match_id}>
                                                        <TableCell>{match.week_number}</TableCell>
                                                        <TableCell>{formatDate(match.match_date)}</TableCell>
                                                        <TableCell>{match.course_name}</TableCell>
                                                        <TableCell>{match.opponent_team_name}</TableCell>
                                                        <TableCell align="center">{match.gross_score || '-'}</TableCell>
                                                        <TableCell align="center">{match.net_score || '-'}</TableCell>
                                                        <TableCell align="center">{formatPoints(match.points_earned)}</TableCell>
                                                        <TableCell align="center">
                                                            {match.is_substitute ? (
                                                                <Chip label="SUB" size="small" color="warning" />
                                                            ) : (
                                                                '-'
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                    {playerDetailData.matches.length > 10 && (
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                            Showing 10 most recent matches of {playerDetailData.matches.length} total
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Box>
                    ) : null}
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClosePlayerDetail}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Teams;