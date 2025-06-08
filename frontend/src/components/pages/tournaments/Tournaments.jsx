import React, { useState, useEffect } from 'react';
import {
    Typography, Button, Box, Paper, Grid, Card, CardContent, CardActions,
    CircularProgress, Chip, IconButton, Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Event as EventIcon,
    EmojiEvents as TrophyIcon,
    Group as GroupIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { get } from '../../../services/api';
import TournamentPlayers from './TournamentPlayers';

function Tournaments() {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [showParticipants, setShowParticipants] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchTournaments();
    }, []);

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
                            get(`/tournaments/${tournament.id}/players`).catch((err) => {
                                console.error(`Error fetching players for tournament ${tournament.id}:`, err);
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

    const handleCreateTournament = () => {
        navigate('/tournaments/create');
    };

    const handleOpenTournament = (id) => {
        navigate(`/tournaments/${id}`);
    };

    const handleManageTeams = (tournament) => {
        setSelectedTournament(tournament);
        setShowParticipants(true);
    };

    const handleBackToTournaments = () => {
        setShowParticipants(false);
        setSelectedTournament(null);
    };

    const handleTournamentUpdate = () => {
        // Refresh tournaments data when teams are updated
        fetchTournaments();
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

    // Show participants management view
    if (showParticipants && selectedTournament) {
        return (
            <div>
                <Box sx={{ mb: 3 }}>
                    <Button onClick={handleBackToTournaments} sx={{ mb: 2 }}>
                        ← Back to Tournaments
                    </Button>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {selectedTournament.name} - Team Management
                    </Typography>
                </Box>
                <TournamentPlayers
                    tournament={selectedTournament}
                    onUpdate={handleTournamentUpdate}
                />
            </div>
        );
    }

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

                                    {/* Show team management for team tournaments */}
                                    {(tournament.participant_type === 'team' ||
                                        tournament.participant_type === 'mixed' ||
                                        tournament.participant_type === 'teams' ||
                                        !tournament.participant_type) && (
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
        </div>
    );
}

export default Tournaments;