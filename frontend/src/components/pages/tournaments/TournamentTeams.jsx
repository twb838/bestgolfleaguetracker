import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Grid, Chip, List, ListItem,
    ListItemText, ListItemSecondaryAction, Alert, CircularProgress,
    IconButton, Collapse, Avatar, Divider, MenuItem, Select, FormControl, InputLabel,
    InputAdornment
} from '@mui/material';
import {
    Groups as GroupsIcon,
    GroupAdd as GroupAddIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Person as PersonIcon,
    Edit as EditIcon,
    PersonAdd as PersonAddIcon,
    PersonRemove as PersonRemoveIcon,
    Warning as WarningIcon,
    Search as SearchIcon,
    Clear as ClearIcon
} from '@mui/icons-material';
import { get, post, del, put } from '../../../services/api';

function TournamentTeams({ tournament, onUpdate }) {
    const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
    const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false);
    const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState(false);
    const [createPlayerDialogOpen, setCreatePlayerDialogOpen] = useState(false);

    // Team management state
    const [currentTeams, setCurrentTeams] = useState([]);
    const [teamsLoading, setTeamsLoading] = useState(true);
    const [teamError, setTeamError] = useState(null);
    const [expandedTeams, setExpandedTeams] = useState(new Set());

    // Player management state
    const [selectedTeamForPlayers, setSelectedTeamForPlayers] = useState(null);
    const [availablePlayers, setAvailablePlayers] = useState([]);
    const [playersLoading, setPlayersLoading] = useState(false);

    // New team creation state
    const [newTeam, setNewTeam] = useState({
        name: '',
        description: ''
    });

    // Edit team state
    const [editingTeam, setEditingTeam] = useState(null);
    const [editTeam, setEditTeam] = useState({
        name: '',
        description: ''
    });

    // New player creation state
    const [newPlayer, setNewPlayer] = useState({
        first_name: '',
        last_name: '',
        email: '',
        handicap: ''
    });

    const [teamLoading, setTeamLoading] = useState(false);

    // Search filter state
    const [playerSearchFilter, setPlayerSearchFilter] = useState('');

    // Memoize validation to prevent recalculation on every render
    const playerValidation = useMemo(() => {
        const firstNameValid = newPlayer.first_name.trim().length > 0;
        const lastNameValid = newPlayer.last_name.trim().length > 0;
        const emailValid = !newPlayer.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newPlayer.email);

        return {
            isValid: firstNameValid && lastNameValid && emailValid,
            firstNameError: !firstNameValid && newPlayer.first_name.length > 0 ? 'First name is required' : null,
            lastNameError: !lastNameValid && newPlayer.last_name.length > 0 ? 'Last name is required' : null,
            emailError: newPlayer.email && !emailValid ? 'Please enter a valid email' : null
        };
    }, [newPlayer.first_name, newPlayer.last_name, newPlayer.email]);

    // Debounced update function
    const handlePlayerFieldChange = useCallback((field, value) => {
        setNewPlayer(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    // Helper function to get team size status
    const getTeamSizeStatus = (team) => {
        const playerCount = team.players?.length || 0;
        const requiredSize = tournament?.team_size || 0;

        if (playerCount < requiredSize) {
            return {
                type: 'warning',
                message: `Needs ${requiredSize - playerCount} more player${requiredSize - playerCount !== 1 ? 's' : ''}`,
                color: 'warning'
            };
        } else if (playerCount > requiredSize) {
            return {
                type: 'error',
                message: `${playerCount - requiredSize} player${playerCount - requiredSize !== 1 ? 's' : ''} over limit`,
                color: 'error'
            };
        } else {
            return {
                type: 'success',
                message: 'Complete team',
                color: 'success'
            };
        }
    };

    // Helper function to check if player can be added
    const canAddPlayerToTeam = (team) => {
        const playerCount = team.players?.length || 0;
        const requiredSize = tournament?.team_size || 0;
        return playerCount < requiredSize;
    };

    // Helper function to filter players based on search term
    const filterPlayers = (players, searchTerm) => {
        if (!searchTerm.trim()) {
            return players;
        }

        const lowercaseSearch = searchTerm.toLowerCase();
        return players.filter(player => {
            const fullName = `${player.first_name} ${player.last_name}`.toLowerCase();
            const email = (player.email || '').toLowerCase();
            const handicap = player.handicap !== null ? player.handicap.toString() : '';

            return fullName.includes(lowercaseSearch) ||
                email.includes(lowercaseSearch) ||
                handicap.includes(lowercaseSearch);
        });
    };

    // Clear search filter function
    const clearPlayerSearch = () => {
        setPlayerSearchFilter('');
    };

    // Fetch teams when component mounts or tournament changes
    useEffect(() => {
        if (tournament) {
            console.log('Tournament changed, fetching teams for tournament:', tournament.id);
            fetchCurrentTeams();
        }
    }, [tournament]);

    const fetchCurrentTeams = async () => {
        if (!tournament?.id) return;

        try {
            setTeamsLoading(true);
            console.log(`Fetching teams for tournament ${tournament.id}`);

            const teams = await get(`/tournaments/${tournament.id}/teams`);
            console.log('Fetched tournament teams:', teams);

            setCurrentTeams(teams);
        } catch (error) {
            console.error('Error fetching tournament teams:', error);
            setTeamError(error.message || 'Failed to fetch tournament teams');
        } finally {
            setTeamsLoading(false);
        }
    };

    const fetchAvailablePlayers = async () => {
        try {
            setPlayersLoading(true);
            console.log('Fetching all players...');
            const playersData = await get('/players');
            console.log('Fetched players:', playersData);
            setAvailablePlayers(playersData);
        } catch (error) {
            console.error('Error fetching players:', error);
            setTeamError(error.message || 'Failed to fetch players');
        } finally {
            setPlayersLoading(false);
        }
    };

    const handleCreateTeam = () => {
        setCreateTeamDialogOpen(true);
    };

    const handleEditTeam = (team) => {
        setEditingTeam(team);
        setEditTeam({
            name: team.name,
            description: team.description || ''
        });
        setEditTeamDialogOpen(true);
    };

    const handleManageTeamPlayers = (team) => {
        setSelectedTeamForPlayers(team);
        setAddPlayerDialogOpen(true);
        fetchAvailablePlayers();
    };

    const handleCreateNewPlayer = () => {
        setCreatePlayerDialogOpen(true);
    };

    const handleCloseCreateTeamDialog = () => {
        setCreateTeamDialogOpen(false);
        setNewTeam({
            name: '',
            description: ''
        });
        setTeamError(null);
    };

    const handleCloseEditTeamDialog = () => {
        setEditTeamDialogOpen(false);
        setEditingTeam(null);
        setEditTeam({
            name: '',
            description: ''
        });
        setTeamError(null);
    };

    const handleCloseAddPlayerDialog = () => {
        setAddPlayerDialogOpen(false);
        setSelectedTeamForPlayers(null);
        setPlayerSearchFilter(''); // Clear search filter
        setTeamError(null);
    };

    const handleCloseCreatePlayerDialog = () => {
        setCreatePlayerDialogOpen(false);
        setNewPlayer({
            first_name: '',
            last_name: '',
            email: '',
            handicap: ''
        });
        setTeamError(null);
    };

    const handleCreateNewTeam = async () => {
        try {
            setTeamLoading(true);
            setTeamError(null);

            if (!newTeam.name.trim()) {
                setTeamError('Team name is required');
                return;
            }

            // Create the team
            const teamData = {
                name: newTeam.name,
                description: newTeam.description || null
            };

            console.log('Creating new team:', teamData);
            const createdTeam = await post('/teams', teamData);
            console.log('Created team:', createdTeam);

            // Add the team to the tournament
            console.log(`Adding team ${createdTeam.id} to tournament ${tournament.id}`);
            await post(`/tournaments/${tournament.id}/teams/${createdTeam.id}`, {});

            // Refresh data
            await fetchCurrentTeams();

            // Notify parent component to refresh tournament data
            if (onUpdate) {
                onUpdate();
            }

            handleCloseCreateTeamDialog();
            console.log(`New team ${createdTeam.name} created and added to tournament`);

        } catch (error) {
            console.error('Error creating team:', error);
            setTeamError(error.message || 'Failed to create team');
        } finally {
            setTeamLoading(false);
        }
    };

    const handleUpdateTeam = async () => {
        try {
            setTeamLoading(true);
            setTeamError(null);

            if (!editTeam.name.trim()) {
                setTeamError('Team name is required');
                return;
            }

            // Update the team
            const teamData = {
                name: editTeam.name,
                description: editTeam.description || null
            };

            console.log('Updating team:', editingTeam.id, teamData);
            const updatedTeam = await put(`/teams/${editingTeam.id}`, teamData);
            console.log('Updated team:', updatedTeam);

            // Refresh data
            await fetchCurrentTeams();

            // Notify parent component to refresh tournament data
            if (onUpdate) {
                onUpdate();
            }

            handleCloseEditTeamDialog();
            console.log(`Team ${updatedTeam.name} updated successfully`);

        } catch (error) {
            console.error('Error updating team:', error);
            setTeamError(error.message || 'Failed to update team');
        } finally {
            setTeamLoading(false);
        }
    };

    const handleRemoveTeamFromTournament = async (team) => {
        try {
            console.log(`Removing team ${team.id} from tournament ${tournament.id}`);

            await del(`/tournaments/${tournament.id}/teams/${team.id}`);

            // Refresh data
            await fetchCurrentTeams();

            // Notify parent component to refresh tournament data
            if (onUpdate) {
                onUpdate();
            }

            console.log(`Team ${team.name} removed from tournament`);
        } catch (error) {
            console.error('Error removing team from tournament:', error);
            setTeamError(error.message || 'Failed to remove team from tournament');
        }
    };

    const handleAddPlayerToTeam = async (playerId) => {
        try {
            // Check if adding this player would exceed team size
            const currentPlayerCount = selectedTeamForPlayers?.players?.length || 0;
            const maxTeamSize = tournament?.team_size || 0;

            if (currentPlayerCount >= maxTeamSize) {
                setTeamError(`Cannot add player: Team already has the maximum ${maxTeamSize} players allowed for this tournament.`);
                return;
            }

            console.log(`Adding player ${playerId} to team ${selectedTeamForPlayers.id}`);
            await post(`/teams/${selectedTeamForPlayers.id}/players/${playerId}`, {});

            // Refresh the main teams data
            await fetchCurrentTeams();

            // Update the selectedTeamForPlayers with fresh data from the refreshed teams
            const updatedTeams = await get(`/tournaments/${tournament.id}/teams`);
            const updatedSelectedTeam = updatedTeams.find(team => team.id === selectedTeamForPlayers.id);
            if (updatedSelectedTeam) {
                setSelectedTeamForPlayers(updatedSelectedTeam);
            }

            // Remove the added player from available players list
            setAvailablePlayers(prevPlayers =>
                prevPlayers.filter(player => player.id !== playerId)
            );

            // Clear any previous errors
            setTeamError(null);

            // Notify parent component to refresh tournament data
            if (onUpdate) {
                onUpdate();
            }

            console.log(`Player added to team ${selectedTeamForPlayers.name}`);
        } catch (error) {
            console.error('Error adding player to team:', error);
            setTeamError(error.message || 'Failed to add player to team');
        }
    };

    const handleCreateAndAddPlayer = async () => {
        try {
            setTeamLoading(true);
            setTeamError(null);

            if (!newPlayer.first_name.trim() || !newPlayer.last_name.trim()) {
                setTeamError('First name and last name are required');
                return;
            }

            // Create the player
            const playerData = {
                first_name: newPlayer.first_name.trim(),
                last_name: newPlayer.last_name.trim(),
                email: newPlayer.email.trim() || null,
                handicap: newPlayer.handicap ? parseFloat(newPlayer.handicap) : null
            };

            console.log('Creating new player:', playerData);
            const createdPlayer = await post('/players', playerData);
            console.log('Created player:', createdPlayer);

            // Close the create player dialog first
            handleCloseCreatePlayerDialog();

            // Add the player to the team (this will keep the manage players dialog open)
            await handleAddPlayerToTeam(createdPlayer.id);

            console.log(`New player ${createdPlayer.first_name} ${createdPlayer.last_name} created and added to team`);

        } catch (error) {
            console.error('Error creating player:', error);
            setTeamError(error.message || 'Failed to create player');
        } finally {
            setTeamLoading(false);
        }
    };

    const handleRemovePlayerFromTeam = async (playerId, teamId) => {
        try {
            console.log(`Removing player ${playerId} from team ${teamId}`);
            await del(`/teams/${teamId}/players/${playerId}`);

            // Always refresh the main teams data to update the team list
            await fetchCurrentTeams();

            // If we're currently viewing this team in the manage players dialog, update it
            if (selectedTeamForPlayers && selectedTeamForPlayers.id === teamId) {
                // Update the selectedTeamForPlayers with fresh data
                const updatedTeams = await get(`/tournaments/${tournament.id}/teams`);
                const updatedSelectedTeam = updatedTeams.find(team => team.id === teamId);
                if (updatedSelectedTeam) {
                    setSelectedTeamForPlayers(updatedSelectedTeam);
                }

                // Refresh available players to include the removed player
                await fetchAvailablePlayers();
            }

            // Clear any previous errors
            setTeamError(null);

            // Notify parent component to refresh tournament data
            if (onUpdate) {
                onUpdate();
            }

            console.log(`Player removed from team successfully`);
        } catch (error) {
            console.error('Error removing player from team:', error);
            setTeamError(error.message || 'Failed to remove player from team');
        }
    };

    const toggleTeamExpansion = (teamId) => {
        const newExpanded = new Set(expandedTeams);
        if (newExpanded.has(teamId)) {
            newExpanded.delete(teamId);
        } else {
            newExpanded.add(teamId);
        }
        setExpandedTeams(newExpanded);
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
    if (teamsLoading && !createTeamDialogOpen) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>
                    Loading tournament teams...
                </Typography>
            </Box>
        );
    }

    // Calculate team size validation summary
    const teamsWithIssues = currentTeams.filter(team => {
        const status = getTeamSizeStatus(team);
        return status.type !== 'success';
    });

    return (
        <Box>
            {/* Tournament Teams Overview */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        Tournament Teams ({currentTeams.length})
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<GroupAddIcon />}
                        onClick={handleCreateTeam}
                    >
                        Create New Team
                    </Button>
                </Box>

                {/* Team Size Requirements Alert */}
                {tournament?.team_size && (
                    <Alert
                        severity="info"
                        sx={{ mb: 2 }}
                        icon={<GroupsIcon />}
                    >
                        <Typography variant="body2">
                            <strong>Team Size Requirement:</strong> Each team must have exactly {tournament.team_size} player{tournament.team_size !== 1 ? 's' : ''} for this tournament.
                        </Typography>
                    </Alert>
                )}

                {/* Team Size Validation Summary */}
                {currentTeams.length > 0 && teamsWithIssues.length > 0 && (
                    <Alert
                        severity="warning"
                        sx={{ mb: 2 }}
                        icon={<WarningIcon />}
                    >
                        <Typography variant="body2">
                            <strong>Team Size Issues:</strong> {teamsWithIssues.length} team{teamsWithIssues.length !== 1 ? 's' : ''} {teamsWithIssues.length === 1 ? 'does' : 'do'} not have the required number of players.
                        </Typography>
                    </Alert>
                )}

                {currentTeams.length > 0 ? (
                    <List>
                        {currentTeams.map((team) => {
                            const sizeStatus = getTeamSizeStatus(team);
                            const isExpanded = expandedTeams.has(team.id);
                            return (
                                <React.Fragment key={team.id}>
                                    <ListItem
                                        sx={{
                                            py: 1,
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
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                        {team.name}
                                                    </Typography>
                                                    <Chip
                                                        label={`${team.player_count || 0}/${tournament?.team_size || '?'} players`}
                                                        size="small"
                                                        variant="outlined"
                                                        color={sizeStatus.color}
                                                    />
                                                    {sizeStatus.type !== 'success' && (
                                                        <Chip
                                                            label={sizeStatus.message}
                                                            size="small"
                                                            color={sizeStatus.color}
                                                            icon={<WarningIcon />}
                                                        />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <Box sx={{ mt: 0.5 }}>
                                                    {team.description && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {team.description}
                                                        </Typography>
                                                    )}
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                        {isExpanded ? 'Click to collapse team members' : 'Click to view team members'}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                        <ListItemSecondaryAction>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <IconButton
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleManageTeamPlayers(team);
                                                    }}
                                                    size="small"
                                                    color="info"
                                                    title="Manage Players"
                                                >
                                                    <PersonAddIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditTeam(team);
                                                    }}
                                                    size="small"
                                                    color="primary"
                                                    title="Edit Team Details"
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleTeamExpansion(team.id);
                                                    }}
                                                    size="small"
                                                    title={isExpanded ? 'Collapse Team' : 'Expand Team'}
                                                >
                                                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </IconButton>
                                                <IconButton
                                                    edge="end"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveTeamFromTournament(team);
                                                    }}
                                                    size="small"
                                                    color="error"
                                                    title="Remove from Tournament"
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </ListItemSecondaryAction>
                                    </ListItem>

                                    {/* Team Players Collapse */}
                                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                        <Box sx={{ pl: 8, pr: 2, pb: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Team Members ({team.players?.length || 0}):
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button
                                                        size="small"
                                                        startIcon={<PersonAddIcon />}
                                                        onClick={() => handleManageTeamPlayers(team)}
                                                        variant="outlined"
                                                    >
                                                        Manage Players
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        startIcon={<EditIcon />}
                                                        onClick={() => handleEditTeam(team)}
                                                        variant="outlined"
                                                    >
                                                        Edit Team
                                                    </Button>
                                                </Box>
                                            </Box>
                                            {team.players && team.players.length > 0 ? (
                                                <List dense>
                                                    {team.players.map((player) => (
                                                        <ListItem key={player.id} sx={{ py: 0.5 }}>
                                                            <PersonIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                                                            <ListItemText
                                                                primary={
                                                                    <Typography variant="body2" fontWeight="medium">
                                                                        {player.player_name}
                                                                    </Typography>
                                                                }
                                                                secondary={
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                                        {player.handicap !== null ? (
                                                                            <Chip
                                                                                label={`HCP: ${player.handicap}`}
                                                                                size="small"
                                                                                variant="outlined"
                                                                                color="primary"
                                                                            />
                                                                        ) : (
                                                                            <Chip
                                                                                label="No handicap"
                                                                                size="small"
                                                                                variant="outlined"
                                                                                color="default"
                                                                            />
                                                                        )}
                                                                    </Box>
                                                                }
                                                            />
                                                            <ListItemSecondaryAction>
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleRemovePlayerFromTeam(player.id, team.id)}
                                                                    title="Remove from Team"
                                                                >
                                                                    <PersonRemoveIcon fontSize="small" />
                                                                </IconButton>
                                                            </ListItemSecondaryAction>
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            ) : (
                                                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 1 }}>
                                                    <PersonIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 2 }}>
                                                        No players assigned to this team yet
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            startIcon={<PersonAddIcon />}
                                                            onClick={() => handleManageTeamPlayers(team)}
                                                        >
                                                            Add Players
                                                        </Button>
                                                        {tournament?.team_size && (
                                                            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', ml: 1 }}>
                                                                Need {tournament.team_size} player{tournament.team_size !== 1 ? 's' : ''}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Paper>
                                            )}
                                        </Box>
                                    </Collapse>

                                    {team !== currentTeams[currentTeams.length - 1] && <Divider />}
                                </React.Fragment>
                            );
                        })}
                    </List>
                ) : (
                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                        <GroupsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary" paragraph>
                            No teams have been created for this tournament yet.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<GroupAddIcon />}
                            onClick={handleCreateTeam}
                        >
                            Create New Team
                        </Button>
                    </Paper>
                )}
            </Paper>

            {/* Manage Team Players Dialog - UPDATED */}
            <Dialog
                open={addPlayerDialogOpen}
                onClose={handleCloseAddPlayerDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonAddIcon sx={{ mr: 1 }} />
                        Manage Players - {selectedTeamForPlayers?.name}
                        {selectedTeamForPlayers && tournament?.team_size && (
                            <Chip
                                label={`${selectedTeamForPlayers.players?.length || 0}/${tournament.team_size} players`}
                                size="small"
                                sx={{ ml: 1 }}
                                color={
                                    (selectedTeamForPlayers.players?.length || 0) === tournament.team_size
                                        ? 'success'
                                        : 'warning'
                                }
                            />
                        )}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {teamError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {teamError}
                        </Alert>
                    )}

                    {/* Team Size Warning */}
                    {selectedTeamForPlayers && tournament?.team_size && (
                        (() => {
                            const status = getTeamSizeStatus(selectedTeamForPlayers);
                            return status.type !== 'success' && (
                                <Alert severity={status.type} sx={{ mb: 2 }}>
                                    <Typography variant="body2">
                                        <strong>Team Size Issue:</strong> {status.message}.
                                        Required: {tournament.team_size} player{tournament.team_size !== 1 ? 's' : ''}.
                                    </Typography>
                                </Alert>
                            );
                        })()
                    )}

                    {/* Current Team Players */}
                    <Typography variant="h6" gutterBottom>
                        Current Team Players ({selectedTeamForPlayers?.players?.length || 0})
                    </Typography>

                    {selectedTeamForPlayers?.players && selectedTeamForPlayers.players.length > 0 ? (
                        <List dense sx={{ mb: 3, bgcolor: 'background.default', borderRadius: 1 }}>
                            {selectedTeamForPlayers.players.map((player) => (
                                <ListItem key={player.id}>
                                    <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    <ListItemText
                                        primary={player.player_name}
                                        secondary={player.handicap !== null ? `Handicap: ${player.handicap}` : 'No handicap'}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleRemovePlayerFromTeam(player.id, selectedTeamForPlayers.id)}
                                        >
                                            <PersonRemoveIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Paper sx={{ p: 2, mb: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                            <Typography variant="body2" color="text.secondary">
                                No players in this team yet
                            </Typography>
                        </Paper>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Available Players to Add */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            Available Players
                            {selectedTeamForPlayers && tournament?.team_size && !canAddPlayerToTeam(selectedTeamForPlayers) && (
                                <Chip
                                    label="Team Full"
                                    size="small"
                                    color="error"
                                    sx={{ ml: 1 }}
                                />
                            )}
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<PersonAddIcon />}
                            onClick={handleCreateNewPlayer}
                            disabled={selectedTeamForPlayers && !canAddPlayerToTeam(selectedTeamForPlayers)}
                        >
                            Create New Player
                        </Button>
                    </Box>

                    {/* Player Search Filter */}
                    <TextField
                        fullWidth
                        placeholder="Search players by name, email, or handicap..."
                        value={playerSearchFilter}
                        onChange={(e) => setPlayerSearchFilter(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                            endAdornment: playerSearchFilter && (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={clearPlayerSearch}
                                        title="Clear search"
                                    >
                                        <ClearIcon />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />

                    {playersLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        (() => {
                            const currentPlayerIds = selectedTeamForPlayers?.players?.map(p => p.id) || [];
                            const availablePlayersFiltered = availablePlayers.filter(player => !currentPlayerIds.includes(player.id));
                            const searchFilteredPlayers = filterPlayers(availablePlayersFiltered, playerSearchFilter);
                            const teamIsFull = selectedTeamForPlayers && !canAddPlayerToTeam(selectedTeamForPlayers);

                            return searchFilteredPlayers.length === 0 ? (
                                <Paper sx={{ p: 3, textAlign: 'center' }}>
                                    <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                    <Typography variant="body1" color="text.secondary" paragraph>
                                        {availablePlayers.length === 0 ? (
                                            'No players found.'
                                        ) : playerSearchFilter.trim() ? (
                                            <>No players found matching "{playerSearchFilter}".</>
                                        ) : (
                                            'All available players are already in this team.'
                                        )}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <Button
                                            variant="outlined"
                                            startIcon={<PersonAddIcon />}
                                            onClick={handleCreateNewPlayer}
                                            disabled={teamIsFull}
                                        >
                                            Create New Player
                                        </Button>
                                        {playerSearchFilter.trim() && (
                                            <Button
                                                variant="outlined"
                                                onClick={clearPlayerSearch}
                                            >
                                                Clear Search
                                            </Button>
                                        )}
                                    </Box>
                                </Paper>
                            ) : (
                                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                                    {searchFilteredPlayers.map((player) => (
                                        <ListItem key={player.id}>
                                            <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
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
                                                    startIcon={<PersonAddIcon />}
                                                    onClick={() => handleAddPlayerToTeam(player.id)}
                                                    disabled={teamIsFull}
                                                    title={teamIsFull ? 'Team has reached maximum size' : 'Add to Team'}
                                                >
                                                    Add to Team
                                                </Button>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>
                            );
                        })()
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAddPlayerDialog}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create New Team Dialog */}
            <Dialog
                open={createTeamDialogOpen}
                onClose={handleCloseCreateTeamDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <GroupAddIcon sx={{ mr: 1 }} />
                        Create New Team - {tournament.name}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {teamError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {teamError}
                        </Alert>
                    )}

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Team Name"
                                value={newTeam.name}
                                onChange={(e) => setNewTeam({
                                    ...newTeam,
                                    name: e.target.value
                                })}
                                required
                                autoFocus
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                value={newTeam.description}
                                onChange={(e) => setNewTeam({
                                    ...newTeam,
                                    description: e.target.value
                                })}
                                helperText="Optional"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCreateTeamDialog}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateNewTeam}
                        variant="contained"
                        disabled={teamLoading || !newTeam.name.trim()}
                    >
                        {teamLoading ? (
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                        ) : null}
                        Create Team
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Team Dialog */}
            <Dialog
                open={editTeamDialogOpen}
                onClose={handleCloseEditTeamDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EditIcon sx={{ mr: 1 }} />
                        Edit Team - {editingTeam?.name}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {teamError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {teamError}
                        </Alert>
                    )}

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Team Name"
                                value={editTeam.name}
                                onChange={(e) => setEditTeam({
                                    ...editTeam,
                                    name: e.target.value
                                })}
                                required
                                autoFocus
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                value={editTeam.description}
                                onChange={(e) => setEditTeam({
                                    ...editTeam,
                                    description: e.target.value
                                })}
                                helperText="Optional"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditTeamDialog}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpdateTeam}
                        variant="contained"
                        disabled={teamLoading || !editTeam.name.trim()}
                    >
                        {teamLoading ? (
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                        ) : null}
                        Update Team
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Player Dialog */}
            <Dialog
                open={createPlayerDialogOpen}
                onClose={handleCloseCreatePlayerDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonAddIcon sx={{ mr: 1 }} />
                        Create New Player
                        {selectedTeamForPlayers && (
                            <Chip
                                label={`for ${selectedTeamForPlayers.name}`}
                                size="small"
                                sx={{ ml: 1 }}
                            />
                        )}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {teamError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {teamError}
                        </Alert>
                    )}

                    <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            The new player will be created and automatically added to the team.
                        </Typography>
                    </Alert>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="First Name"
                                value={newPlayer.first_name}
                                onChange={(e) => handlePlayerFieldChange('first_name', e.target.value)}
                                error={!!playerValidation.firstNameError}
                                helperText={playerValidation.firstNameError || "Required"}
                                required
                                autoFocus
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                value={newPlayer.last_name}
                                onChange={(e) => handlePlayerFieldChange('last_name', e.target.value)}
                                error={!!playerValidation.lastNameError}
                                helperText={playerValidation.lastNameError || "Required"}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={newPlayer.email}
                                onChange={(e) => handlePlayerFieldChange('email', e.target.value)}
                                error={!!playerValidation.emailError}
                                helperText={playerValidation.emailError || "Optional"}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Handicap"
                                type="number"
                                inputProps={{
                                    step: 0.1,
                                    min: -10,
                                    max: 54
                                }}
                                value={newPlayer.handicap}
                                onChange={(e) => handlePlayerFieldChange('handicap', e.target.value)}
                                helperText="Optional - Golf handicap index"
                            />
                        </Grid>
                    </Grid>

                    {/* Preview */}
                    {(newPlayer.first_name || newPlayer.last_name) && (
                        <Paper sx={{ mt: 2, p: 2, bgcolor: 'background.default' }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Preview:
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Box>
                                    <Typography variant="body1">
                                        {`${newPlayer.first_name} ${newPlayer.last_name}`.trim()}
                                    </Typography>
                                    {newPlayer.email && (
                                        <Typography variant="body2" color="text.secondary">
                                            {newPlayer.email}
                                        </Typography>
                                    )}
                                    {newPlayer.handicap && (
                                        <Chip
                                            label={`HCP: ${newPlayer.handicap}`}
                                            size="small"
                                            sx={{ mt: 0.5 }}
                                        />
                                    )}
                                </Box>
                            </Box>
                        </Paper>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCreatePlayerDialog}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateAndAddPlayer}
                        variant="contained"
                        disabled={
                            teamLoading ||
                            !newPlayer.first_name.trim() ||
                            !newPlayer.last_name.trim() ||
                            (selectedTeamForPlayers && !canAddPlayerToTeam(selectedTeamForPlayers))
                        }
                    >
                        {teamLoading ? (
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                        ) : null}
                        Create & Add to Team
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default TournamentTeams;