import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Button, Chip, Grid, Divider, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    List, ListItem, ListItemText, IconButton, Tooltip, CircularProgress
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Save as SaveIcon,
    GolfCourse as CourseIcon,
    Edit as EditIcon,
    Check as CheckIcon,
    Share as ShareIcon,
    ContentCopy as CopyIcon,
    Message as MessageIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import format from 'date-fns/format';
import { get, post } from '../../../services/api'; // Import API service

const MatchHeader = ({
    match,
    error,
    successMessage,
    saving,
    editMode,
    handleBack,
    handleSaveScores,
    toggleEditMode
}) => {
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [accessTokens, setAccessTokens] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [shareError, setShareError] = useState(null);
    const [copySuccess, setCopySuccess] = useState('');
    const [hasCheckedExistingTokens, setHasCheckedExistingTokens] = useState(false);

    // Fetch existing tokens when dialog opens
    useEffect(() => {
        if (shareDialogOpen && !hasCheckedExistingTokens && match?.id) {
            fetchExistingTokens();
        }
    }, [shareDialogOpen, match, hasCheckedExistingTokens]);

    // Fetch existing tokens using API service
    const fetchExistingTokens = async () => {
        try {
            setIsLoading(true);
            setShareError(null);

            const tokens = await get(`/matches/${match.id}/access-tokens`);
            setAccessTokens(tokens || []);
            setHasCheckedExistingTokens(true);
        } catch (error) {
            // If no tokens exist (404), don't show an error - we'll generate new ones
            if (error.message.includes('404') || error.message.includes('Not Found')) {
                setAccessTokens([]);
            } else {
                setShareError('Error fetching existing links: ' + error.message);
                setAccessTokens([]);
            }
            setHasCheckedExistingTokens(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Generate and fetch access tokens using API service
    const generateAccessTokens = async () => {
        try {
            setIsLoading(true);
            setShareError(null);

            const tokens = await post(`/matches/${match.id}/access-tokens`, {});
            setAccessTokens(tokens || []);

        } catch (error) {
            setShareError('Failed to generate access tokens: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Copy link to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(
            () => {
                setCopySuccess('Copied!');
                setTimeout(() => setCopySuccess(''), 2000);
            },
            () => {
                setCopySuccess('Failed to copy');
            }
        );
    };

    // Open share dialog
    const handleOpenShareDialog = () => {
        setShareDialogOpen(true);
        // We'll let the useEffect trigger the token fetch if needed
    };

    // Close dialog and reset state
    const handleCloseShareDialog = () => {
        setShareDialogOpen(false);
        setCopySuccess('');
    };

    // Share via SMS (mobile only)
    const shareViaSMS = (token) => {
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/score-entry/${match.id}/team/${token.token}`;
        const message = `Enter your scores for the match: ${match.home_team?.name} vs ${match.away_team?.name}. Click here: ${url}`;

        // Mobile SMS link
        window.open(`sms:?body=${encodeURIComponent(message)}`);
    };

    // Get full URL for token
    const getTokenUrl = (token) => {
        const baseUrl = window.location.origin;
        return `${baseUrl}/score-entry/${match.id}/team/${token.token}`;
    };

    return (
        <>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
                    Back
                </Button>

                <Box>
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<ShareIcon />}
                        onClick={handleOpenShareDialog}
                        sx={{ mr: 1 }}
                    >
                        Share Links
                    </Button>

                    {!match.is_completed && (
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveScores}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Scores'}
                        </Button>
                    )}

                    {match.is_completed && (
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={toggleEditMode}
                        >
                            {editMode ? 'Exit Edit Mode' : 'Edit Scores'}
                        </Button>
                    )}
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

            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={8}>
                        <Typography variant="h5" component="h1" gutterBottom>
                            {match.home_team?.name} vs {match.away_team?.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <CourseIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body1" color="text.secondary">
                                {match.course?.name || 'Course not specified'}
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {format(new Date(match.match_date), 'EEEE, MMMM d, yyyy')}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'center' }}>
                        <Chip
                            label={match.is_completed ? "Completed" : "In Progress"}
                            color={match.is_completed ? "success" : "primary"}
                            icon={match.is_completed ? <CheckIcon /> : <EditIcon />}
                            sx={{ mr: 1 }}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Share Links Dialog */}
            <Dialog
                open={shareDialogOpen}
                onClose={handleCloseShareDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ShareIcon sx={{ mr: 1 }} />
                        Share Team Score Entry Links
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {shareError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {shareError}
                        </Alert>
                    )}

                    <Typography variant="body2" paragraph>
                        Share these unique links with each team to allow them to enter their own scores.
                        Each link is team-specific and will only allow editing that team's scores.
                    </Typography>

                    {isLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
                            {accessTokens.length > 0 ? (
                                <List>
                                    {accessTokens.map((token) => (
                                        <ListItem
                                            key={token.team_id}
                                            sx={{
                                                border: '1px solid rgba(0,0,0,0.12)',
                                                borderRadius: 1,
                                                mb: 1
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                                        {token.team_name} Team Link
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Box sx={{ mt: 1 }}>
                                                        <TextField
                                                            fullWidth
                                                            variant="outlined"
                                                            value={getTokenUrl(token)}
                                                            InputProps={{
                                                                readOnly: true,
                                                                endAdornment: (
                                                                    <Box sx={{ display: 'flex' }}>
                                                                        <Tooltip title="Copy to clipboard">
                                                                            <IconButton
                                                                                onClick={() => copyToClipboard(getTokenUrl(token))}
                                                                                edge="end"
                                                                            >
                                                                                <CopyIcon />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                        <Tooltip title="Share via SMS">
                                                                            <IconButton
                                                                                onClick={() => shareViaSMS(token)}
                                                                                edge="end"
                                                                            >
                                                                                <MessageIcon />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </Box>
                                                                ),
                                                            }}
                                                            size="small"
                                                        />

                                                        {token.expires_at && (
                                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                                                                Expires: {new Date(token.expires_at).toLocaleString()}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    No links have been generated yet. Click the "Generate Team Links" button to create share links.
                                </Alert>
                            )}

                            {copySuccess && (
                                <Alert severity="success" sx={{ mt: 2 }}>
                                    {copySuccess}
                                </Alert>
                            )}

                            <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
                                Note: These links will expire 48 hours after the match date.
                            </Typography>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseShareDialog}>
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={accessTokens.length > 0 ? <RefreshIcon /> : null}
                        onClick={generateAccessTokens}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' :
                            accessTokens.length > 0 ? 'Regenerate Links' : 'Generate Team Links'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default MatchHeader;