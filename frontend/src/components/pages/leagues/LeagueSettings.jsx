import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Paper, Typography, Button, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    Chip, Grid, Divider, Card, CardContent, CardHeader
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Save as SaveIcon,
    Person as PersonIcon,
    Settings as SettingsIcon,
    Edit as EditIcon,
    Cancel as CancelIcon,
    Calculate as CalculateIcon,
    AutoFixHigh as AutoFixHighIcon
} from '@mui/icons-material';
import { get, put, post } from '../../../services/api';

const LeagueSettings = () => {
    const { leagueId } = useParams();
    const navigate = useNavigate();

    // State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [calculatingHandicaps, setCalculatingHandicaps] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [league, setLeague] = useState(null);
    const [players, setPlayers] = useState([]);
    const [originalHandicaps, setOriginalHandicaps] = useState({});
    const [handicapChanges, setHandicapChanges] = useState({});
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [handicapUpdateDialogOpen, setHandicapUpdateDialogOpen] = useState(false);

    useEffect(() => {
        fetchLeagueSettings();
    }, [leagueId]);

    // Fetch league settings and all players
    const fetchLeagueSettings = async () => {
        setLoading(true);
        try {
            // Fetch league details
            const leagueData = await get(`/leagues/${leagueId}`);
            setLeague(leagueData);

            // Fetch all players from all teams in the league
            const allPlayers = [];
            const handicapMap = {};

            if (leagueData.teams && leagueData.teams.length > 0) {
                leagueData.teams.forEach(team => {
                    if (team.players && team.players.length > 0) {
                        team.players.forEach(player => {
                            // Avoid duplicates if a player is on multiple teams
                            if (!allPlayers.find(p => p.id === player.id)) {
                                allPlayers.push({
                                    ...player,
                                    team_name: team.name,
                                    team_id: team.id
                                });
                                handicapMap[player.id] = player.handicap || 0;
                            }
                        });
                    }
                });
            }

            // Sort players by team name, then by player name
            allPlayers.sort((a, b) => {
                if (a.team_name !== b.team_name) {
                    return a.team_name.localeCompare(b.team_name);
                }
                const nameA = `${a.first_name} ${a.last_name}`.trim();
                const nameB = `${b.first_name} ${b.last_name}`.trim();
                return nameA.localeCompare(nameB);
            });

            setPlayers(allPlayers);
            setOriginalHandicaps(handicapMap);
        } catch (error) {
            setError('Failed to load league settings');
        } finally {
            setLoading(false);
        }
    };

    // Handle handicap change
    const handleHandicapChange = (playerId, newHandicap) => {
        const numericHandicap = newHandicap === '' ? 0 : parseFloat(newHandicap);

        // Validate handicap (typically -10 to 40 for golf)
        if (numericHandicap < -10 || numericHandicap > 40) {
            return;
        }

        setHandicapChanges(prev => ({
            ...prev,
            [playerId]: numericHandicap
        }));
    };

    // Get current handicap value (changed or original)
    const getCurrentHandicap = (playerId) => {
        return handicapChanges.hasOwnProperty(playerId)
            ? handicapChanges[playerId]
            : originalHandicaps[playerId] || 0;
    };

    // Check if there are any changes
    const hasChanges = () => {
        return Object.keys(handicapChanges).some(playerId => {
            return handicapChanges[playerId] !== originalHandicaps[playerId];
        });
    };

    // Get list of changes for confirmation dialog
    const getChangesList = () => {
        const changes = [];
        Object.keys(handicapChanges).forEach(playerId => {
            const newHandicap = handicapChanges[playerId];
            const oldHandicap = originalHandicaps[playerId];
            if (newHandicap !== oldHandicap) {
                const player = players.find(p => p.id === parseInt(playerId));
                if (player) {
                    changes.push({
                        playerName: `${player.first_name} ${player.last_name}`.trim(),
                        teamName: player.team_name,
                        oldHandicap,
                        newHandicap
                    });
                }
            }
        });
        return changes;
    };

    // Handle save
    const handleSave = () => {
        if (hasChanges()) {
            setConfirmDialogOpen(true);
        }
    };

    // Confirm and save changes
    const confirmSaveChanges = async () => {
        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const changes = getChangesList();

            // Prepare updates array
            const updates = changes.map(change => ({
                player_id: players.find(p =>
                    `${p.first_name} ${p.last_name}`.trim() === change.playerName
                ).id,
                handicap: change.newHandicap
            }));

            // Send bulk update to API
            await put(`/leagues/${leagueId}/player-handicaps`, {
                updates: updates
            });

            // Update original handicaps to reflect saved changes
            const newOriginalHandicaps = { ...originalHandicaps };
            updates.forEach(update => {
                newOriginalHandicaps[update.player_id] = update.handicap;
            });
            setOriginalHandicaps(newOriginalHandicaps);

            // Clear pending changes
            setHandicapChanges({});

            setSuccessMessage(`Successfully updated handicaps for ${changes.length} players`);
            setConfirmDialogOpen(false);

            // Refresh data to ensure consistency
            setTimeout(() => {
                fetchLeagueSettings();
            }, 1000);

        } catch (error) {
            setError('Failed to save handicap changes. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Handle automatic handicap calculation
    const handleCalculateHandicaps = () => {
        setHandicapUpdateDialogOpen(true);
    };

    // Confirm and execute automatic handicap calculation
    const confirmCalculateHandicaps = async () => {
        setCalculatingHandicaps(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await post(`/players/leagues/${leagueId}/update-handicaps`, {});

            setSuccessMessage(
                `Handicap calculation started. ${response.message || 'This may take a few minutes to complete.'}`
            );
            setHandicapUpdateDialogOpen(false);

            // Show additional info if available
            if (response.min_scores_required || response.scores_to_use || response.handicap_percentage) {
                setTimeout(() => {
                    setSuccessMessage(prev =>
                        `${prev} Using ${response.scores_to_use || 'recent'} scores with ${Math.round((response.handicap_percentage || 0.85) * 100)}% factor. Minimum ${response.min_scores_required || 3} scores required.`
                    );
                }, 2000);
            }

            // Refresh data after a delay to see updated handicaps
            setTimeout(() => {
                fetchLeagueSettings();
            }, 5000);

        } catch (error) {
            setError('Failed to calculate handicaps. Please try again.');
        } finally {
            setCalculatingHandicaps(false);
        }
    };

    // Cancel changes
    const handleCancel = () => {
        setHandicapChanges({});
        setError(null);
        setSuccessMessage(null);
    };

    // Navigate back
    const handleBack = () => {
        navigate(`/leagues/${leagueId}/manage`);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error && !league) {
        return (
            <Box sx={{ my: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
                    Back to League
                </Button>
                <Paper sx={{ p: 3, mt: 2, textAlign: 'center' }}>
                    <Typography color="error">{error}</Typography>
                </Paper>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
                    Back to League
                </Button>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<CalculateIcon />}
                        onClick={handleCalculateHandicaps}
                        disabled={calculatingHandicaps}
                        color="secondary"
                    >
                        {calculatingHandicaps ? 'Calculating...' : 'Auto-Calculate Handicaps'}
                    </Button>
                    {hasChanges() && (
                        <Button
                            variant="outlined"
                            startIcon={<CancelIcon />}
                            onClick={handleCancel}
                        >
                            Cancel Changes
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={!hasChanges() || saving}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </Box>
            </Box>

            {/* Title */}
            <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SettingsIcon sx={{ mr: 2 }} />
                League Settings - {league?.name}
            </Typography>

            {/* Success/Error Messages */}
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

            {/* Changes Summary */}
            {hasChanges() && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                        You have unsaved changes for {getChangesList().length} player(s).
                        Click "Save Changes" to apply them.
                    </Typography>
                </Alert>
            )}

            {/* Player Handicaps Section */}
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">
                            Player Handicaps
                        </Typography>
                        <Chip
                            label={`${players.length} players`}
                            size="small"
                            sx={{ ml: 2 }}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<AutoFixHighIcon />}
                            onClick={handleCalculateHandicaps}
                            disabled={calculatingHandicaps}
                            color="secondary"
                        >
                            Auto-Calculate
                        </Button>
                    </Box>
                </Box>

                {players.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        No players found in this league.
                    </Typography>
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Team</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Player Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Current Handicap</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>New Handicap</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {players.map((player) => {
                                    const currentHandicap = getCurrentHandicap(player.id);
                                    const originalHandicap = originalHandicaps[player.id] || 0;
                                    const hasChanged = handicapChanges.hasOwnProperty(player.id) &&
                                        handicapChanges[player.id] !== originalHandicap;

                                    return (
                                        <TableRow
                                            key={player.id}
                                            sx={{
                                                '&:hover': { bgcolor: 'action.hover' },
                                                ...(hasChanged && { bgcolor: 'rgba(25, 118, 210, 0.04)' })
                                            }}
                                        >
                                            <TableCell>
                                                <Chip
                                                    label={player.team_name}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 'medium' }}>
                                                {`${player.first_name} ${player.last_name}`.trim()}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {player.email}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'center' }}>
                                                <Typography variant="body2">
                                                    {originalHandicap}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'center' }}>
                                                <TextField
                                                    type="number"
                                                    value={currentHandicap}
                                                    onChange={(e) => handleHandicapChange(player.id, e.target.value)}
                                                    inputProps={{
                                                        min: -10,
                                                        max: 40,
                                                        step: 0.1,
                                                        style: { textAlign: 'center' }
                                                    }}
                                                    size="small"
                                                    sx={{
                                                        width: '100px',
                                                        '& .MuiOutlinedInput-root': {
                                                            ...(hasChanged && {
                                                                borderColor: 'primary.main',
                                                                bgcolor: 'rgba(25, 118, 210, 0.04)'
                                                            })
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'center' }}>
                                                {hasChanged ? (
                                                    <Chip
                                                        label="Modified"
                                                        size="small"
                                                        color="primary"
                                                        icon={<EditIcon />}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        —
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Help Text */}
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Manual Updates:</strong> Enter handicaps manually and click "Save Changes"
                        <br />
                        <strong>Auto-Calculate:</strong> Automatically calculate handicaps based on recent scores using league settings
                        <br />
                        • Handicaps typically range from -10 to 40
                        • Enter decimal values (e.g., 12.5) for more precise handicaps
                        • Changes are highlighted in blue and must be saved to take effect
                        • Auto-calculated handicaps use your league's scoring history and settings
                    </Typography>
                </Box>
            </Paper>

            {/* Manual Changes Confirmation Dialog */}
            <Dialog
                open={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Confirm Handicap Changes</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        Are you sure you want to update the following handicaps?
                    </Typography>

                    <Box sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
                        {getChangesList().map((change, index) => (
                            <Card key={index} sx={{ mb: 1 }} variant="outlined">
                                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={6}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                {change.playerName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {change.teamName}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                            <Typography variant="body2">
                                                {change.oldHandicap} → <strong>{change.newHandicap}</strong>
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>

                    <Alert severity="info" sx={{ mt: 2 }}>
                        These changes will affect future match calculations and player statistics.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmSaveChanges}
                        variant="contained"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Confirm Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Auto-Calculate Handicaps Confirmation Dialog */}
            <Dialog
                open={handicapUpdateDialogOpen}
                onClose={() => setHandicapUpdateDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalculateIcon sx={{ mr: 1 }} />
                    Auto-Calculate Handicaps
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        This will automatically calculate new handicaps for all eligible players based on their recent scores in this league.
                    </Typography>

                    <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                        <Typography variant="body2">
                            <strong>How it works:</strong>
                            <br />
                            • Uses your league's handicap settings (minimum scores required, recent scores to analyze, handicap percentage)
                            <br />
                            • Calculates based on score differentials vs. course par
                            <br />
                            • Only updates players with sufficient score history
                            <br />
                            • This process may take a few minutes to complete
                        </Typography>
                    </Alert>

                    <Alert severity="warning" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                            <strong>Warning:</strong> This will overwrite current handicaps for players with enough scores.
                            Any unsaved manual changes will be lost.
                        </Typography>
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHandicapUpdateDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmCalculateHandicaps}
                        variant="contained"
                        disabled={calculatingHandicaps}
                        color="secondary"
                        startIcon={<AutoFixHighIcon />}
                    >
                        {calculatingHandicaps ? 'Calculating...' : 'Calculate Handicaps'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LeagueSettings;