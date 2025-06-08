import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Grid, Autocomplete, Chip, List, ListItem,
    ListItemText, ListItemSecondaryAction, Divider, Alert, CircularProgress,
    IconButton, FormControl, InputLabel, Select, MenuItem, FormLabel,
    RadioGroup, FormControlLabel, Radio
} from '@mui/material';
import {
    Group as GroupIcon,
    PersonAdd as PersonAddIcon,
    Delete as DeleteIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { get, post } from '../../../services/api';

function TournamentParticipants({ tournament, onUpdate }) {
    const [teamDialogOpen, setTeamDialogOpen] = useState(false);
    const [createParticipantDialogOpen, setCreateParticipantDialogOpen] = useState(false);

    // Team management state
    const [existingTeams, setExistingTeams] = useState([]);
    const [availablePlayers, setAvailablePlayers] = useState([]);
    const [currentTeams, setCurrentTeams] = useState([]);
    const [teamsLoading, setTeamsLoading] = useState(true);
    const [teamError, setTeamError] = useState(null);

    // New team creation state
    const [newTeam, setNewTeam] = useState({
        name: '',
        description: '',
        players: []
    });
    const [isCreatingNewTeam, setIsCreatingNewTeam] = useState(false);

    // New participant creation state
    const [participantType, setParticipantType] = useState('individual'); // 'individual' or 'team'
    const [newParticipant, setNewParticipant] = useState({
        // Individual fields
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        handicap: '',
        // Team fields
        team_name: '',
        team_description: '',
        team_players: []
    });
    const [participantLoading, setParticipantLoading] = useState(false);
    const [participantError, setParticipantError] = useState(null);

    // New state variables for creating player for team
    const [showCreatePlayerDialog, setShowCreatePlayerDialog] = useState(false);
    const [newPlayerForTeam, setNewPlayerForTeam] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        handicap: ''
    });

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

    // New participant creation functions
    const handleCreateParticipant = () => {
        // Determine default participant type based on tournament settings
        if (tournament.participant_type === 'individual') {
            setParticipantType('individual');
        } else if (tournament.participant_type === 'team') {
            setParticipantType('team');
        } else {
            // Mixed - let user choose
            setParticipantType('individual');
        }

        setCreateParticipantDialogOpen(true);

        // Fetch players if we might need them for team creation
        if (tournament.participant_type !== 'individual') {
            fetchTeamsAndPlayers();
        }
    };

    const handleCloseParticipantDialog = () => {
        setCreateParticipantDialogOpen(false);
        setParticipantType('individual');
        setNewParticipant({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            handicap: '',
            team_name: '',
            team_description: '',
            team_players: []
        });
        setParticipantError(null);
    };

    const handleCreateIndividualParticipant = async () => {
        try {
            setParticipantLoading(true);
            setParticipantError(null);

            if (!newParticipant.first_name.trim() || !newParticipant.last_name.trim()) {
                setParticipantError('First name and last name are required');
                return;
            }

            // Create the player
            const playerData = {
                first_name: newParticipant.first_name,
                last_name: newParticipant.last_name,
                email: newParticipant.email || null,
                phone: newParticipant.phone || null,
                handicap: newParticipant.handicap ? parseFloat(newParticipant.handicap) : null
            };

            console.log('Creating new player:', playerData);
            const createdPlayer = await post('/players', playerData);
            console.log('Created player:', createdPlayer);

            // Add the player to the tournament
            console.log(`Adding player ${createdPlayer.id} to tournament ${tournament.id}`);
            await post(`/tournaments/${tournament.id}/participants`, {
                player_id: createdPlayer.id
            });

            // Refresh data
            await fetchCurrentTeams();

            // Notify parent component to refresh tournament data
            if (onUpdate) {
                onUpdate();
            }

            handleCloseParticipantDialog();
            console.log(`New player ${createdPlayer.first_name} ${createdPlayer.last_name} created and added to tournament`);

        } catch (error) {
            console.error('Error creating individual participant:', error);
            setParticipantError(error.message || 'Failed to create participant');
        } finally {
            setParticipantLoading(false);
        }
    };

    const handleCreateTeamParticipant = async () => {
        try {
            setParticipantLoading(true);
            setParticipantError(null);

            if (!newParticipant.team_name.trim()) {
                setParticipantError('Team name is required');
                return;
            }

            const minTeamSize = tournament.team_size || 2;
            if (newParticipant.team_players.length < minTeamSize) {
                setParticipantError(`Team must have at least ${minTeamSize} players`);
                return;
            }

            // Create the team
            const teamData = {
                name: newParticipant.team_name,
                description: newParticipant.team_description,
                player_ids: newParticipant.team_players.map(player => player.id)
            };

            console.log('Creating new team:', teamData);
            const createdTeam = await post('/teams', teamData);
            console.log('Created team:', createdTeam);

            // Add the team to the tournament
            console.log(`Adding team ${createdTeam.id} to tournament ${tournament.id}`);
            await post(`/tournaments/${tournament.id}/teams/${createdTeam.id}`);

            // Refresh data
            await fetchCurrentTeams();

            // Notify parent component to refresh tournament data
            if (onUpdate) {
                onUpdate();
            }

            handleCloseParticipantDialog();
            console.log(`New team ${createdTeam.name} created and added to tournament`);

        } catch (error) {
            console.error('Error creating team participant:', error);
            setParticipantError(error.message || 'Failed to create team');
        } finally {
            setParticipantLoading(false);
        }
    };

    const handleCreateNewPlayerForTeam = async () => {
        try {
            if (!newPlayerForTeam.first_name.trim() || !newPlayerForTeam.last_name.trim()) {
                setParticipantError('First name and last name are required');
                return;
            }

            const playerData = {
                first_name: newPlayerForTeam.first_name,
                last_name: newPlayerForTeam.last_name,
                email: newPlayerForTeam.email || null,
                phone: newPlayerForTeam.phone || null,
                handicap: newPlayerForTeam.handicap ? parseFloat(newPlayerForTeam.handicap) : null
            };

            console.log('Creating new player for team:', playerData);
            const createdPlayer = await post('/players', playerData);
            console.log('Created player:', createdPlayer);

            // Add the new player to the team players list
            setNewParticipant({
                ...newParticipant,
                team_players: [...newParticipant.team_players, createdPlayer]
            });

            // Update available players list
            setAvailablePlayers(prev => [...prev, createdPlayer]);

            // Reset and close the create player dialog
            setNewPlayerForTeam({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                handicap: ''
            });
            setShowCreatePlayerDialog(false);

            console.log(`New player ${createdPlayer.first_name} ${createdPlayer.last_name} created and added to team`);

        } catch (error) {
            console.error('Error creating new player for team:', error);
            setParticipantError(error.message || 'Failed to create new player');
        }
    };

    const handleSubmitParticipant = () => {
        if (participantType === 'individual') {
            handleCreateIndividualParticipant();
        } else {
            handleCreateTeamParticipant();
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
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={handleCreateParticipant}
                        >
                            Create Participant
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<GroupIcon />}
                            onClick={handleManageTeams}
                        >
                            Manage Teams
                        </Button>
                    </Box>
                </Box>

                {currentTeams.length > 0 ? (
                    <List>
                        {currentTeams.map((team) => (
                            <ListItem key={team.id} sx={{ py: 1 }}>
                                <ListItemText
                                    primary={
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {team.name}
                                        </Typography>
                                    }
                                    secondary={
                                        <Box sx={{ mt: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                                {team.players?.length || 0} players
                                            </Typography>
                                            {team.players && team.players.length > 0 && (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {team.players.map(player => (
                                                        <Chip
                                                            key={player.id}
                                                            label={`${player.first_name} ${player.last_name}`}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ fontSize: '0.75rem' }}
                                                        />
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                        <GroupIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary" paragraph>
                            No participants have been added to this tournament yet.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={handleCreateParticipant}
                            >
                                Create New Participant
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<GroupIcon />}
                                onClick={handleManageTeams}
                            >
                                Add Existing Teams
                            </Button>
                        </Box>
                    </Paper>
                )}
            </Paper>

            {/* Create Participant Dialog */}
            <Dialog
                open={createParticipantDialogOpen}
                onClose={handleCloseParticipantDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AddIcon sx={{ mr: 1 }} />
                        Create New Participant - {tournament.name}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {participantError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {participantError}
                        </Alert>
                    )}

                    {/* Participant Type Selection for Mixed Tournaments */}
                    {tournament.participant_type === 'mixed' && (
                        <Box sx={{ mb: 3 }}>
                            <FormLabel component="legend">Participant Type</FormLabel>
                            <RadioGroup
                                row
                                value={participantType}
                                onChange={(e) => setParticipantType(e.target.value)}
                            >
                                <FormControlLabel
                                    value="individual"
                                    control={<Radio />}
                                    label="Individual Player"
                                />
                                <FormControlLabel
                                    value="team"
                                    control={<Radio />}
                                    label="Team"
                                />
                            </RadioGroup>
                        </Box>
                    )}

                    {participantType === 'individual' ? (
                        /* Individual Participant Form */
                        <Box
                            component="form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (newParticipant.first_name.trim() && newParticipant.last_name.trim()) {
                                    handleCreateIndividualParticipant();
                                }
                            }}
                        >
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom>
                                        Create Individual Participant
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="First Name"
                                        value={newParticipant.first_name}
                                        onChange={(e) => setNewParticipant({
                                            ...newParticipant,
                                            first_name: e.target.value
                                        })}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newParticipant.first_name.trim() && newParticipant.last_name.trim()) {
                                                e.preventDefault();
                                                handleCreateIndividualParticipant();
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
                                        value={newParticipant.last_name}
                                        onChange={(e) => setNewParticipant({
                                            ...newParticipant,
                                            last_name: e.target.value
                                        })}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newParticipant.first_name.trim() && newParticipant.last_name.trim()) {
                                                e.preventDefault();
                                                handleCreateIndividualParticipant();
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
                                        value={newParticipant.email}
                                        onChange={(e) => setNewParticipant({
                                            ...newParticipant,
                                            email: e.target.value
                                        })}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newParticipant.first_name.trim() && newParticipant.last_name.trim()) {
                                                e.preventDefault();
                                                handleCreateIndividualParticipant();
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Phone"
                                        value={newParticipant.phone}
                                        onChange={(e) => setNewParticipant({
                                            ...newParticipant,
                                            phone: e.target.value
                                        })}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newParticipant.first_name.trim() && newParticipant.last_name.trim()) {
                                                e.preventDefault();
                                                handleCreateIndividualParticipant();
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
                                        value={newParticipant.handicap}
                                        onChange={(e) => setNewParticipant({
                                            ...newParticipant,
                                            handicap: e.target.value
                                        })}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newParticipant.first_name.trim() && newParticipant.last_name.trim()) {
                                                e.preventDefault();
                                                handleCreateIndividualParticipant();
                                            }
                                        }}
                                        helperText="Optional"
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    ) : (
                        /* Team Participant Form - Updated */
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Create Team Participant
                                </Typography>
                                {tournament.team_size && (
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        This tournament requires teams of {tournament.team_size} players.
                                    </Alert>
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Team Name"
                                    value={newParticipant.team_name}
                                    onChange={(e) => setNewParticipant({
                                        ...newParticipant,
                                        team_name: e.target.value
                                    })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Team Description"
                                    value={newParticipant.team_description}
                                    onChange={(e) => setNewParticipant({
                                        ...newParticipant,
                                        team_description: e.target.value
                                    })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                                    <Autocomplete
                                        multiple
                                        sx={{ flexGrow: 1 }}
                                        options={availablePlayers.filter(player =>
                                            !newParticipant.team_players.find(p => p.id === player.id)
                                        )}
                                        getOptionLabel={(player) => `${player.first_name} ${player.last_name}${player.handicap ? ` (HCP: ${player.handicap})` : ''}`}
                                        value={newParticipant.team_players}
                                        onChange={(event, newValue) => {
                                            setNewParticipant({
                                                ...newParticipant,
                                                team_players: newValue
                                            });
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Select Team Members"
                                                placeholder="Choose players for the team"
                                                helperText={`Select ${tournament.team_size || '2+'} players for the team`}
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
                                    <Button
                                        variant="outlined"
                                        startIcon={<PersonAddIcon />}
                                        onClick={() => setShowCreatePlayerDialog(true)}
                                        sx={{ minWidth: 'auto', height: '56px' }}
                                    >
                                        New Player
                                    </Button>
                                </Box>
                            </Grid>

                            {newParticipant.team_players.length > 0 && (
                                <Grid item xs={12}>
                                    <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Selected Team Members ({newParticipant.team_players.length})
                                        </Typography>
                                        <List dense>
                                            {newParticipant.team_players.map((player) => (
                                                <ListItem key={player.id}>
                                                    <ListItemText
                                                        primary={`${player.first_name} ${player.last_name}`}
                                                        secondary={player.handicap ? `Handicap: ${player.handicap}` : 'No handicap'}
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <IconButton
                                                            edge="end"
                                                            onClick={() => setNewParticipant({
                                                                ...newParticipant,
                                                                team_players: newParticipant.team_players.filter(p => p.id !== player.id)
                                                            })}
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
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseParticipantDialog}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmitParticipant}
                        variant="contained"
                        disabled={
                            participantLoading ||
                            (participantType === 'individual' &&
                                (!newParticipant.first_name.trim() || !newParticipant.last_name.trim())) ||
                            (participantType === 'team' &&
                                (!newParticipant.team_name.trim() ||
                                    newParticipant.team_players.length < (tournament.team_size || 2)))
                        }
                    >
                        {participantLoading ? (
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                        ) : null}
                        Create {participantType === 'individual' ? 'Player' : 'Team'}
                    </Button>
                </DialogActions>
            </Dialog>

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
                                                        secondary={{
                                                            props: {
                                                                variant: 'body2',
                                                                color: 'text.secondary'
                                                            },
                                                            children: [
                                                                team.description || 'No description',
                                                                `${team.players?.length || 0} players`,
                                                                team.players && team.players.length > 0 && (
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
                                                                )
                                                            ]
                                                        }}
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

            {/* Create New Player Dialog */}
            <Dialog
                open={showCreatePlayerDialog}
                onClose={() => {
                    setShowCreatePlayerDialog(false);
                    setNewPlayerForTeam({
                        first_name: '',
                        last_name: '',
                        email: '',
                        phone: '',
                        handicap: ''
                    });
                    setParticipantError(null);
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonAddIcon sx={{ mr: 1 }} />
                        Create New Player
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {participantError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {participantError}
                        </Alert>
                    )}

                    <Box
                        component="form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (newPlayerForTeam.first_name.trim() && newPlayerForTeam.last_name.trim()) {
                                handleCreateNewPlayerForTeam();
                            }
                        }}
                    >
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="First Name"
                                    value={newPlayerForTeam.first_name}
                                    onChange={(e) => setNewPlayerForTeam({
                                        ...newPlayerForTeam,
                                        first_name: e.target.value
                                    })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newPlayerForTeam.first_name.trim() && newPlayerForTeam.last_name.trim()) {
                                            e.preventDefault();
                                            handleCreateNewPlayerForTeam();
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
                                    value={newPlayerForTeam.last_name}
                                    onChange={(e) => setNewPlayerForTeam({
                                        ...newPlayerForTeam,
                                        last_name: e.target.value
                                    })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newPlayerForTeam.first_name.trim() && newPlayerForTeam.last_name.trim()) {
                                            e.preventDefault();
                                            handleCreateNewPlayerForTeam();
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
                                    value={newPlayerForTeam.email}
                                    onChange={(e) => setNewPlayerForTeam({
                                        ...newPlayerForTeam,
                                        email: e.target.value
                                    })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newPlayerForTeam.first_name.trim() && newPlayerForTeam.last_name.trim()) {
                                            e.preventDefault();
                                            handleCreateNewPlayerForTeam();
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Phone"
                                    value={newPlayerForTeam.phone}
                                    onChange={(e) => setNewPlayerForTeam({
                                        ...newPlayerForTeam,
                                        phone: e.target.value
                                    })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newPlayerForTeam.first_name.trim() && newPlayerForTeam.last_name.trim()) {
                                            e.preventDefault();
                                            handleCreateNewPlayerForTeam();
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
                                    value={newPlayerForTeam.handicap}
                                    onChange={(e) => setNewPlayerForTeam({
                                        ...newPlayerForTeam,
                                        handicap: e.target.value
                                    })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newPlayerForTeam.first_name.trim() && newPlayerForTeam.last_name.trim()) {
                                            e.preventDefault();
                                            handleCreateNewPlayerForTeam();
                                        }
                                    }}
                                    helperText="Optional"
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setShowCreatePlayerDialog(false);
                            setNewPlayerForTeam({
                                first_name: '',
                                last_name: '',
                                email: '',
                                phone: '',
                                handicap: ''
                            });
                            setParticipantError(null);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateNewPlayerForTeam}
                        variant="contained"
                        disabled={!newPlayerForTeam.first_name.trim() || !newPlayerForTeam.last_name.trim()}
                    >
                        Create Player
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default TournamentParticipants;