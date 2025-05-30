import React, { useState, useEffect } from 'react';
import {
    Typography, Button, Box, Paper, Grid, Card, CardContent, CardActions,
    CircularProgress, Chip, IconButton, Tooltip, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, FormControl, InputLabel,
    Select, MenuItem, List, ListItem, ListItemText, ListItemSecondaryAction,
    Divider, Alert, Autocomplete
} from '@mui/material';
import {
    Add as AddIcon,
    Event as EventIcon,
    EmojiEvents as TrophyIcon,
    Group as GroupIcon,
    PersonAdd as PersonAddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { get, post } from '../../../services/api';

function Tournaments() {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [teamDialogOpen, setTeamDialogOpen] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState(null);

    // Team management state
    const [existingTeams, setExistingTeams] = useState([]);
    const [availablePlayers, setAvailablePlayers] = useState([]);
    const [teamsLoading, setTeamsLoading] = useState(false);
    const [teamError, setTeamError] = useState(null);

    // New team creation state
    const [newTeam, setNewTeam] = useState({
        name: '',
        description: '',
        players: []
    });
    const [isCreatingNewTeam, setIsCreatingNewTeam] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchTournaments();
    }, []);

    // Replace the existing fetchTournaments function with this enhanced version:
    const fetchTournaments = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching tournaments...');

            const data = await get('/tournaments');
            console.log('Raw tournament data:', data);

            // Fetch participant and team data for each tournament
            const tournamentsWithDetails = await Promise.all(
                data.map(async (tournament) => {
                    try {
                        console.log(`Fetching details for tournament ${tournament.id} (${tournament.name})`);

                        const [participants, teams] = await Promise.all([
                            get(`/tournaments/${tournament.id}/participants`).catch((err) => {
                                console.error(`Error fetching participants for tournament ${tournament.id}:`, err);
                                return [];
                            }),
                            get(`/tournaments/${tournament.id}/teams`).catch((err) => {
                                console.error(`Error fetching teams for tournament ${tournament.id}:`, err);
                                return [];
                            })
                        ]);

                        console.log(`Tournament ${tournament.id} participants:`, participants);
                        console.log(`Tournament ${tournament.id} teams:`, teams);

                        return {
                            ...tournament,
                            individual_participants: participants,
                            teams: teams
                        };
                    } catch (error) {
                        console.error(`Error fetching details for tournament ${tournament.id}:`, error);
                        return {
                            ...tournament,
                            individual_participants: [],
                            teams: []
                        };
                    }
                })
            );

            console.log('Tournaments with details:', tournamentsWithDetails);
            setTournaments(tournamentsWithDetails);
        } catch (error) {
            console.error('Error fetching tournaments:', error);
            setError(error.message || 'Failed to fetch tournaments');
        } finally {
            setLoading(false);
        }
    };

    // Update the fetchTeamsAndPlayers function to also get current tournament teams
    const fetchTeamsAndPlayers = async () => {
        try {
            setTeamsLoading(true);
            setTeamError(null);

            const [teamsData, playersData, tournamentTeams] = await Promise.all([
                get('/teams'),
                get('/players'),
                selectedTournament ? get(`/tournaments/${selectedTournament.id}/teams`) : Promise.resolve([])
            ]);

            setExistingTeams(teamsData);
            setAvailablePlayers(playersData);

            // Update the selected tournament with current teams
            if (selectedTournament) {
                setSelectedTournament({
                    ...selectedTournament,
                    currentTeams: tournamentTeams
                });
            }
        } catch (error) {
            console.error('Error fetching teams and players:', error);
            setTeamError(error.message || 'Failed to fetch teams and players');
        } finally {
            setTeamsLoading(false);
        }
    };

    const handleCreateTournament = () => {
        navigate('/tournaments/create');
    };

    const handleOpenTournament = (id) => {
        navigate(`/tournaments/${id}`);
    };

    const handleManageTeams = (tournament) => {
        setSelectedTournament(tournament);
        setTeamDialogOpen(true);
        fetchTeamsAndPlayers();
    };

    const handleCloseTeamDialog = () => {
        setTeamDialogOpen(false);
        setSelectedTournament(null);
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
            await post(`/tournaments/${selectedTournament.id}/teams/${team.id}`);

            // Refresh tournament data
            fetchTournaments();

            // Show success message or close dialog
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

            const createdTeam = await post('/teams', teamData);

            // Add the new team to the tournament
            await post(`/tournaments/${selectedTournament.id}/teams/${createdTeam.id}`);

            // Refresh tournament data
            fetchTournaments();

            // Reset form and close dialog
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

    // Add this new function to fetch detailed tournament data including teams
    const fetchTournamentDetails = async (tournamentId) => {
        try {
            const [participants, teams] = await Promise.all([
                get(`/tournaments/${tournamentId}/participants`),
                get(`/tournaments/${tournamentId}/teams`)
            ]);

            return { participants, teams };
        } catch (error) {
            console.error('Error fetching tournament details:', error);
            return { participants: [], teams: [] };
        }
    };

    // Helper to format dates
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            return format(parseISO(dateString), 'MMM d, yyyy');
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    };

    // Helper to get status chip for tournament
    const getStatusChip = (tournament) => {
        const today = new Date();
        const startDate = parseISO(tournament.start_date);
        const endDate = parseISO(tournament.end_date);

        if (today < startDate) {
            return <Chip size="small" label="Upcoming" color="primary" />;
        } else if (today > endDate) {
            return <Chip size="small" label="Completed" color="success" />;
        } else {
            return <Chip size="small" label="In Progress" color="warning" />;
        }
    };

    const handleRetry = () => {
        fetchTournaments();
    };

    // Add a function to remove teams from tournament
    const handleRemoveTeamFromTournament = async (team) => {
        try {
            // Use the API service delete function if available, or fix the URL
            // Option 1: If you have a delete function in your API service
            // await del(`/tournaments/${selectedTournament.id}/teams/${team.id}`);

            // Option 2: Fix the fetch URL (remove hardcoded /api/)
            const response = await fetch(`/tournaments/${selectedTournament.id}/teams/${team.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    // Add any auth headers that your API service normally includes
                    // You may need to get these from your auth context or token storage
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to remove team from tournament: ${errorText}`);
            }

            // Refresh data
            await fetchTournaments();
            await fetchTeamsAndPlayers();

            console.log(`Team ${team.name} removed from tournament`);
        } catch (error) {
            console.error('Error removing team from tournament:', error);
            setTeamError(error.message || 'Failed to remove team from tournament');
        }
    };

    return (
        <div>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Tournaments
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateTournament}
                >
                    Create Tournament
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="error" paragraph>
                        Error Loading Tournaments
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        {error}
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={handleRetry}
                        sx={{ mr: 2 }}
                    >
                        Try Again
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleCreateTournament}
                    >
                        Create Tournament
                    </Button>
                </Paper>
            ) : tournaments.length > 0 ? (
                <Grid container spacing={3}>
                    {tournaments.map((tournament) => (
                        <Grid item xs={12} sm={6} md={4} key={tournament.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        boxShadow: 6
                                    }
                                }}
                                onClick={() => handleOpenTournament(tournament.id)}
                            >
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="h6" component="h2" gutterBottom>
                                            {tournament.name}
                                        </Typography>
                                        {getStatusChip(tournament)}
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <EventIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {formatDate(tournament.start_date)}
                                            {tournament.start_date !== tournament.end_date &&
                                                ` - ${formatDate(tournament.end_date)}`}
                                        </Typography>
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Format: {tournament.format || 'Not specified'}
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Type: {tournament.participant_type || 'Individual'}
                                    </Typography>

                                    {/* Show participant count */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        <GroupIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {console.log(`Tournament ${tournament.id} display data:`, {
                                                participants: tournament.individual_participants,
                                                teams: tournament.teams,
                                                participantCount: tournament.individual_participants?.length,
                                                teamCount: tournament.teams?.length
                                            })}
                                            {tournament.individual_participants?.length || 0} players
                                            {tournament.teams?.length > 0 && `, ${tournament.teams.length} teams`}
                                        </Typography>
                                    </Box>

                                    {/* Show teams if any */}
                                    {tournament.teams && tournament.teams.length > 0 && (
                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="caption" color="text.secondary" gutterBottom>
                                                Teams:
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                                {tournament.teams.slice(0, 3).map((team) => (
                                                    <Chip
                                                        key={team.id}
                                                        label={team.name}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontSize: '0.7rem' }}
                                                    />
                                                ))}
                                                {tournament.teams.length > 3 && (
                                                    <Chip
                                                        label={`+${tournament.teams.length - 3} more`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontSize: '0.7rem' }}
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                    )}

                                    {tournament.description && (
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                mt: 1,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                            }}
                                        >
                                            {tournament.description}
                                        </Typography>
                                    )}
                                </CardContent>
                                <CardActions>
                                    <Button
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenTournament(tournament.id);
                                        }}
                                    >
                                        Manage
                                    </Button>

                                    {/* Debug: Let's see what participant_type we're getting */}
                                    {console.log('Tournament participant_type:', tournament.participant_type)}

                                    {/* More inclusive condition for team management */}
                                    {(tournament.participant_type === 'team' ||
                                        tournament.participant_type === 'mixed' ||
                                        tournament.participant_type === 'teams' || // Alternative naming
                                        !tournament.participant_type) && ( // Show for undefined/null as fallback
                                            <Tooltip title="Manage Teams">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleManageTeams(tournament);
                                                    }}
                                                    color="primary"
                                                >
                                                    <GroupIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                    <Tooltip title="View Details">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenTournament(tournament.id);
                                            }}
                                        >
                                            <TrophyIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <TrophyIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" paragraph>
                        No tournaments yet
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        Create your first tournament to start organizing golf events.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreateTournament}
                    >
                        Create Tournament
                    </Button>
                </Paper>
            )}

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
                        Manage Teams - {selectedTournament?.name}
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
                            {selectedTournament?.currentTeams && selectedTournament.currentTeams.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Current Teams in Tournament ({selectedTournament.currentTeams.length})
                                    </Typography>
                                    <Paper sx={{ p: 2, backgroundColor: 'action.hover' }}>
                                        <List dense>
                                            {selectedTournament.currentTeams.map((team) => (
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
                                // Existing Teams Section (filter out teams already in tournament)
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Available Teams
                                    </Typography>

                                    {(() => {
                                        const currentTeamIds = selectedTournament?.currentTeams?.map(t => t.id) || [];
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
        </div>
    );
}

export default Tournaments;