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
    TableSortLabel
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon
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
                                    <TableRow key={player.id}>
                                        <TableCell>{player.first_name}</TableCell>
                                        <TableCell>{player.last_name}</TableCell>
                                        <TableCell>{player.email}</TableCell>
                                        <TableCell>{player.handicap || 0}</TableCell>
                                        <TableCell>{getTeamName(player.team_id)}</TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleOpenDialog(player)}
                                                size="small"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDeletePlayer(player.id)}
                                                size="small"
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
        </Box>
    );
};

export default Players;