import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Grid, Chip, List, ListItem,
    ListItemText, ListItemSecondaryAction, Alert, CircularProgress,
    IconButton
} from '@mui/material';
import {
    Person as PersonIcon,
    PersonAdd as PersonAddIcon,
    Delete as DeleteIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { get, post, del } from '../../../services/api';

function TournamentPlayers({ tournament, onUpdate }) {
    const [createPlayerDialogOpen, setCreatePlayerDialogOpen] = useState(false);
    const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState(false);

    // Player management state
    const [currentParticipants, setCurrentParticipants] = useState([]);
    const [availablePlayers, setAvailablePlayers] = useState([]);
    const [playersLoading, setPlayersLoading] = useState(true);
    const [playerError, setPlayerError] = useState(null);

    // New player creation state
    const [newPlayer, setNewPlayer] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        handicap: ''
    });
    const [playerLoading, setPlayerLoading] = useState(false);

    // Fetch participants when component mounts or tournament changes
    useEffect(() => {
        if (tournament) {
            console.log('Tournament changed, fetching players for tournament:', tournament.id);
            fetchCurrentParticipants();
        }
    }, [tournament]);

    const fetchCurrentParticipants = async () => {
        if (!tournament?.id) return;

        try {
            setPlayersLoading(true);
            console.log(`Fetching players for tournament ${tournament.id}`);

            const participants = await get(`/tournaments/${tournament.id}/players`);
            console.log('Fetched tournament players:', participants);

            setCurrentParticipants(participants);
        } catch (error) {
            console.error('Error fetching tournament players:', error);
            setPlayerError(error.message || 'Failed to fetch tournament players');
        } finally {
            setPlayersLoading(false);
        }
    };

    const fetchAvailablePlayers = async () => {
        try {
            console.log('Fetching all players...');
            const playersData = await get('/players');
            console.log('Fetched players:', playersData);
            setAvailablePlayers(playersData);
        } catch (error) {
            console.error('Error fetching players:', error);
            setPlayerError(error.message || 'Failed to fetch players');
        }
    };

    const handleCreatePlayer = () => {
        setCreatePlayerDialogOpen(true);
    };

    const handleAddExistingPlayer = () => {
        setAddPlayerDialogOpen(true);
        fetchAvailablePlayers();
    };

    const handleCloseCreatePlayerDialog = () => {
        setCreatePlayerDialogOpen(false);
        setNewPlayer({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            handicap: ''
        });
        setPlayerError(null);
    };

    const handleCloseAddPlayerDialog = () => {
        setAddPlayerDialogOpen(false);
        setPlayerError(null);
    };

    const handleCreateNewPlayer = async () => {
        try {
            setPlayerLoading(true);
            setPlayerError(null);

            if (!newPlayer.first_name.trim() || !newPlayer.last_name.trim()) {
                setPlayerError('First name and last name are required');
                return;
            }

            // Create the player
            const playerData = {
                first_name: newPlayer.first_name,
                last_name: newPlayer.last_name,
                email: newPlayer.email || null,
                phone: newPlayer.phone || null,
                handicap: newPlayer.handicap ? parseFloat(newPlayer.handicap) : null
            };

            console.log('Creating new player:', playerData);
            const createdPlayer = await post('/players', playerData);
            console.log('Created player:', createdPlayer);

            // Add the player to the tournament
            console.log(`Adding player ${createdPlayer.id} to tournament ${tournament.id}`);
            await post(`/tournaments/${tournament.id}/players`, {
                player_id: createdPlayer.id
            });

            // Refresh data
            await fetchCurrentParticipants();

            // Notify parent component to refresh tournament data
            if (onUpdate) {
                onUpdate();
            }

            handleCloseCreatePlayerDialog();
            console.log(`New player ${createdPlayer.first_name} ${createdPlayer.last_name} created and added to tournament`);

        } catch (error) {
            console.error('Error creating player:', error);
            setPlayerError(error.message || 'Failed to create player');
        } finally {
            setPlayerLoading(false);
        }
    };

    const handleAddExistingPlayerToTournament = async (player) => {
        try {
            console.log(`Adding existing player ${player.id} to tournament ${tournament.id}`);
            await post(`/tournaments/${tournament.id}/players`, {
                player_id: player.id
            });

            // Refresh data
            await fetchCurrentParticipants();

            // Notify parent component to refresh tournament data
            if (onUpdate) {
                onUpdate();
            }

            console.log(`Player ${player.first_name} ${player.last_name} added to tournament`);
        } catch (error) {
            console.error('Error adding player to tournament:', error);
            setPlayerError(error.message || 'Failed to add player to tournament');
        }
    };

    const handleRemovePlayerFromTournament = async (participant) => {
        try {
            console.log(`Removing player ${participant.id} from tournament ${tournament.id}`);

            await del(`/tournaments/${tournament.id}/players/${participant.id}`);

            // Refresh data
            await fetchCurrentParticipants();

            // Notify parent component to refresh tournament data
            if (onUpdate) {
                onUpdate();
            }

            console.log(`Player ${participant.player_name} removed from tournament`);
        } catch (error) {
            console.error('Error removing player from tournament:', error);
            setPlayerError(error.message || 'Failed to remove player from tournament');
        }
    };

    if (!tournament) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    No tournament selected
                </Typography>
            </Paper>
        );
    }

    // Show loading state while fetching initial data
    if (playersLoading && !addPlayerDialogOpen) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>
                    Loading tournament players...
                </Typography>
            </Box>
        );
    }

    // Show error state if there's an error
    if (playerError && !addPlayerDialogOpen && !createPlayerDialogOpen) {
        return (
            <Paper sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {playerError}
                </Alert>
                <Button onClick={fetchCurrentParticipants} variant="outlined">
                    Retry
                </Button>
            </Paper>
        );
    }

    console.log('Rendering with currentParticipants:', currentParticipants);

    return (
        <Box>
            {/* Tournament Players Overview */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        Tournament Players ({currentParticipants.length})
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={handleAddExistingPlayer}
                        >
                            Add Existing Player
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<PersonAddIcon />}
                            onClick={handleCreatePlayer}
                        >
                            Create New Player
                        </Button>
                    </Box>
                </Box>

                {currentParticipants.length > 0 ? (
                    <List>
                        {currentParticipants.map((participant) => (
                            <ListItem key={participant.id} sx={{ py: 1 }}>
                                <ListItemText
                                    primary={
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {participant.player_name}
                                        </Typography>
                                    }
                                    secondary={
                                        <Box sx={{ mt: 0.5 }}>
                                            {participant.handicap !== null && (
                                                <Chip
                                                    label={`HCP: ${participant.handicap}`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.75rem' }}
                                                />
                                            )}
                                        </Box>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleRemovePlayerFromTournament(participant)}
                                        size="small"
                                        color="error"
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                        <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary" paragraph>
                            No players have been added to this tournament yet.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={handleAddExistingPlayer}
                            >
                                Add Existing Player
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<PersonAddIcon />}
                                onClick={handleCreatePlayer}
                            >
                                Create New Player
                            </Button>
                        </Box>
                    </Paper>
                )}
            </Paper>

            {/* Create New Player Dialog */}
            <Dialog
                open={createPlayerDialogOpen}
                onClose={handleCloseCreatePlayerDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonAddIcon sx={{ mr: 1 }} />
                        Create New Player - {tournament.name}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {playerError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {playerError}
                        </Alert>
                    )}

                    <Box
                        component="form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (newPlayer.first_name.trim() && newPlayer.last_name.trim()) {
                                handleCreateNewPlayer();
                            }
                        }}
                    >
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="First Name"
                                    value={newPlayer.first_name}
                                    onChange={(e) => setNewPlayer({
                                        ...newPlayer,
                                        first_name: e.target.value
                                    })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newPlayer.first_name.trim() && newPlayer.last_name.trim()) {
                                            e.preventDefault();
                                            handleCreateNewPlayer();
                                        }
                                    }}
                                    required
                                    autoFocus
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    value={newPlayer.last_name}
                                    onChange={(e) => setNewPlayer({
                                        ...newPlayer,
                                        last_name: e.target.value
                                    })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newPlayer.first_name.trim() && newPlayer.last_name.trim()) {
                                            e.preventDefault();
                                            handleCreateNewPlayer();
                                        }
                                    }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    type="email"
                                    value={newPlayer.email}
                                    onChange={(e) => setNewPlayer({
                                        ...newPlayer,
                                        email: e.target.value
                                    })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newPlayer.first_name.trim() && newPlayer.last_name.trim()) {
                                            e.preventDefault();
                                            handleCreateNewPlayer();
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Phone"
                                    value={newPlayer.phone}
                                    onChange={(e) => setNewPlayer({
                                        ...newPlayer,
                                        phone: e.target.value
                                    })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newPlayer.first_name.trim() && newPlayer.last_name.trim()) {
                                            e.preventDefault();
                                            handleCreateNewPlayer();
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Handicap"
                                    type="number"
                                    inputProps={{ step: 0.1, min: 0, max: 54 }}
                                    value={newPlayer.handicap}
                                    onChange={(e) => setNewPlayer({
                                        ...newPlayer,
                                        handicap: e.target.value
                                    })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newPlayer.first_name.trim() && newPlayer.last_name.trim()) {
                                            e.preventDefault();
                                            handleCreateNewPlayer();
                                        }
                                    }}
                                    helperText="Optional"
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCreatePlayerDialog}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateNewPlayer}
                        variant="contained"
                        disabled={
                            playerLoading ||
                            !newPlayer.first_name.trim() ||
                            !newPlayer.last_name.trim()
                        }
                    >
                        {playerLoading ? (
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                        ) : null}
                        Create Player
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Existing Player Dialog */}
            <Dialog
                open={addPlayerDialogOpen}
                onClose={handleCloseAddPlayerDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1 }} />
                        Add Existing Player - {tournament.name}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {playerError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {playerError}
                        </Alert>
                    )}

                    <Typography variant="h6" gutterBottom>
                        Available Players
                    </Typography>

                    {(() => {
                        const currentPlayerIds = currentParticipants.map(p => p.player_id) || [];
                        const availablePlayersFiltered = availablePlayers.filter(player => !currentPlayerIds.includes(player.id));

                        return availablePlayersFiltered.length === 0 ? (
                            <Paper sx={{ p: 3, textAlign: 'center' }}>
                                <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="body1" color="text.secondary" paragraph>
                                    {availablePlayers.length === 0 ?
                                        'No players found.' :
                                        'All existing players are already in this tournament.'
                                    }
                                </Typography>
                                <Button
                                    variant="outlined"
                                    onClick={handleCreatePlayer}
                                    startIcon={<PersonAddIcon />}
                                >
                                    Create New Player
                                </Button>
                            </Paper>
                        ) : (
                            <List>
                                {availablePlayersFiltered.map((player) => (
                                    <ListItem key={player.id}>
                                        <ListItemText
                                            primary={`${player.first_name} ${player.last_name}`}
                                            secondary={
                                                <Box>
                                                    {player.email && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {player.email}
                                                        </Typography>
                                                    )}
                                                    {player.handicap !== null && (
                                                        <Chip
                                                            label={`HCP: ${player.handicap}`}
                                                            size="small"
                                                            sx={{ mt: 0.5 }}
                                                        />
                                                    )}
                                                </Box>
                                            }
                                        />
                                        <ListItemSecondaryAction>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => handleAddExistingPlayerToTournament(player)}
                                            >
                                                Add to Tournament
                                            </Button>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        );
                    })()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAddPlayerDialog}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default TournamentPlayers;