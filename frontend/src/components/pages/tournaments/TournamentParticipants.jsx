import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Grid, Autocomplete, Chip, List, ListItem,
    ListItemText, ListItemSecondaryAction, Divider, Alert, CircularProgress,
    IconButton
} from '@mui/material';
import {
    Group as GroupIcon,
    PersonAdd as PersonAddIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { get, post } from '../../../services/api';

function TournamentParticipants({ tournament, onUpdate }) {
    const [teamDialogOpen, setTeamDialogOpen] = useState(false);

    // Team management state
    const [existingTeams, setExistingTeams] = useState([]);
    const [availablePlayers, setAvailablePlayers] = useState([]);
    const [currentTeams, setCurrentTeams] = useState([]);
    const [teamsLoading, setTeamsLoading] = useState(true); // Start with loading true
    const [teamError, setTeamError] = useState(null);

    // New team creation state
    const [newTeam, setNewTeam] = useState({
        name: '',
        description: '',
        players: []
    });
    const [isCreatingNewTeam, setIsCreatingNewTeam] = useState(false);

    // Fetch teams when component mounts or tournament changes
    useEffect(() => {
        if (tournament) {
            console.log('Tournament changed, fetching teams for tournament:', tournament.id);
            setCurrentTeams(tournament.teams || []);
            fetchCurrentTeams();
        }
    }, [tournament]);

    // New function to just fetch current tournament teams
    const fetchCurrentTeams = async () => {
        if (!tournament?.id) return;

        try {
            setTeamsLoading(true);
            console.log(`Fetching teams for tournament ${tournament.id}`);

            const tournamentTeams = await get(`/tournaments/${tournament.id}/teams`);
            console.log('Fetched tournament teams:', tournamentTeams);

            setCurrentTeams(tournamentTeams);
        } catch (error) {
            console.error('Error fetching tournament teams:', error);
            setTeamError(error.message || 'Failed to fetch tournament teams');
        } finally {
            setTeamsLoading(false);
        }
    };

    const fetchTeamsAndPlayers = async () => {
        try {
            setTeamsLoading(true);
            setTeamError(null);

            console.log('Fetching all teams and players...');

            const [teamsData, playersData, tournamentTeams] = await Promise.all([
                get('/teams'),
                get('/players'),
                tournament ? get(`/tournaments/${tournament.id}/teams`) : Promise.resolve([])
            ]);

            console.log('Fetched existing teams:', teamsData);
            console.log('Fetched players:', playersData);
            console.log('Fetched tournament teams:', tournamentTeams);

            setExistingTeams(teamsData);
            setAvailablePlayers(playersData);
            setCurrentTeams(tournamentTeams);
        } catch (error) {
            console.error('Error fetching teams and players:', error);
            setTeamError(error.message || 'Failed to fetch teams and players');
        } finally {
            setTeamsLoading(false);
        }
    };

    const handleManageTeams = () => {
        setTeamDialogOpen(true);
        fetchTeamsAndPlayers();
    };

    const handleCloseTeamDialog = () => {
        setTeamDialogOpen(false);
        setIsCreatingNewTeam(false);
        setNewTeam({
            name: '',
            description: '',
            players: []
        });
        setTeamError(null);
    };

    const handleAddExistingTeam = async (team) => {
        try {
            console.log(`Adding team ${team.id} to tournament ${tournament.id}`);
            await post(`/tournaments/${tournament.id}/teams/${team.id}`);

            // Refresh team data
            await fetchTeamsAndPlayers();

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

    const handleCreateNewTeam = async () => {
        try {
            if (!newTeam.name.trim()) {
                setTeamError('Team name is required');
                return;
            }

            if (newTeam.players.length < 2) {
                setTeamError('Team must have at least 2 players');
                return;
            }

            // Create the new team
            const teamData = {
                name: newTeam.name,
                description: newTeam.description,
                player_ids: newTeam.players.map(player => player.id)
            };

            console.log('Creating new team:', teamData);
            const createdTeam = await post('/teams', teamData);
            console.log('Created team:', createdTeam);

            // Add the new team to the tournament
            console.log(`Adding new team ${createdTeam.id} to tournament ${tournament.id}`);
            await post(`/tournaments/${tournament.id}/teams/${createdTeam.id}`);

            // Refresh team data
            await fetchTeamsAndPlayers();

            // Notify parent component to refresh tournament data
            if (onUpdate) {
                onUpdate();
            }

            // Reset form
            setNewTeam({
                name: '',
                description: '',
                players: []
            });
            setIsCreatingNewTeam(false);

            console.log(`New team ${createdTeam.name} created and added to tournament`);
        } catch (error) {
            console.error('Error creating new team:', error);
            setTeamError(error.message || 'Failed to create new team');
        }
    };

    const handleRemovePlayerFromNewTeam = (playerToRemove) => {
        setNewTeam({
            ...newTeam,
            players: newTeam.players.filter(player => player.id !== playerToRemove.id)
        });
    };

    const handleRemoveTeamFromTournament = async (team) => {
        try {
            console.log(`Removing team ${team.id} from tournament ${tournament.id}`);

            const response = await fetch(`/tournaments/${tournament.id}/teams/${team.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to remove team from tournament: ${errorText}`);
            }

            // Refresh data
            await fetchTeamsAndPlayers();

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
    if (teamsLoading && !teamDialogOpen) {
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
    if (teamError && !teamDialogOpen) {
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
                        startIcon={<GroupIcon />}
                        onClick={handleManageTeams}
                    >
                        Manage Teams
                    </Button>
                </Box>

                {/* Debug info - remove this later */}
                <Alert severity="info" sx={{ mb: 2 }}>
                    Debug: Tournament ID: {tournament.id}, Current Teams Count: {currentTeams.length}
                    {currentTeams.length > 0 && `, Team IDs: ${currentTeams.map(t => t.id).join(', ')}`}
                </Alert>

                {currentTeams.length > 0 ? (
                    <Grid container spacing={2}>
                        {currentTeams.map((team) => (
                            <Grid item xs={12} sm={6} md={4} key={team.id}>
                                <Paper
                                    sx={{
                                        p: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        height: '100%'
                                    }}
                                >
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        {team.name}
                                    </Typography>
                                    {team.description && (
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {team.description}
                                        </Typography>
                                    )}
                                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                        {team.players?.length || 0} players
                                    </Typography>
                                    {team.players && team.players.length > 0 && (
                                        <Box sx={{ mt: 1 }}>
                                            {team.players.map(player => (
                                                <Chip
                                                    key={player.id}
                                                    label={`${player.first_name} ${player.last_name}`}
                                                    size="small"
                                                    sx={{ mr: 0.5, mb: 0.5 }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                        <GroupIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary" paragraph>
                            No teams have been added to this tournament yet.
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={<GroupIcon />}
                            onClick={handleManageTeams}
                        >
                            Add Teams
                        </Button>
                    </Paper>
                )}
            </Paper>

            {/* Team Management Dialog */}
            <Dialog
                open={teamDialogOpen}
                onClose={handleCloseTeamDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <GroupIcon sx={{ mr: 1 }} />
                        Manage Teams - {tournament.name}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {teamsLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : teamError ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {teamError}
                        </Alert>
                    ) : (
                        <Box>
                            {/* Show current teams in tournament */}
                            {currentTeams.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Current Teams in Tournament ({currentTeams.length})
                                    </Typography>
                                    <Paper sx={{ p: 2, backgroundColor: 'action.hover' }}>
                                        <List dense>
                                            {currentTeams.map((team) => (
                                                <ListItem key={team.id}>
                                                    <ListItemText
                                                        primary={team.name}
                                                        secondary={
                                                            <Box>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {team.description || 'No description'}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {team.players?.length || 0} players
                                                                </Typography>
                                                                {team.players && team.players.length > 0 && (
                                                                    <Box sx={{ mt: 1 }}>
                                                                        {team.players.map(player => (
                                                                            <Chip
                                                                                key={player.id}
                                                                                label={`${player.first_name} ${player.last_name}`}
                                                                                size="small"
                                                                                sx={{ mr: 0.5, mb: 0.5 }}
                                                                            />
                                                                        ))}
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        }
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleRemoveTeamFromTournament(team)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Paper>
                                    <Divider sx={{ my: 2 }} />
                                </Box>
                            )}

                            {/* Toggle between existing teams and new team creation */}
                            <Box sx={{ mb: 3 }}>
                                <Button
                                    variant={!isCreatingNewTeam ? "contained" : "outlined"}
                                    onClick={() => setIsCreatingNewTeam(false)}
                                    sx={{ mr: 1 }}
                                >
                                    Add Existing Team
                                </Button>
                                <Button
                                    variant={isCreatingNewTeam ? "contained" : "outlined"}
                                    onClick={() => setIsCreatingNewTeam(true)}
                                    startIcon={<PersonAddIcon />}
                                >
                                    Create New Team
                                </Button>
                            </Box>

                            {!isCreatingNewTeam ? (
                                // Existing Teams Section
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Available Teams
                                    </Typography>

                                    {(() => {
                                        const currentTeamIds = currentTeams.map(t => t.id) || [];
                                        const availableTeams = existingTeams.filter(team => !currentTeamIds.includes(team.id));

                                        return availableTeams.length === 0 ? (
                                            <Paper sx={{ p: 3, textAlign: 'center' }}>
                                                <GroupIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                                <Typography variant="body1" color="text.secondary" paragraph>
                                                    {existingTeams.length === 0 ?
                                                        'No existing teams found.' :
                                                        'All existing teams are already in this tournament.'
                                                    }
                                                </Typography>
                                                <Button
                                                    variant="outlined"
                                                    onClick={() => setIsCreatingNewTeam(true)}
                                                    startIcon={<PersonAddIcon />}
                                                >
                                                    Create New Team
                                                </Button>
                                            </Paper>
                                        ) : (
                                            <List>
                                                {availableTeams.map((team) => (
                                                    <React.Fragment key={team.id}>
                                                        <ListItem>
                                                            <ListItemText
                                                                primary={team.name}
                                                                secondary={
                                                                    <Box>
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            {team.description || 'No description'}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {team.players?.length || 0} players
                                                                        </Typography>
                                                                        {team.players && team.players.length > 0 && (
                                                                            <Box sx={{ mt: 1 }}>
                                                                                {team.players.map(player => (
                                                                                    <Chip
                                                                                        key={player.id}
                                                                                        label={`${player.first_name} ${player.last_name}`}
                                                                                        size="small"
                                                                                        sx={{ mr: 0.5, mb: 0.5 }}
                                                                                    />
                                                                                ))}
                                                                            </Box>
                                                                        )}
                                                                    </Box>
                                                                }
                                                            />
                                                            <ListItemSecondaryAction>
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    onClick={() => handleAddExistingTeam(team)}
                                                                >
                                                                    Add to Tournament
                                                                </Button>
                                                            </ListItemSecondaryAction>
                                                        </ListItem>
                                                        <Divider />
                                                    </React.Fragment>
                                                ))}
                                            </List>
                                        );
                                    })()}
                                </Box>
                            ) : (
                                // New Team Creation Section
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Create New Team
                                    </Typography>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Team Name"
                                                value={newTeam.name}
                                                onChange={(e) => setNewTeam({
                                                    ...newTeam,
                                                    name: e.target.value
                                                })}
                                                required
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Description"
                                                value={newTeam.description}
                                                onChange={(e) => setNewTeam({
                                                    ...newTeam,
                                                    description: e.target.value
                                                })}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Autocomplete
                                                multiple
                                                options={availablePlayers.filter(player =>
                                                    !newTeam.players.find(p => p.id === player.id)
                                                )}
                                                getOptionLabel={(player) => `${player.first_name} ${player.last_name}${player.handicap ? ` (HCP: ${player.handicap})` : ''}`}
                                                value={newTeam.players}
                                                onChange={(event, newValue) => {
                                                    setNewTeam({
                                                        ...newTeam,
                                                        players: newValue
                                                    });
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Select Players"
                                                        placeholder="Choose team members"
                                                        helperText="Select 2-4 players for the team"
                                                    />
                                                )}
                                                renderTags={(value, getTagProps) =>
                                                    value.map((player, index) => (
                                                        <Chip
                                                            variant="outlined"
                                                            label={`${player.first_name} ${player.last_name}`}
                                                            {...getTagProps({ index })}
                                                            key={player.id}
                                                        />
                                                    ))
                                                }
                                            />
                                        </Grid>

                                        {newTeam.players.length > 0 && (
                                            <Grid item xs={12}>
                                                <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        Team Members ({newTeam.players.length})
                                                    </Typography>
                                                    <List dense>
                                                        {newTeam.players.map((player) => (
                                                            <ListItem key={player.id}>
                                                                <ListItemText
                                                                    primary={`${player.first_name} ${player.last_name}`}
                                                                    secondary={player.handicap ? `Handicap: ${player.handicap}` : 'No handicap'}
                                                                />
                                                                <ListItemSecondaryAction>
                                                                    <IconButton
                                                                        edge="end"
                                                                        onClick={() => handleRemovePlayerFromNewTeam(player)}
                                                                        size="small"
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </ListItemSecondaryAction>
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </Paper>
                                            </Grid>
                                        )}
                                    </Grid>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseTeamDialog}>
                        Cancel
                    </Button>
                    {isCreatingNewTeam && (
                        <Button
                            onClick={handleCreateNewTeam}
                            variant="contained"
                            disabled={!newTeam.name.trim() || newTeam.players.length < 2}
                        >
                            Create & Add Team
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default TournamentParticipants;