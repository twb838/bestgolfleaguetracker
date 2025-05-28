import React, { useState, useEffect } from 'react';
import {
    Typography, Button, Box, Paper, Grid, Card, CardContent, CardActions,
    CircularProgress, Chip, IconButton, Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Event as EventIcon,
    EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import env from '../../config/env';

function Tournaments() {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${env.API_BASE_URL}/tournaments`);
            if (response.ok) {
                const data = await response.json();
                setTournaments(data);
            } else {
                console.error('Failed to fetch tournaments');
            }
        } catch (error) {
            console.error('Error fetching tournaments:', error);
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
            ) : tournaments.length > 0 ? (
                <Grid container spacing={3}>
                    {tournaments.map((tournament) => (
                        <Grid item xs={12} sm={6} md={4} key={tournament.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    '&:hover': {
                                        boxShadow: 6
                                    }
                                }}
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
                                        Format: {tournament.format}
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Flights: {tournament.number_of_flights || 'None'}
                                    </Typography>

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
                                        onClick={() => handleOpenTournament(tournament.id)}
                                    >
                                        Manage
                                    </Button>
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