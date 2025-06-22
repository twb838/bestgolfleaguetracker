import React, { useState, useEffect } from 'react';
import { get, post, put, del } from '../../services/api'; // Import API service
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Alert,
    CircularProgress,
    TableSortLabel,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemText,
    Card,
    CardContent,
    Grid
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Person as PersonIcon,
    Groups as GroupsIcon,
    EmojiEvents as TournamentIcon,
    SportsGolf as GolfIcon
} from '@mui/icons-material';
import env from '../../config/env';

const Players = () => {
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentPlayer, setCurrentPlayer] = useState({
        first_name: '',
        last_name: '',
        email: '',
        handicap: 0,
        team_id: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    // Add sorting state
    const [sortConfig, setSortConfig] = useState({
        key: 'last_name',
        direction: 'asc'
    });

    // New state variables
    const [playerDetailsOpen, setPlayerDetailsOpen] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [playerTeams, setPlayerTeams] = useState([]);
    const [playerStats, setPlayerStats] = useState(null);
    const [loadingPlayerDetails, setLoadingPlayerDetails] = useState(false);

    // Fetch players and teams
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Fetching players and teams...');

            // Use API service instead of direct fetch
            const playersData = await get('/players');
            setPlayers(playersData);

            const teamsData = await get('/teams');
            setTeams(teamsData);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const handleOpenDialog = (player = null) => {
        if (player) {
            setCurrentPlayer({
                id: player.id,
                first_name: player.first_name,
                last_name: player.last_name,
                email: player.email,
                handicap: player.handicap || 0,
                team_id: player.team_id || ''
            });
            setIsEditing(true);
        } else {
            setCurrentPlayer({
                first_name: '',
                last_name: '',
                email: '',
                handicap: 0,
                team_id: ''
            });
            setIsEditing(false);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentPlayer({
            first_name: '',
            last_name: '',
            email: '',
            handicap: 0,
            team_id: ''
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentPlayer({
            ...currentPlayer,
            [name]: value
        });
    };

    const handleSavePlayer = async () => {
        try {
            // Handle empty team_id
            const playerData = { ...currentPlayer };
            if (playerData.team_id === '') {
                playerData.team_id = null;
            }

            let result;
            if (isEditing) {
                // Use put method from API service
                result = await put(`/players/${currentPlayer.id}`, playerData);
            } else {
                // Use post method from API service
                result = await post('/players', playerData);
            }

            setSuccessMessage(`Player ${isEditing ? 'updated' : 'created'} successfully!`);
            handleCloseDialog();
            fetchData();
        } catch (err) {
            console.error('Error saving player:', err);
            setError(err.message);
        }
    };

    const handleDeletePlayer = async (playerId) => {
        if (!window.confirm('Are you sure you want to delete this player?')) {
            return;
        }

        try {
            // Use del method from API service
            await del(`/players/${playerId}`);

            setSuccessMessage('Player deleted successfully!');
            fetchData();
        } catch (err) {
            console.error('Error deleting player:', err);
            setError(err.message);
        }
    };

    const getTeamName = (teamId) => {
        if (!teamId) return 'None';
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : 'Unknown';
    };

    // Add sorting function
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Function to get sorted data
    const getSortedPlayers = () => {
        const sortedPlayers = [...players];
        if (sortConfig.key) {
            sortedPlayers.sort((a, b) => {
                // Handle null or undefined values
                if (a[sortConfig.key] === null || a[sortConfig.key] === undefined) return 1;
                if (b[sortConfig.key] === null || b[sortConfig.key] === undefined) return -1;

                // Special case for team sorting - use team name instead of ID
                if (sortConfig.key === 'team_id') {
                    const teamA = getTeamName(a.team_id).toLowerCase();
                    const teamB = getTeamName(b.team_id).toLowerCase();

                    if (teamA < teamB) {
                        return sortConfig.direction === 'asc' ? -1 : 1;
                    }
                    if (teamA > teamB) {
                        return sortConfig.direction === 'asc' ? 1 : -1;
                    }
                    return 0;
                }

                // Normal string/number comparison
                if (typeof a[sortConfig.key] === 'string') {
                    const valueA = a[sortConfig.key].toLowerCase();
                    const valueB = b[sortConfig.key].toLowerCase();

                    if (valueA < valueB) {
                        return sortConfig.direction === 'asc' ? -1 : 1;
                    }
                    if (valueA > valueB) {
                        return sortConfig.direction === 'asc' ? 1 : -1;
                    }
                    return 0;
                } else {
                    // For numbers like handicap
                    return sortConfig.direction === 'asc'
                        ? a[sortConfig.key] - b[sortConfig.key]
                        : b[sortConfig.key] - a[sortConfig.key];
                }
            });
        }
        return sortedPlayers;
    };

    // New function to fetch player details
    const fetchPlayerDetails = async (playerId) => {
        setLoadingPlayerDetails(true);
        setError(null);
        try {
            const playerData = await get(`/players/${playerId}`);
            setSelectedPlayer(playerData);

            // Fetch player's teams
            const teamsData = await get(`/players/${playerId}/teams`);
            setPlayerTeams(teamsData);

            // Fetch player's stats
            const statsData = await get(`/players/${playerId}/stats`);
            setPlayerStats(statsData);
        } catch (err) {
            console.error('Error fetching player details:', err);
            setError(err.message);
        } finally {
            setLoadingPlayerDetails(false);
        }
    };

    const fetchPlayerTeams = async (playerId) => {
        try {
            console.log('Fetching teams for player:', playerId);
            const playerTeamsData = await get(`/players/${playerId}/teams`);
            setPlayerTeams(playerTeamsData.teams || []);
        } catch (err) {
            console.error('Error fetching player teams:', err);
            setError(err.message);
            setPlayerTeams([]);
        }
    };

    const fetchPlayerStats = async (playerId) => {
        try {
            console.log('Fetching stats for player:', playerId);
            // You'll need to create this endpoint or modify existing one
            const playerStatsData = await get(`/players/${playerId}/stats`);
            setPlayerStats(playerStatsData);
        } catch (err) {
            console.error('Error fetching player stats:', err);
            // Don't set error for stats - it's optional
            setPlayerStats(null);
        }
    };

    const handlePlayerClick = async (player) => {
        setSelectedPlayer(player);
        setPlayerDetailsOpen(true);
        setLoadingPlayerDetails(true);

        try {
            await Promise.all([
                fetchPlayerTeams(player.id),
                fetchPlayerStats(player.id)
            ]);
        } finally {
            setLoadingPlayerDetails(false);
        }
    };

    const handleClosePlayerDetails = () => {
        setPlayerDetailsOpen(false);
        setSelectedPlayer(null);
        setPlayerTeams([]);
        setPlayerStats(null);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Players
                </Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchData}
                        sx={{ mr: 1 }}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        Add Player
                    </Button>
                </Box>
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

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    <TableSortLabel
                                        active={sortConfig.key === 'first_name'}
                                        direction={sortConfig.key === 'first_name' ? sortConfig.direction : 'asc'}
                                        onClick={() => handleSort('first_name')}
                                    >
                                        First Name
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={sortConfig.key === 'last_name'}
                                        direction={sortConfig.key === 'last_name' ? sortConfig.direction : 'asc'}
                                        onClick={() => handleSort('last_name')}
                                    >
                                        Last Name
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={sortConfig.key === 'email'}
                                        direction={sortConfig.key === 'email' ? sortConfig.direction : 'asc'}
                                        onClick={() => handleSort('email')}
                                    >
                                        Email
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={sortConfig.key === 'handicap'}
                                        direction={sortConfig.key === 'handicap' ? sortConfig.direction : 'asc'}
                                        onClick={() => handleSort('handicap')}
                                    >
                                        Handicap
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={sortConfig.key === 'team_id'}
                                        direction={sortConfig.key === 'team_id' ? sortConfig.direction : 'asc'}
                                        onClick={() => handleSort('team_id')}
                                    >
                                        Team
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {players.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">No players found</TableCell>
                                </TableRow>
                            ) : (
                                getSortedPlayers().map((player) => (
                                    <TableRow key={player.id} hover>
                                        <TableCell>
                                            <Button
                                                variant="text"
                                                color="primary"
                                                onClick={() => handlePlayerClick(player)}
                                                sx={{
                                                    textTransform: 'none',
                                                    fontWeight: 'normal',
                                                    justifyContent: 'flex-start',
                                                    p: 0,
                                                    minWidth: 'auto',
                                                    '&:hover': {
                                                        backgroundColor: 'transparent',
                                                        textDecoration: 'underline'
                                                    }
                                                }}
                                            >
                                                {player.first_name}
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="text"
                                                color="primary"
                                                onClick={() => handlePlayerClick(player)}
                                                sx={{
                                                    textTransform: 'none',
                                                    fontWeight: 'normal',
                                                    justifyContent: 'flex-start',
                                                    p: 0,
                                                    minWidth: 'auto',
                                                    '&:hover': {
                                                        backgroundColor: 'transparent',
                                                        textDecoration: 'underline'
                                                    }
                                                }}
                                            >
                                                {player.last_name}
                                            </Button>
                                        </TableCell>
                                        <TableCell>{player.email}</TableCell>
                                        <TableCell>{player.handicap || 0}</TableCell>
                                        <TableCell>{getTeamName(player.team_id)}</TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleOpenDialog(player)}
                                                size="small"
                                                title="Edit Player"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDeletePlayer(player.id)}
                                                size="small"
                                                title="Delete Player"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Add/Edit Player Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{isEditing ? 'Edit Player' : 'Add New Player'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="First Name"
                            name="first_name"
                            value={currentPlayer.first_name}
                            onChange={handleInputChange}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Last Name"
                            name="last_name"
                            value={currentPlayer.last_name}
                            onChange={handleInputChange}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Email"
                            name="email"
                            type="email"
                            value={currentPlayer.email}
                            onChange={handleInputChange}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Handicap"
                            name="handicap"
                            type="number"
                            value={currentPlayer.handicap}
                            onChange={handleInputChange}
                            fullWidth
                            InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Team (Optional)</InputLabel>
                            <Select
                                name="team_id"
                                value={currentPlayer.team_id}
                                onChange={handleInputChange}
                                label="Team (Optional)"
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {teams.map((team) => (
                                    <MenuItem key={team.id} value={team.id}>
                                        {team.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSavePlayer}
                        disabled={!currentPlayer.first_name || !currentPlayer.last_name || !currentPlayer.email}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Player Details Dialog */}
            <Dialog
                open={playerDetailsOpen}
                onClose={handleClosePlayerDetails}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Box>
                                <Typography variant="h6">
                                    {selectedPlayer?.first_name} {selectedPlayer?.last_name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Player Profile & Statistics
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton
                            color="primary"
                            onClick={() => {
                                handleClosePlayerDetails();
                                handleOpenDialog(selectedPlayer);
                            }}
                            size="small"
                            title="Edit Player"
                        >
                            <EditIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {loadingPlayerDetails ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : selectedPlayer && (
                        <Box>
                            {/* Player Basic Information */}
                            <Card sx={{ mb: 3 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                        <PersonIcon sx={{ mr: 1 }} />
                                        Player Information
                                    </Typography>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography variant="body2" color="text.secondary">
                                                First Name
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {selectedPlayer.first_name}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography variant="body2" color="text.secondary">
                                                Last Name
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {selectedPlayer.last_name}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography variant="body2" color="text.secondary">
                                                Email
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {selectedPlayer.email}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography variant="body2" color="text.secondary">
                                                Handicap
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {selectedPlayer.handicap || 'No handicap set'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography variant="body2" color="text.secondary">
                                                Primary Team
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {getTeamName(selectedPlayer.team_id)}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            {/* Player Statistics */}
                            {playerStats && (
                                <Card sx={{ mb: 3 }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                            <GolfIcon sx={{ mr: 1 }} />
                                            Playing Statistics
                                        </Typography>
                                        <Grid container spacing={3}>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Rounds Played
                                                </Typography>
                                                <Typography variant="h4" color="primary.main">
                                                    {playerStats.total_rounds || 0}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Average Score
                                                </Typography>
                                                <Typography variant="h4" color="primary.main">
                                                    {playerStats.average_score ? Number(playerStats.average_score).toFixed(1) : 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Best Score
                                                </Typography>
                                                <Typography variant="h4" color="success.main">
                                                    {playerStats.best_score || 'N/A'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Current Handicap
                                                </Typography>
                                                <Typography variant="h4" color="secondary.main">
                                                    {playerStats.current_handicap || selectedPlayer.handicap || 'N/A'}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Team Memberships */}
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                        <GroupsIcon sx={{ mr: 1 }} />
                                        Team Memberships ({playerTeams.length})
                                    </Typography>

                                    {playerTeams.length > 0 ? (
                                        <Box>
                                            {playerTeams.map((team, index) => (
                                                <Paper
                                                    key={team.id || index}
                                                    elevation={1}
                                                    sx={{
                                                        p: 2,
                                                        mb: 2,
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                        '&:last-child': { mb: 0 }
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                        <Box sx={{ flex: 1 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                                <Typography variant="subtitle1" fontWeight="bold">
                                                                    {team.name}
                                                                </Typography>
                                                                {team.status === 'primary' && (
                                                                    <Chip
                                                                        label="Primary"
                                                                        size="small"
                                                                        color="primary"
                                                                        sx={{ ml: 1 }}
                                                                    />
                                                                )}
                                                                <Chip
                                                                    label={team.type}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    color={team.type === 'league' ? 'success' : 'info'}
                                                                    sx={{ ml: 1 }}
                                                                />
                                                            </Box>

                                                            {team.description && (
                                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                                    {team.description}
                                                                </Typography>
                                                            )}

                                                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                                                {team.league_name && (
                                                                    <Typography variant="body2" color="success.main">
                                                                        <strong>League:</strong> {team.league_name}
                                                                    </Typography>
                                                                )}
                                                                {team.tournament_name && (
                                                                    <Typography variant="body2" color="primary.main">
                                                                        <strong>Tournament:</strong> {team.tournament_name}
                                                                    </Typography>
                                                                )}
                                                                {team.event_name && (
                                                                    <Typography variant="body2" color="secondary.main">
                                                                        <strong>Event:</strong> {team.event_name}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Box>

                                                        <Box sx={{ textAlign: 'right', ml: 2 }}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {team.player_count} players
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Paper>
                                            ))}
                                        </Box>
                                    ) : (
                                        <Box sx={{ textAlign: 'center', py: 3 }}>
                                            <GroupsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                            <Typography variant="body1" color="text.secondary">
                                                This player is not currently a member of any teams.
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClosePlayerDetails}>
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={() => {
                            handleClosePlayerDetails();
                            handleOpenDialog(selectedPlayer);
                        }}
                    >
                        Edit Player
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Players;