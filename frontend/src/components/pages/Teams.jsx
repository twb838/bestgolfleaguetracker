import React, { useState, useEffect, useCallback } from 'react';
import {
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Paper,
    IconButton,
    Box,
    Divider,
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Remove as RemoveIcon,
    Delete as DeleteIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import env from '../../config/env';
import debounce from 'lodash/debounce';

function Teams() {
    const [teams, setTeams] = useState([]);
    const [open, setOpen] = useState(false);
    const [newTeam, setNewTeam] = useState({
        name: '',
        players: [{ first_name: '', last_name: '', email: '', handicap: '' }]
    });
    const [emailErrors, setEmailErrors] = useState({});
    const [formError, setFormError] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState('');

    const [editMode, setEditMode] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editTeam, setEditTeam] = useState(null);
    const [editError, setEditError] = useState('');

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const response = await fetch(env.API_ENDPOINTS.TEAMS);
            const data = await response.json();
            setTeams(data);
        } catch (error) {
            console.error('Error fetching teams:', error);
        }
    };

    const validateEmails = () => {
        const emails = newTeam.players.map(p => p.email.toLowerCase().trim());
        const duplicates = emails.filter((email, index) =>
            email && emails.indexOf(email) !== index
        );

        let errors = {};
        if (duplicates.length > 0) {
            newTeam.players.forEach((player, index) => {
                if (duplicates.includes(player.email.toLowerCase().trim())) {
                    errors[index] = "Email already used in this form";
                }
            });
        }

        setEmailErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const checkExistingEmail = useCallback(async (email, index) => {
        if (!email || email.trim() === '') return false;

        try {
            const response = await fetch(`${env.API_ENDPOINTS.TEAMS}/check-email?email=${encodeURIComponent(email)}`);

            if (response.status === 422) {
                setEmailErrors(prev => ({ ...prev, [index]: "Invalid email format" }));
                return true;
            }

            if (!response.ok) {
                console.error('Error checking email:', response.statusText);
                return false;
            }

            const data = await response.json();

            if (data.exists) {
                setEmailErrors(prev => ({ ...prev, [index]: "Email already registered" }));
                return true;
            } else {
                setEmailErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[index];
                    return newErrors;
                });
                return false;
            }
        } catch (error) {
            console.error('Error checking email:', error);
            return false;
        }
    }, []);

    const debouncedCheckEmail = useCallback(
        debounce(checkExistingEmail, 500),
        [checkExistingEmail]
    );

    const handleAddPlayer = () => {
        setNewTeam({
            ...newTeam,
            players: [...newTeam.players, { first_name: '', last_name: '', email: '', handicap: '' }]
        });
    };

    const handleRemovePlayer = (index) => {
        const updatedPlayers = newTeam.players.filter((_, i) => i !== index);
        setNewTeam({ ...newTeam, players: updatedPlayers });

        setEmailErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[index];
            return newErrors;
        });
    };

    const handlePlayerChange = async (index, field, value) => {
        const updatedPlayers = newTeam.players.map((player, i) => {
            if (i === index) {
                return { ...player, [field]: value };
            }
            return player;
        });
        setNewTeam({ ...newTeam, players: updatedPlayers });

        if (field === 'email' && value.trim() !== '') {
            debouncedCheckEmail(value, index);
        }
    };

    const handleAddTeam = async () => {
        setFormError('');

        if (!validateEmails()) {
            setFormError('Please fix the duplicate email addresses');
            return;
        }

        const emailChecks = await Promise.all(
            newTeam.players.map((player, index) =>
                checkExistingEmail(player.email, index)
            )
        );

        if (emailChecks.some(exists => exists)) {
            setFormError('One or more email addresses are already registered');
            return;
        }

        try {
            const response = await fetch(env.API_ENDPOINTS.TEAMS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newTeam),
            });

            if (response.ok) {
                setOpen(false);
                setNewTeam({
                    name: '',
                    players: [{ first_name: '', last_name: '', email: '', handicap: '' }]
                });
                setEmailErrors({});
                setFormError('');
                fetchTeams();
            } else {
                const errorData = await response.json();
                setFormError(errorData.detail || 'Error creating team');
            }
        } catch (error) {
            console.error('Error adding team:', error);
            setFormError('Network error. Please try again.');
        }
    };

    const hasFormErrors = () => {
        return (
            !newTeam.name ||
            newTeam.players.some(p => !p.first_name || !p.last_name || !p.email) ||
            Object.keys(emailErrors).length > 0
        );
    };

    const handleDeleteTeam = async () => {
        try {
            const response = await fetch(`${env.API_ENDPOINTS.TEAMS}/${teamToDelete.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setDeleteDialogOpen(false);
                setTeamToDelete(null);
                fetchTeams();
            } else {
                const errorData = await response.json();
                setDeleteError(errorData.detail || 'Error deleting team');
            }
        } catch (error) {
            console.error('Error deleting team:', error);
            setDeleteError('Network error. Please try again.');
        }
    };

    const handleEditTeam = (team) => {
        setEditTeam({
            id: team.id,
            name: team.name,
            players: team.players ? [...team.players] : []
        });
        setEditOpen(true);
        setEmailErrors({});
        setEditError('');
    };

    const handleEditRemovePlayer = (playerId) => {
        setEditTeam({
            ...editTeam,
            players: editTeam.players.filter(player => player.id !== playerId)
        });
    };

    const handleEditAddPlayer = () => {
        setEditTeam({
            ...editTeam,
            players: [
                ...editTeam.players,
                { first_name: '', last_name: '', email: '', handicap: '' }
            ]
        });
    };

    const handleEditPlayerChange = (index, field, value) => {
        const updatedPlayers = editTeam.players.map((player, i) => {
            if (i === index) {
                return { ...player, [field]: value };
            }
            return player;
        });

        setEditTeam({ ...editTeam, players: updatedPlayers });

        if (field === 'email' && value.trim() !== '') {
            if (!editTeam.players[index].id) {
                debouncedCheckEmail(value, `edit_${index}`);
            }
        }
    };

    const handleEditSubmit = async () => {
        setEditError('');

        const newPlayers = editTeam.players.filter(p => !p.id);
        if (newPlayers.length > 0) {
            const emailChecks = await Promise.all(
                newPlayers.map((player, index) => {
                    const originalIndex = editTeam.players.findIndex(p => p === player);
                    return checkExistingEmail(player.email, `edit_${originalIndex}`);
                })
            );

            if (emailChecks.some(exists => exists)) {
                setEditError('One or more new player emails are already registered');
                return;
            }
        }

        try {
            const teamResponse = await fetch(`${env.API_ENDPOINTS.TEAMS}/${editTeam.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: editTeam.name }),
            });

            if (!teamResponse.ok) {
                const errorData = await teamResponse.json();
                setEditError(errorData.detail || 'Error updating team');
                return;
            }

            for (const player of editTeam.players) {
                if (player.id) {
                    await fetch(`${env.API_ENDPOINTS.TEAMS}/players/${player.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            first_name: player.first_name,
                            last_name: player.last_name,
                            email: player.email,
                            handicap: player.handicap
                        }),
                    });
                } else {
                    await fetch(`${env.API_ENDPOINTS.TEAMS}/${editTeam.id}/players`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            first_name: player.first_name,
                            last_name: player.last_name,
                            email: player.email,
                            handicap: player.handicap
                        }),
                    });
                }
            }

            setEditOpen(false);
            setEditTeam(null);
            fetchTeams();
        } catch (error) {
            console.error('Error updating team:', error);
            setEditError('Network error. Please try again.');
        }
    };

    const hasEditFormErrors = () => {
        return (
            !editTeam.name ||
            editTeam.players.some(p => !p.first_name || !p.last_name || !p.email) ||
            Object.keys(emailErrors).some(key => key.startsWith('edit_'))
        );
    };

    return (
        <div>
            <Typography variant="h4" gutterBottom>
                Teams
            </Typography>
            <Button
                variant="contained"
                color="primary"
                onClick={() => setOpen(true)}
                sx={{ mb: 3 }}
            >
                Add New Team
            </Button>

            <Paper>
                {teams.length > 0 ? (
                    <List>
                        {teams.map((team) => (
                            <ListItem
                                key={team.id}
                                button
                                onClick={() => handleEditTeam(team)}
                            >
                                <ListItemText
                                    primary={team.name}
                                    secondary={`Players: ${team.players?.length || 0}`}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        color="primary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditTeam(team);
                                        }}
                                        sx={{ mr: 1 }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        edge="end"
                                        color="error"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setTeamToDelete(team);
                                            setDeleteDialogOpen(true);
                                        }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        p={4}
                        textAlign="center"
                    >
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                            No Teams Created
                        </Typography>
                        <Typography variant="body1" color="textSecondary">
                            Create your first team by clicking the "Add New Team" button above.
                        </Typography>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => setOpen(true)}
                            sx={{ mt: 3 }}
                        >
                            Create Team
                        </Button>
                    </Box>
                )}
            </Paper>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Add New Team</DialogTitle>
                <DialogContent>
                    {formError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {formError}
                        </Alert>
                    )}

                    <TextField
                        autoFocus
                        margin="dense"
                        label="Team Name"
                        fullWidth
                        value={newTeam.name}
                        onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                        sx={{ mb: 3 }}
                        required
                    />

                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Players
                        <IconButton
                            color="primary"
                            onClick={handleAddPlayer}
                            size="small"
                            sx={{ ml: 1 }}
                        >
                            <AddIcon />
                        </IconButton>
                    </Typography>

                    {newTeam.players.map((player, index) => (
                        <Box key={index} sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle1">
                                    Player {index + 1}
                                </Typography>
                                <IconButton
                                    color="error"
                                    onClick={() => handleRemovePlayer(index)}
                                    size="small"
                                    sx={{ ml: 1 }}
                                    disabled={newTeam.players.length === 1}
                                >
                                    <RemoveIcon />
                                </IconButton>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    label="First Name"
                                    value={player.first_name}
                                    onChange={(e) => handlePlayerChange(index, 'first_name', e.target.value)}
                                    size="small"
                                    required
                                />
                                <TextField
                                    label="Last Name"
                                    value={player.last_name}
                                    onChange={(e) => handlePlayerChange(index, 'last_name', e.target.value)}
                                    size="small"
                                    required
                                />
                                <TextField
                                    label="Email"
                                    type="email"
                                    value={player.email}
                                    onChange={(e) => handlePlayerChange(index, 'email', e.target.value)}
                                    size="small"
                                    required
                                    error={!!emailErrors[index]}
                                    helperText={emailErrors[index] || ''}
                                />
                                <TextField
                                    label="Handicap"
                                    type="number"
                                    value={player.handicap}
                                    onChange={(e) => handlePlayerChange(index, 'handicap', e.target.value)}
                                    size="small"
                                />
                            </Box>
                            {index < newTeam.players.length - 1 && (
                                <Divider sx={{ mt: 2 }} />
                            )}
                        </Box>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleAddTeam}
                        color="primary"
                        disabled={hasFormErrors()}
                    >
                        Add Team
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Delete Team</DialogTitle>
                <DialogContent>
                    {deleteError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {deleteError}
                        </Alert>
                    )}
                    <Typography>
                        Are you sure you want to delete the team "{teamToDelete?.name}"?
                    </Typography>
                    <Typography color="error" sx={{ mt: 2 }}>
                        This will also delete all {teamToDelete?.players?.length || 0} players associated with this team.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleDeleteTeam}
                        color="error"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={editOpen}
                onClose={() => setEditOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Edit Team</DialogTitle>
                <DialogContent>
                    {editError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {editError}
                        </Alert>
                    )}

                    <TextField
                        autoFocus
                        margin="dense"
                        label="Team Name"
                        fullWidth
                        value={editTeam?.name || ''}
                        onChange={(e) => setEditTeam({ ...editTeam, name: e.target.value })}
                        sx={{ mb: 3 }}
                        required
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">
                            Players
                        </Typography>
                        <Button
                            startIcon={<AddIcon />}
                            onClick={handleEditAddPlayer}
                            variant="outlined"
                            size="small"
                        >
                            Add Player
                        </Button>
                    </Box>

                    {editTeam?.players?.map((player, index) => (
                        <Box key={player.id || `new-${index}`} sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle1">
                                    {player.id ? `Player ID: ${player.id}` : 'New Player'}
                                </Typography>
                                {player.id && (
                                    <IconButton
                                        color="error"
                                        onClick={() => handleEditRemovePlayer(player.id)}
                                        size="small"
                                        sx={{ ml: 1 }}
                                    >
                                        <RemoveIcon />
                                    </IconButton>
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    label="First Name"
                                    value={player.first_name}
                                    onChange={(e) => handleEditPlayerChange(index, 'first_name', e.target.value)}
                                    size="small"
                                    required
                                />
                                <TextField
                                    label="Last Name"
                                    value={player.last_name}
                                    onChange={(e) => handleEditPlayerChange(index, 'last_name', e.target.value)}
                                    size="small"
                                    required
                                />
                                <TextField
                                    label="Email"
                                    type="email"
                                    value={player.email}
                                    onChange={(e) => handleEditPlayerChange(index, 'email', e.target.value)}
                                    size="small"
                                    required
                                    error={!!emailErrors[`edit_${index}`]}
                                    helperText={emailErrors[`edit_${index}`] || ''}
                                    disabled={!!player.id}
                                />
                                <TextField
                                    label="Handicap"
                                    type="number"
                                    value={player.handicap}
                                    onChange={(e) => handleEditPlayerChange(index, 'handicap', e.target.value)}
                                    size="small"
                                />
                            </Box>
                            {index < editTeam.players.length - 1 && (
                                <Divider sx={{ mt: 2 }} />
                            )}
                        </Box>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleEditSubmit}
                        color="primary"
                        disabled={editTeam && hasEditFormErrors()}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default Teams;