import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Grid, Chip, List, ListItem,
    ListItemText, ListItemSecondaryAction, Alert, CircularProgress,
    IconButton, Collapse, Avatar, Divider, MenuItem, Select, FormControl, InputLabel
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
    Warning as WarningIcon
} from '@mui/icons-material';
import { get, post, del, put } from '../../../services/api';

function TournamentTeams({ tournament, onUpdate }) {
    const [addTeamDialogOpen, setAddTeamDialogOpen] = useState(false);
    const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
    const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false);
    const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState(false);

    // Team management state
    const [currentTeams, setCurrentTeams] = useState([]);
    const [availableTeams, setAvailableTeams] = useState([]);
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

    const [teamLoading, setTeamLoading] = useState(false);

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

    const fetchAvailableTeams = async () => {
        try {
            console.log('Fetching all teams...');
            const teamsData = await get('/teams');
            console.log('Fetched teams:', teamsData);
            setAvailableTeams(teamsData);
        } catch (error) {
            console.error('Error fetching teams:', error);
            setTeamError(error.message || 'Failed to fetch teams');
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

    const handleAddExistingTeam = () => {
        setAddTeamDialogOpen(true);
        fetchAvailableTeams();
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

    const handleCloseCreateTeamDialog = () => {
        setCreateTeamDialogOpen(false);
        setNewTeam({
            name: '',
            description: ''
        });
        setTeamError(null);
    };

    const handleCloseAddTeamDialog = () => {
        setAddTeamDialogOpen(false);
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

    const handleAddExistingTeamToTournament = async (team) => {
        try {
            console.log(`Adding existing team ${team.id} to tournament ${tournament.id}`);
            await post(`/tournaments/${tournament.id}/teams/${team.id}`, {});

            // Refresh data
            await fetchCurrentTeams();

            // Notify parent component to refresh tournament data
            if (onUpdate) {
                onUpdate();
            }

            console.log(`Team ${team.name} added to tournament`);
        } catch (error) {
            console.error('Error adding team to tournament:', error);
            setTeamError(error.message || 'Failed to add team to tournament');
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

            // Refresh data
            await fetchCurrentTeams();
            await fetchAvailablePlayers();

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

    const handleRemovePlayerFromTeam = async (playerId, teamId) => {
        try {
            console.log(`Removing player ${playerId} from team ${teamId}`);
            await del(`/teams/${teamId}/players/${playerId}`);

            // Refresh data
            await fetchCurrentTeams();

            // Notify parent component to refresh tournament data
            if (onUpdate) {
                onUpdate();
            }

            console.log(`Player removed from team`);
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
    if (teamsLoading && !addTeamDialogOpen) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>
                    Loading tournament teams...
                </Typography>
            </Box>
        );
    }

    // Show error state if there's an error
    if (teamError && !addTeamDialogOpen && !createTeamDialogOpen && !editTeamDialogOpen && !addPlayerDialogOpen) {
        return (
            <Paper sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {teamError}
                </Alert>
                <Button onClick={fetchCurrentTeams} variant="outlined">
                    Retry
                </Button>
            </Paper>
        );
    }

    console.log('Rendering with currentTeams:', currentTeams);

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
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={handleAddExistingTeam}
                        >
                            Add Existing Team
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<GroupAddIcon />}
                            onClick={handleCreateTeam}
                        >
                            Create New Team
                        </Button>
                    </Box>
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
                                        onClick={() => handleEditTeam(team)}
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
                                                        label={`${team.player_count}/${tournament?.team_size || '?'} players`}
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
                                                        Click to edit team details
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
                                                    title="Edit Team"
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleTeamExpansion(team.id);
                                                    }}
                                                    size="small"
                                                    title="View Players"
                                                >
                                                    {expandedTeams.has(team.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
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
                                    <Collapse in={expandedTeams.has(team.id)} timeout="auto" unmountOnExit>
                                        <Box sx={{ pl: 8, pr: 2, pb: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Team Players:
                                                </Typography>
                                                <Button
                                                    size="small"
                                                    startIcon={<PersonAddIcon />}
                                                    onClick={() => handleManageTeamPlayers(team)}
                                                >
                                                    Manage Players
                                                </Button>
                                            </Box>
                                            {team.players && team.players.length > 0 ? (
                                                <List dense>
                                                    {team.players.map((player) => (
                                                        <ListItem key={player.id} sx={{ py: 0.5 }}>
                                                            <PersonIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                                                            <ListItemText
                                                                primary={player.player_name}
                                                                secondary={
                                                                    player.handicap !== null ?
                                                                        `Handicap: ${player.handicap}` :
                                                                        'No handicap'
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
                                                <Box sx={{ textAlign: 'center', py: 2 }}>
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
                                                        No players assigned to this team
                                                    </Typography>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<PersonAddIcon />}
                                                        onClick={() => handleManageTeamPlayers(team)}
                                                    >
                                                        Add Players
                                                    </Button>
                                                </Box>
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
                            No teams have been added to this tournament yet.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={handleAddExistingTeam}
                            >
                                Add Existing Team
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<GroupAddIcon />}
                                onClick={handleCreateTeam}
                            >
                                Create New Team
                            </Button>
                        </Box>
                    </Paper>
                )}
            </Paper>

            {/* Manage Team Players Dialog */}
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
                    <Typography variant="h6" gutterBottom>
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

                    {playersLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        (() => {
                            const currentPlayerIds = selectedTeamForPlayers?.players?.map(p => p.id) || [];
                            const availablePlayersFiltered = availablePlayers.filter(player => !currentPlayerIds.includes(player.id));
                            const teamIsFull = selectedTeamForPlayers && !canAddPlayerToTeam(selectedTeamForPlayers);

                            return availablePlayersFiltered.length === 0 ? (
                                <Paper sx={{ p: 3, textAlign: 'center' }}>
                                    <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                    <Typography variant="body1" color="text.secondary">
                                        {availablePlayers.length === 0 ?
                                            'No players found.' :
                                            'All available players are already in this team.'
                                        }
                                    </Typography>
                                </Paper>
                            ) : (
                                <List>
                                    {availablePlayersFiltered.map((player) => (
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

            {/* Add Existing Team Dialog */}
            <Dialog
                open={addTeamDialogOpen}
                onClose={handleCloseAddTeamDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <GroupsIcon sx={{ mr: 1 }} />
                        Add Existing Team - {tournament.name}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {teamError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {teamError}
                        </Alert>
                    )}

                    <Typography variant="h6" gutterBottom>
                        Available Teams
                    </Typography>

                    {(() => {
                        const currentTeamIds = currentTeams.map(t => t.id) || [];
                        const availableTeamsFiltered = availableTeams.filter(team => !currentTeamIds.includes(team.id));

                        return availableTeamsFiltered.length === 0 ? (
                            <Paper sx={{ p: 3, textAlign: 'center' }}>
                                <GroupsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="body1" color="text.secondary" paragraph>
                                    {availableTeams.length === 0 ?
                                        'No teams found.' :
                                        'All existing teams are already in this tournament.'
                                    }
                                </Typography>
                                <Button
                                    variant="outlined"
                                    onClick={handleCreateTeam}
                                    startIcon={<GroupAddIcon />}
                                >
                                    Create New Team
                                </Button>
                            </Paper>
                        ) : (
                            <List>
                                {availableTeamsFiltered.map((team) => (
                                    <ListItem key={team.id}>
                                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                            <GroupsIcon />
                                        </Avatar>
                                        <ListItemText
                                            primary={team.name}
                                            secondary={
                                                <Box>
                                                    {team.description && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {team.description}
                                                        </Typography>
                                                    )}
                                                    <Chip
                                                        label={`${team.players?.length || 0} players`}
                                                        size="small"
                                                        sx={{ mt: 0.5 }}
                                                    />
                                                </Box>
                                            }
                                        />
                                        <ListItemSecondaryAction>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => handleAddExistingTeamToTournament(team)}
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
                    <Button onClick={handleCloseAddTeamDialog}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default TournamentTeams;