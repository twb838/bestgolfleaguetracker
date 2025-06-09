import React, { useState, useEffect } from 'react';
import {
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    Collapse,
    IconButton,
    Box,
    Avatar,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Groups as GroupsIcon,
    Person as PersonIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { get } from '../../../services/api';

const Teams = ({ league }) => {
    const [teamsData, setTeamsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedTeams, setExpandedTeams] = useState(new Set());

    // Fetch detailed team data with players using the new endpoint
    useEffect(() => {
        const fetchTeamsData = async () => {
            if (!league?.id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                console.log(`Fetching teams for league ${league.id}`);

                // This now uses the new /leagues/{league_id}/teams endpoint
                const teams = await get(`/leagues/${league.id}/teams`);
                console.log('Fetched teams data:', teams);

                // Filter out substitute players from each team
                const filteredTeams = teams.map(team => ({
                    ...team,
                    players: team.players ? team.players.filter(player => !player.is_substitute) : [],
                    player_count: team.players ? team.players.filter(player => !player.is_substitute).length : 0
                }));

                setTeamsData(filteredTeams);
            } catch (error) {
                console.error('Error fetching teams data:', error);
                setError(error.message || 'Failed to load teams data');
            } finally {
                setLoading(false);
            }
        };

        fetchTeamsData();
    }, [league?.id]);

    const toggleTeamExpansion = (teamId) => {
        const newExpanded = new Set(expandedTeams);
        if (newExpanded.has(teamId)) {
            newExpanded.delete(teamId);
        } else {
            newExpanded.add(teamId);
        }
        setExpandedTeams(newExpanded);
    };

    if (loading) {
        return (
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Teams
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Teams
                </Typography>
                <Alert severity="error">
                    {error}
                </Alert>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Teams ({teamsData.length})
            </Typography>

            {teamsData && teamsData.length > 0 ? (
                <List>
                    {teamsData.map((team) => (
                        <React.Fragment key={team.id}>
                            <ListItem
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': {
                                        backgroundColor: 'action.hover'
                                    }
                                }}
                                onClick={() => toggleTeamExpansion(team.id)}
                            >
                                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                    <GroupsIcon />
                                </Avatar>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {team.name}
                                            </Typography>
                                            <Chip
                                                label={`${team.player_count || 0} players`}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        team.description ? (
                                            <Typography variant="body2" color="text.secondary">
                                                {team.description}
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                No description
                                            </Typography>
                                        )
                                    }
                                />
                                <IconButton>
                                    {expandedTeams.has(team.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </ListItem>

                            {/* Team Players Collapse */}
                            <Collapse in={expandedTeams.has(team.id)} timeout="auto" unmountOnExit>
                                <Box sx={{ pl: 8, pr: 2, pb: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Team Players:
                                    </Typography>
                                    {team.players && team.players.length > 0 ? (
                                        <List dense>
                                            {team.players.map((player) => (
                                                <ListItem key={player.id} sx={{ py: 0.5 }}>
                                                    <PersonIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                                                    <ListItemText
                                                        primary={player.player_name}
                                                        secondary={
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                                {player.handicap !== null && player.handicap !== undefined ? (
                                                                    <Chip
                                                                        label={`HCP: ${player.handicap}`}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        sx={{ fontSize: '0.7rem', height: '20px' }}
                                                                    />
                                                                ) : (
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        No handicap
                                                                    </Typography>
                                                                )}
                                                                {player.email && (
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        • {player.email}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        }
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <Box sx={{ textAlign: 'center', py: 2 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                No regular players assigned to this team
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Collapse>
                        </React.Fragment>
                    ))}
                </List>
            ) : (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <GroupsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                        No teams assigned to this league.
                    </Typography>
                </Paper>
            )}
        </Paper>
    );
};

export default Teams;