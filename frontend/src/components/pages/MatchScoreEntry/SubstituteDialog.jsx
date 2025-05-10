import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Typography,
    Box, Button, TextField, Grid, Divider, List, ListItem, ListItemText,
    CircularProgress
} from '@mui/material';

const SubstituteDialog = ({
    open,
    currentSubstitute,
    availablePlayers,
    onClose,
    onApply,
    onSubstituteChange,
    onSelectExistingPlayer
}) => {
    const handleSubstituteChange = (e) => {
        const { name, value } = e.target;
        onSubstituteChange(name, value);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Substitute Player
                {currentSubstitute.originalPlayer && (
                    <Typography variant="subtitle2" color="text.secondary">
                        Replacing: {currentSubstitute.originalPlayer.player_name}
                    </Typography>
                )}
            </DialogTitle>
            <DialogContent dividers>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Select an existing player:
                    </Typography>
                    <Box sx={{ maxHeight: '200px', overflowY: 'auto', mb: 2 }}>
                        {availablePlayers.length > 0 ? (
                            <List dense>
                                {availablePlayers.map(player => (
                                    <ListItem
                                        key={player.id}
                                        button
                                        onClick={() => onSelectExistingPlayer(player.id)}
                                        selected={currentSubstitute.substitute.player_id === player.id}
                                    >
                                        <ListItemText
                                            primary={`${player.first_name} ${player.last_name}`}
                                            secondary={`Handicap: ${player.handicap || 0}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                <CircularProgress size={24} sx={{ mb: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                    Loading players...
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    <Divider sx={{ my: 2 }}>OR</Divider>

                    <Typography variant="subtitle2" gutterBottom>
                        Create a temporary substitute:
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="First Name"
                                name="first_name"
                                value={currentSubstitute.substitute.first_name || ''}
                                onChange={handleSubstituteChange}
                                fullWidth
                                margin="normal"
                                size="small"
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Last Name"
                                name="last_name"
                                value={currentSubstitute.substitute.last_name || ''}
                                onChange={handleSubstituteChange}
                                fullWidth
                                margin="normal"
                                size="small"
                            />
                        </Grid>
                    </Grid>
                    <TextField
                        label="Email"
                        name="email"
                        type="email"
                        value={currentSubstitute.substitute.email || ''}
                        onChange={handleSubstituteChange}
                        fullWidth
                        margin="normal"
                        size="small"
                        helperText="Required for new player"
                        required
                    />
                    <TextField
                        label="Handicap"
                        name="handicap"
                        type="number"
                        value={currentSubstitute.substitute.handicap}
                        onChange={handleSubstituteChange}
                        fullWidth
                        margin="normal"
                        size="small"
                        InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={onApply}
                    disabled={
                        !currentSubstitute.substitute.player_id &&
                        (!currentSubstitute.substitute.first_name || !currentSubstitute.substitute.email)
                    }
                >
                    Apply Substitute
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SubstituteDialog;